from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from datetime import datetime

LOG_FILE = "button_log.txt"

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            elapsed = data.get("elapsedMillis")
            presses = data.get("buttonPresses")
            
            if elapsed is not None and presses is not None:
                with open(LOG_FILE, "a") as f:
                    log_line = f"{datetime.now().isoformat()} - elapsedMillis: {elapsed}, buttonPresses: {presses}\n"
                    f.write(log_line)

                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"Logged successfully")
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Missing required fields")
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Invalid JSON")

def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler, port=8080):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Server started at http://localhost:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()

