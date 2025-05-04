import os
import datetime
import subprocess
import threading
import time
import logging
import platform
import atexit
from typing import Dict, List, Optional, Tuple, Any
from app.models.server import Server  # Assuming you have a Server model defined in models.py
from app import socketio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(threadName)s] [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Thread-safe server management
running_servers: Dict[int, Dict] = {}
running_servers_lock = threading.Lock()

# Custom Exceptions
class ServerManagerError(Exception):
    """Base exception for server management errors"""
    pass

class ServerNotFoundError(ServerManagerError):
    """Raised when a server is not found"""
    pass

class ServerAlreadyRunningError(ServerManagerError):
    """Raised when trying to start an already running server"""
    pass

class ServerNotRunningError(ServerManagerError):
    """Raised when trying to stop a non-running server"""
    pass

class ServerCommandError(ServerManagerError):
    """Raised when a command fails to execute"""
    pass

class ServerConfigurationError(ServerManagerError):
    """Raised for configuration-related errors"""
    pass

# Cleanup handler
def cleanup_all_servers():
    """Force stop all running servers when application exits"""
    with running_servers_lock:
        for server_id in list(running_servers.keys()):
            try:
                server_info = running_servers[server_id]
                process = server_info['process']
                
                # Try graceful shutdown first
                try:
                    process.stdin.write("stop\n")
                    process.stdin.flush()
                    process.wait(timeout=10)
                    logger.info(f"Gracefully stopped server {server_id}")
                except (subprocess.TimeoutExpired, IOError):
                    process.kill()
                    logger.warning(f"Forcibly killed server {server_id}")       
                del running_servers[server_id]
            except Exception as e:
                logger.error(f"Error cleaning up server {server_id}: {str(e)}")

atexit.register(cleanup_all_servers)

# Core Functions
def get_server_status(server: Server) -> Dict[str, Any]:
    """
    Get current status of a server - now non-blocking.
    Returns "online" or "offline".
    """
    try:
        # Quick check without lock first
        if server.id not in running_servers:
            return {"status": "offline"}

        # Only lock for the process check
        with running_servers_lock:
            process_info = running_servers.get(server.id, {})
            process = process_info.get('process')
            server_object = process_info.get('server_object')

            if process and process.poll() is None:
                return {"status": server_object.status}  # Server is running, return its status
            else:
                # Process is dead, clean up
                if server.id in running_servers:
                    del running_servers[server.id]
                return {"status": "offline"}
    except Exception as e:
        logger.error(f"Error getting server {server.id} status: {str(e)}", exc_info=True)
        return {"status": "offline", "message": str(e)}

def _monitor_server_output(server: Server, process: subprocess.Popen):
    """
    Thread function to monitor server output
    """
    try:
        #Verify what the hell is going on here:
        log_path = os.path.join(server.path, 'logs', 'latest.log')
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        
        with open(log_path, 'a', encoding='utf-8') as log_file:
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    timestamp = datetime.datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
                    log_line = f"{timestamp} {output.strip()}\n"
                    log_file.write(log_line)
                    logger.info(f"[Server {server.id}] {output.strip()}")
                    
                    # Detect server fully started
                    if "Done (" in output and ")! For help, type \"help\"" in output:
                        logger.info(f"Server {server.id} is online! Updating status...")
                        with running_servers_lock:
                            server_info = running_servers.get(server.id)
                            if server_info:
                                server_info['server_object'].status = "online"
                                server_info['server_object'].updated_at = datetime.datetime.utcnow()
    except Exception as e:
        logger.error(f"Error in output monitoring for server {server.id}: {str(e)}", exc_info=True)
    finally:
        # Ensure process is cleaned up if monitoring stops
        if process.poll() is None:
            process.kill()

def _build_server_command(server: Server) -> List[str]:
    """
    Build the Java command and environment for server startup
    Returns (command_args, environment_vars)
    """
    java_cmd = [
        'java',
        f'-Xmx{server.ram_limit_mb}M',
        f'-Xms{min(1024, server.ram_limit_mb)}M',
        '-jar', 'server.jar',
        'nogui'
    ]
    
    return java_cmd

def _start_server_process(server: Server):
    """
    Internal function to start the server process
    """
    try:
        java_cmd = _build_server_command(server)
        
        process = subprocess.Popen(
            java_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True,
            cwd=server.path
        )

        output_thread = threading.Thread(
            target=_monitor_server_output,
            args=(server, process),
            daemon=True,
            name=f"ServerOutput-{server.id}"
        )
        output_thread.start()

        server.status = "starting"

        with running_servers_lock:
            running_servers[server.id] = {
                'process': process,
                'thread': output_thread,
                'server_object': server,
                'start_time': datetime.datetime.utcnow()
            }

        #process.wait()
        output_thread.join(timeout=5)

    except Exception as e:
        logger.error(f"Error starting server {server.id}: {str(e)}", exc_info=True)
    finally:
        if process.poll() is not None:  # Process has exited
            with running_servers_lock:
                running_servers.pop(server.id, None)

def create_eula_file(path: str):
    """Create eula.txt with EULA accepted."""
    eula_file = os.path.join(path, 'eula.txt')
    with open(eula_file, 'w') as f:
        f.write("eula=true\n")

def create_server_properties_file(server: Server, path: str):
    """Create server.properties with server-specific settings."""
    properties_file = os.path.join(path, 'server.properties')
    
    properties = {
        "server-port": server.port,
        "level-seed": server.seed or "",
        "online-mode": str(server.is_online_mode).lower(),
        "motd": server.name or "Minecraft Server"
    }
    
    with open(properties_file, 'w') as f:
        for key, value in properties.items():
            f.write(f"{key}={value}\n")

def start_server(server: Server) -> Dict[str, Any]:
    """
    Start a Minecraft server.
    Returns dictionary with status information.
    """
    try:
        with running_servers_lock:
            if server.id in running_servers:
                process_info = running_servers[server.id]
                if process_info['process'].poll() is None:
                    raise ServerAlreadyRunningError(f"Server {server.id} is already running")

        os.makedirs(server.path, exist_ok=True)
        server_jar_path = os.path.join(server.path, 'server.jar')

        if not os.path.exists(server_jar_path):
            system_os = platform.system().lower()
            script_dir = os.path.dirname(os.path.abspath(__file__))
            downloader_script = os.path.join(
                script_dir,
                'downloader.bat' if system_os == 'windows' else 'downloader.sh'
            )

            print(f"Downloading server.jar for version: {server.version} on path: {server.path}...")

            result = subprocess.run(
                [downloader_script, server.version, server.path],
                capture_output=True,
                text=True,
                shell=True
            )

            if result.returncode != 0:
                raise ServerCommandError(f"Failed to download server.jar: {result.stderr}")
            
        create_eula_file(server.path)
        create_server_properties_file(server, server.path) #TODO verify if it actually needs to receive the server object
        
        start_thread = threading.Thread(
            target=_start_server_process,
            args=(server,),
            daemon=True,
            name=f"ServerStarter-{server.id}"
        )
        start_thread.start()

        return {"message": "Server is starting...", "data": True}
    
    except ServerAlreadyRunningError as e:
        logger.warning(f"Server {server.id} is already running: {str(e)}")
        return {"message": "Server is already running", "data": False}
    except ServerCommandError as e:
        logger.error(f"Error downloading server.jar: {str(e)}", exc_info=True)
        return {"message": "Failed to download server.jar", "data": False}
    except Exception as e:
        logger.error(f"Error starting server {server.id}: {str(e)}", exc_info=True)
        return {"message": str(e), "data": False}

def stop_server(server: Server, force: bool = False) -> Dict[str, Any]:
    """
    Stop a running server.
    Set force=True to kill the process immediately.
    Returns dictionary with status information.
    """
    try:
        with running_servers_lock:
            process_info = running_servers.get(server.id)
            if not process_info:
                raise ServerNotRunningError(f"Server {server.id} is not running")

            process = process_info['process']
            message = ""

            server_info = running_servers.get(server.id)
            if server_info:
                server_info['server_object'].status = "stopping"
                server_info['server_object'].updated_at = datetime.datetime.utcnow()
            
            if force:
                process.kill()
                message = "Server force stopped"
                logger.info(f"Force stopped server {server.id}")
            else:
                try:
                    process.stdin.write("stop\n")
                    process.stdin.flush()
                    message = "Stop command sent to server"
                    # Wait for clean shutdown (max 15 seconds)
                    try:
                        process.wait(timeout=15)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        message = "Server killed after timeout"
                        logger.warning(f"Server {server.id} did not stop gracefully, killing process")
                except Exception as e:
                    process.kill()
                    message = "Server killed (stop command failed)"
                    logger.error(f"Failed to send stop command to server {server.id}: {str(e)}")

            del running_servers[server.id]

        return {"message": message, "data": True}
    except ServerNotRunningError as e:
        logger.warning(f"Server {server.id} is not running: {str(e)}")
        return {"message": "Server is not running", "data": False}
    except Exception as e:
        logger.error(f"Error stopping server {server.id}: {str(e)}", exc_info=True)
        return {"message": str(e), "data": False}

def restart_server(server: Server) -> Dict[str, Any]:
    """
    Restart a server (stop then start).
    Returns dictionary with status information.
    """
    try:
        stop_server(server)
        
        time.sleep(2)  # Give some time for the server to stop
        
        start_server(server)

        return {"message": "Server is restarting...", "data": True}
    except Exception as e:
        logger.error(f"Error restarting server {server.id}: {str(e)}", exc_info=True)
        return {"message": str(e), "data": False}


def send_command(server: Server, command: str) -> Dict[str, Any]:
    """
    Send a command to a running server.
    Returns dictionary with status information.
    """
    try:

        with running_servers_lock:
            process_info = running_servers.get(server.id)
            if not process_info:
                raise ServerNotRunningError(f"Server {server.id} is not running")

            process = process_info['process']
            
            if process.poll() is not None:
                raise ServerNotRunningError(f"Server {server.id} process is not running")

            try:
                if not command.endswith('\n'):
                    command += '\n'
                process.stdin.write(command)
                process.stdin.flush()
                return {"message": "Command sent successfully", "data": True}
            except Exception as e:
                raise ServerCommandError(f"Failed to send command: {str(e)}")
    except Exception as e:
        logger.error(f"Error sending command to server {server.id}: {str(e)}", exc_info=True)
        return {"message": str(e), "data": False}