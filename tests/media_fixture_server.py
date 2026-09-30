"""Browser integration fixture server; never used by the production debug server.

Generate fast.mp4, tail.mp4, audio.m4a and live.flv in a temporary directory with ffmpeg,
then run: python3 tests/media_fixture_server.py --fixtures /tmp/kaios-fixtures
Open http://127.0.0.1:8088/media-browser.html to test real MSE decoding/seeking.
"""
import argparse
import importlib.util
from pathlib import Path
import re
from http.server import ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('dev_server', ROOT / 'tools/dev_server.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fixtures', required=True, type=Path)
    parser.add_argument('--port', type=int, default=8088)
    args = parser.parse_args()

    class Handler(module.Handler):
        def __init__(self, *handler_args, **kwargs):
            super().__init__(*handler_args, directory=str(ROOT / 'application'), **kwargs)

        def do_GET(self):
            if self.path == '/media-browser.html':
                body = (ROOT / 'tests/media-browser.html').read_bytes()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                super().do_GET()

        def proxy_media(self):
            target = urlsplit(unquote(self.path[len(module.MEDIA_PREFIX):]))
            if target.hostname != 'fixture.bilivideo.com':
                super().proxy_media()
                return
            if target.path not in ('/fast.mp4', '/tail.mp4', '/audio.m4a', '/live.flv'):
                self.send_error(404)
                return
            path = args.fixtures / target.path[1:]
            size = path.stat().st_size
            start, end = 0, size - 1
            match = re.fullmatch(r'bytes=(\d+)-(\d*)', self.headers.get('Range', ''))
            if match:
                start = int(match[1])
                if match[2]:
                    end = min(end, int(match[2]))
            self.send_response(206 if match else 200)
            self.send_header('Content-Type', 'video/x-flv' if path.suffix == '.flv' else 'video/mp4')
            self.send_header('Content-Length', str(end - start + 1))
            if match:
                self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.end_headers()
            try:
                with path.open('rb') as file:
                    file.seek(start)
                    remaining = end - start + 1
                    while remaining:
                        data = file.read(min(16 * 1024, remaining))
                        self.wfile.write(data)
                        self.wfile.flush()
                        remaining -= len(data)
            except (BrokenPipeError, ConnectionResetError):
                pass

    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'Browser media tests: http://127.0.0.1:{args.port}/media-browser.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
