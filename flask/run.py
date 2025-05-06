import signal
import sys
import atexit
from app import create_app
from setup_db import setup_database
from app.server_handler import cleanup_all_servers  # wherever you defined it

# Signal handler to gracefully shutdown
def graceful_exit(signum, frame):
    print("\nReceived signal to shutdown gracefully...")
    cleanup_all_servers()  # Force cleanup servers
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, graceful_exit)  # Ctrl+C
signal.signal(signal.SIGTERM, graceful_exit) # Termination

# Also register cleanup at process exit
atexit.register(cleanup_all_servers)

# Setup database
setup_database()

# Now, run the app
app = create_app()

if __name__ == '__main__':
    print("Starting the backend...")
    app.run(host='0.0.0.0', port=5000, debug=True)