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
from urllib.parse import urlsplit
from urllib.request import build_opener, HTTPCookieProcessor, HTTPRedirectHandler, Request


PREFIX = '/__bili_proxy__/'
HOSTS = {'api.bilibili.com', 'api.live.bilibili.com', 'api.vc.bilibili.com',
         'passport.bilibili.com', 'app.bilibili.com', 'www.bilibili.com',
         'bangumi.bilibili.com'}
USER_AGENT = ('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
              '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')


class BiliRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urlsplit(newurl)
        if target.scheme != 'https' or target.netloc not in HOSTS:
            raise HTTPError(req.full_url, 502, 'Unexpected upstream redirect', headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Handler(SimpleHTTPRequestHandler):
    opener = build_opener(BiliRedirects(), HTTPCookieProcessor(http.cookiejar.CookieJar()))
    upstream_lock = threading.Lock()

    def do_GET(self):
        if self.path.startswith(PREFIX):
            self.proxy()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith(PREFIX):
            self.proxy()
        else:
            self.send_error(405)

    def log_message(self, fmt, *args):
        # Login query strings and POST bodies must not end up in terminal logs.
        if self.path.startswith(PREFIX):
            return
        super().log_message(fmt, *args)

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
