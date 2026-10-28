"""Shared local-only server and configurable Chromium launcher for QA scripts."""
import atexit
import functools
import http.server
import os
from pathlib import Path
import threading


def start_server(root):
    external = os.environ.get('CANXIANG_BASE_URL')
    if external:
        return external.rstrip('/')
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    atexit.register(server.server_close)
    atexit.register(server.shutdown)
    return f'http://127.0.0.1:{server.server_port}'


def launch_browser(playwright):
    executable = os.environ.get('CANXIANG_BROWSER')
    if not executable and os.name == 'nt':
        candidates = [Path(os.environ.get(key, 'C:/Program Files')) / 'Microsoft/Edge/Application/msedge.exe' for key in ['ProgramFiles(x86)', 'ProgramFiles']]
        executable = next((str(path) for path in candidates if path.is_file()), None)
    return playwright.chromium.launch(**({'executable_path': executable} if executable else {}))
