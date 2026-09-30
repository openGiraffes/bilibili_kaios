#!/usr/bin/env python3
"""Serve the KaiOS app and proxy Bilibili API calls for local browser debugging."""

import argparse
import http.cookiejar
import json
import os
from pathlib import Path
import re
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, unquote
from urllib.request import build_opener, HTTPCookieProcessor, HTTPRedirectHandler, Request


PREFIX = '/__bili_proxy__/'
MEDIA_PREFIX = '/__bili_media__/'
HOSTS = {'api.bilibili.com', 'api.live.bilibili.com', 'api.vc.bilibili.com',
         'passport.bilibili.com', 'app.bilibili.com', 'www.bilibili.com',
         'bangumi.bilibili.com'}
USER_AGENT = ('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
              '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
CDN_DOMAINS = {'bilibili.com', 'hdslb.com', 'bilivideo.com', 'bilivideo.cn', 'acgvideo.com', 'szbdyd.com'}


def media_target_allowed(url):
    target = urlsplit(url)
    return (target.scheme == 'https' and not target.username and not target.password
            and target.port in (None, 443, 4483)
            and (target.hostname in HOSTS or any(
                target.hostname and (target.hostname == domain or target.hostname.endswith('.' + domain))
                for domain in CDN_DOMAINS)))


class BiliRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urlsplit(newurl)
        if target.scheme != 'https' or target.netloc not in HOSTS:
            raise HTTPError(req.full_url, 502, 'Unexpected upstream redirect', headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class MediaRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not media_target_allowed(newurl):
            raise HTTPError(req.full_url, 502, 'Unsupported media redirect', headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Handler(SimpleHTTPRequestHandler):
    opener = build_opener(BiliRedirects(), HTTPCookieProcessor(http.cookiejar.CookieJar()))
    upstream_lock = threading.Lock()

    def do_GET(self):
        if self.path.startswith(MEDIA_PREFIX):
            self.proxy_media()
        elif self.path.startswith(PREFIX):
            self.proxy()
        else:
            super().do_GET()

    def do_HEAD(self):
        if self.path.startswith(MEDIA_PREFIX):
            self.proxy_media()
        else:
            super().do_HEAD()

    def do_POST(self):
        if self.path.startswith(PREFIX):
            self.proxy()
        else:
            self.send_error(405)

    def log_message(self, fmt, *args):
        # Login query strings and POST bodies must not end up in terminal logs.
        if self.path.startswith((PREFIX, MEDIA_PREFIX)):
            return
        super().log_message(fmt, *args)

    def proxy_media(self):
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            self.send_error(403, 'Local same-origin requests only')
            return
        sent_headers = False
        try:
            target = unquote(self.path[len(MEDIA_PREFIX):])
            if not media_target_allowed(target) or re.search(r'[\r\n]', target):
                self.send_error(400, 'Unsupported media target')
                return
            headers = {'User-Agent': USER_AGENT, 'Referer': 'https://www.bilibili.com/',
                       'Origin': 'https://www.bilibili.com', 'Accept-Encoding': 'identity'}
            for name in ('Range', 'If-Range', 'Accept'):
                if self.headers.get(name):
                    headers[name] = self.headers[name]
            request = Request(target, headers=headers, method=self.command)
            # A separate, cookieless opener per stream: CDN requests never receive
            # login cookies, and long live streams do not block API/image requests.
            opener = build_opener(MediaRedirects())
            try:
                response = opener.open(request, timeout=30)
            except HTTPError as error:
                response = error
            with response:
                self.send_response(response.code)
                for name in ('Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges',
                             'ETag', 'Last-Modified', 'Content-Encoding'):
                    if response.headers.get(name):
                        self.send_header(name, response.headers[name])
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                sent_headers = True
                if self.command != 'HEAD':
                    while True:
                        chunk = response.read1(64 * 1024)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        self.wfile.flush()
            print(f'Media {self.command} {urlsplit(target).hostname} -> {response.code}', flush=True)
        except (BrokenPipeError, ConnectionResetError):
            # Closing the upstream context above also cancels live playback.
            pass
        except (URLError, TimeoutError, OSError, ValueError) as error:
            if not sent_headers:
                self.send_error(502, 'Local media proxy could not reach Bilibili')
            print(f'Media connection failed: {type(error).__name__}', flush=True)

    def proxy(self):
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            self.send_error(403, 'Local same-origin requests only')
            return
        target = self.path[len(PREFIX):]
        host, separator, rest = target.partition('/')
        if host not in HOSTS or not separator or '#' in rest or re.search(r'[\r\n]', rest):
            self.send_error(400, 'Unsupported Bilibili target')
            return
        headers = {'User-Agent': USER_AGENT, 'Referer': 'https://www.bilibili.com/',
                   'Origin': 'https://www.bilibili.com', 'Accept-Encoding': 'identity'}
        for name in ('Accept', 'Content-Type'):
            if self.headers.get(name):
                headers[name] = self.headers[name]
        cookie = os.environ.get('BILIBILI_COOKIE') or self.headers.get('X-Bili-Cookie')
        if cookie:
            headers['Cookie'] = cookie
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 0 or length > 1024 * 1024:
                self.send_error(413)
                return
            body = self.rfile.read(length) if self.command == 'POST' else None
            # Keep the raw query/body intact: the app signs these parameters.
            request = Request('https://' + host + '/' + rest, data=body,
                              headers=headers, method=self.command)
            with self.upstream_lock:
                try:
                    response = self.opener.open(request, timeout=20)
                except HTTPError as error:
                    response = error
                with response:
                    payload = response.read()
                    status = response.code
                    content_type = response.headers.get('Content-Type', 'application/octet-stream')
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(payload)
            print(f'Proxy {self.command} {host}/{rest.split("?", 1)[0]} -> {status}', flush=True)
        except (URLError, TimeoutError, OSError, ValueError) as error:
            payload = json.dumps({'code': -1, 'message': 'Local proxy could not reach Bilibili'}).encode()
            self.send_response(502)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            print(f'Proxy connection failed: {type(error).__name__}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8086)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent / 'application'
    def handler(*handler_args, **kwargs):
        return Handler(*handler_args, directory=str(root), **kwargs)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    print(f'Local debug: http://127.0.0.1:{args.port}/ (Ctrl+C to stop)', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
