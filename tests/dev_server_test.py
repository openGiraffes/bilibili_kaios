import importlib.util
import io
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

spec = importlib.util.spec_from_file_location('dev_server', Path(__file__).parents[1] / 'tools/dev_server.py')
server_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)


class Response(io.BytesIO):
    code = 206
    headers = {'Content-Type': 'video/mp4', 'Content-Length': '4',
               'Content-Range': 'bytes 10-13/100', 'Accept-Ranges': 'bytes'}


class MediaProxyTest(unittest.TestCase):
    def setUp(self):
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), server_module.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def test_range_and_headers_without_cookie_leak(self):
        target = 'https://v.bilivideo.com/test.mp4?sign=a%2Bb&key=1'
        with patch.object(server_module, 'build_opener') as opener, patch.dict('os.environ', {'BILIBILI_COOKIE': 'secret'}):
            opener.return_value.open.return_value = Response(b'abcd')
            request = Request(self.base + server_module.MEDIA_PREFIX + quote(target, safe=''),
                              headers={'Range': 'bytes=10-13', 'Cookie': 'browser-secret'})
            with urlopen(request) as response:
                self.assertEqual(response.status, 206)
                self.assertEqual(response.headers['Content-Range'], 'bytes 10-13/100')
                self.assertEqual(response.read(), b'abcd')
            upstream = opener.return_value.open.call_args.args[0]
            self.assertEqual(upstream.full_url, target)
            self.assertEqual(upstream.get_header('Range'), 'bytes=10-13')
            self.assertEqual(upstream.get_header('Referer'), 'https://www.bilibili.com/')
            self.assertIsNone(upstream.get_header('Cookie'))

    def test_head_preserves_content_length_without_body(self):
        target = 'https://i0.hdslb.com/image.jpg'
        with patch.object(server_module, 'build_opener') as opener:
            opener.return_value.open.return_value = Response(b'abcd')
            with urlopen(Request(self.base + server_module.MEDIA_PREFIX + quote(target, safe=''), method='HEAD')) as response:
                self.assertEqual(response.headers['Content-Length'], '4')
                self.assertEqual(response.read(), b'')

    def test_rejects_foreign_domains_credentials_and_cross_origin(self):
        for target in ('https://localhost/a', 'https://i0.hdslb.com.evil.test/a',
                       'https://user:pass@i0.hdslb.com/a'):
            with self.assertRaises(HTTPError) as error:
                urlopen(self.base + server_module.MEDIA_PREFIX + quote(target, safe=''))
            self.assertEqual(error.exception.code, 400)
            error.exception.close()
        request = Request(self.base + server_module.MEDIA_PREFIX + quote('https://i0.hdslb.com/a', safe=''),
                          headers={'Origin': 'https://example.org'})
        with self.assertRaises(HTTPError) as error:
            urlopen(request)
        self.assertEqual(error.exception.code, 403)
        error.exception.close()

    def test_redirects_cannot_leave_media_domains(self):
        handler = server_module.MediaRedirects()
        request = Request('https://i0.hdslb.com/a')
        with self.assertRaises(HTTPError) as error:
            handler.redirect_request(request, None, 302, '', {}, 'https://example.org/a')
        error.exception.close()
        redirected = handler.redirect_request(request, None, 302, '', {}, 'https://i1.hdslb.com/a')
        self.assertEqual(redirected.full_url, 'https://i1.hdslb.com/a')


if __name__ == '__main__':
    unittest.main()
