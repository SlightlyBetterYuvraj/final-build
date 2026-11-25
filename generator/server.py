#!/usr/bin/env python3
"""
Standalone Python Generator HTTP Service
Wraps solver.py to provide an HTTP generation endpoint per D45, D47, and docs/03_ARCHITECTURE_AND_RUNTIME.md.
Listens on port 5001 by default (or PORT env var / --port arg).
"""

import argparse
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

try:
    from solver import solve_timetable
except ImportError:
    from generator.solver import solve_timetable


class GeneratorRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/health", "/status"):
            self._send_json(200, {
                "status": "ok",
                "service": "timetable-generator",
                "solver": "ortools-cp-sat",
                "version": "1.0.0"
            })
        else:
            self._send_json(404, {"error": "Not Found", "path": self.path})

    def do_POST(self):
        if self.path in ("/generate", "/generate/"):
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                if content_len <= 0:
                    self._send_json(400, {"error": "Empty request body"})
                    return

                post_body = self.rfile.read(content_len)
                pkg = json.loads(post_body.decode("utf-8"))

                # Invoke solver
                timeout = int(self.headers.get("X-Solver-Timeout", 30))
                result = solve_timetable(pkg, time_limit_seconds=timeout)

                self._send_json(200, result)
            except json.JSONDecodeError as e:
                self._send_json(400, {"error": f"Invalid JSON payload: {str(e)}"})
            except Exception as e:
                self._send_json(500, {"error": f"Solver execution error: {str(e)}"})
        else:
            self._send_json(404, {"error": "Not Found", "path": self.path})

    def log_message(self, format, *args):
        # Concise logging to stdout/stderr
        sys.stderr.write(f"[GeneratorService] {self.address_string()} - {format % args}\n")


def run_server(port: int = 5001, host: str = "127.0.0.1"):
    server_address = (host, port)
    httpd = HTTPServer(server_address, GeneratorRequestHandler)
    print(f"[GeneratorService] Listening on http://{host}:{port}/generate (Health: http://{host}:{port}/health)")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[GeneratorService] Shutting down...")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone Timetable Generator HTTP Server")
    parser.add_argument("--port", "-p", type=int, default=int(os.environ.get("PORT", "5001")), help="Port to listen on (default: 5001)")
    parser.add_argument("--host", "-H", default=os.environ.get("HOST", "127.0.0.1"), help="Host to bind to (default: 127.0.0.1)")
    args = parser.parse_args()

    run_server(port=args.port, host=args.host)
