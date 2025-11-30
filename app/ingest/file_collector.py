import time
import sys
import requests
from datetime import datetime

def tail_file_and_send(path, host, source, server_url):
    with open(path, "r") as f:
        # move to end
        f.seek(0, 2)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue

            event = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "host": host,
                "source": source,
                "source_type": "file",
                "severity": "INFO",
                "message": line.strip(),
                "fields": {
                    # Minimal; in real use you'd parse:
                    "event_type": "generic_log"
                },
            }
            try:
                requests.post(f"{server_url}/events/", json=event, timeout=2)
            except Exception as e:
                # For now, just print errors
                print(f"Error sending event: {e}", file=sys.stderr)
                time.sleep(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python -m app.ingest.file_collector <path> <host> <server_url>")
        print("Example: python -m app.ingest.file_collector /var/log/auth.log myhost http://127.0.0.1:8000")
        sys.exit(1)

    path = sys.argv[1]
    host = sys.argv[2]
    server_url = sys.argv[3]
    tail_file_and_send(path, host, path, server_url)