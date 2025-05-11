from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
import random
import shutil
import platform
import psutil
from datetime import datetime, timedelta
from app.api.permissions_wrapper import permissions_wrapper
from app.models.server import Server
from app.models.role import Role
import subprocess
import re
from sqlalchemy import or_
import time


dashboard_bp = Blueprint('dashboard_bp', __name__)


def getMotivationalQuote():
    motivational_quotes = [
        "Believe you can and you're halfway there.",
        "The only way to do great work is to love what you do.",
        "Success is not the key to happiness. Happiness is the key to success.",
        "Don't watch the clock; do what it does. Keep going.",
        "The future belongs to those who believe in the beauty of their dreams.",
        "You are never too old to set another goal or to dream a new dream.",
        "Success usually comes to those who are too busy to be looking for it.",
        "The only limit to our realization of tomorrow will be our doubts of today.",
        "Act as if what you do makes a difference. It does.",
        "Success is not how high you have climbed, but how you make a positive difference to the world."
    ]
    return random.choice(motivational_quotes)

def getSystemHealth(storage, cpu_usage, mem_usage):
    """
    Calculate overall system health as a weighted percentage (0-100).
    Higher is better. Weights:
    - Disk usage: 40%
    - CPU usage: 30%
    - Memory usage: 30%
    """
    try:
        # Ensure all inputs are valid
        print(f"Storage: {storage}, CPU Usage: {cpu_usage}, Memory Usage: {mem_usage}")
        
        # Calculate individual health scores (0-100, higher is better)
        # Disk health (inverse of usage percentage)
        disk_health = 100 - storage['aggregated']['storagePercent']
        
        # CPU health (inverse of usage percentage)
        cpu_health = 100 - cpu_usage
        
        # Memory health (inverse of usage percentage)
        mem_health = 100 - mem_usage
        
        # Apply weights
        weighted_score = (
            (disk_health * 0.40) +
            (cpu_health * 0.30) +
            (mem_health * 0.30)
        )
        
        # Ensure score is within bounds
        final_score = max(0, min(100, weighted_score))
        
        return round(final_score, 2)
        
    except Exception as e:
        print(f"Error calculating system health: {e}")
        return 0  # Return minimum health on failure

    
#Server storage functions

def get_disk_path():
    """Returns the correct root disk path based on the OS."""
    system = platform.system().lower()
    if system == "windows":
        # On Windows, we should check all available drives
        import string
        from ctypes import windll
        drives = []
        bitmask = windll.kernel32.GetLogicalDrives()
        for letter in string.ascii_uppercase:
            if bitmask & 1:
                drives.append(f"{letter}:\\")
            bitmask >>= 1
        return drives
    else:  # Linux, macOS, etc.
        return ["/"]  # Return as list for consistency

def getServerStoragePercent(disk_path):
    """Returns actual disk usage percentage (0-100)."""
    try:
        usage = shutil.disk_usage(disk_path)
        return round((usage.used / usage.total) * 100, 2)
    except Exception as e:
        print(f"Error getting disk usage for {disk_path}: {e}")
        return 0

def getServerStorageUsed(disk_path):
    """Returns used storage in GB."""
    try:
        usage = shutil.disk_usage(disk_path)
        return round(usage.used / (1024 ** 3), 2)  # Bytes → GB
    except Exception as e:
        print(f"Error getting disk usage for {disk_path}: {e}")
        return 0

def getServerStorageTotal(disk_path):
    """Returns total storage in GB."""
    try:
        usage = shutil.disk_usage(disk_path)
        return round(usage.total / (1024 ** 3), 2)  # Bytes → GB
    except Exception as e:
        print(f"Error getting disk usage for {disk_path}: {e}")
        return 0

def getStorage():
    drives = {}
    all_disks = get_disk_path()
    total_used = 0
    total_size = 0
    
    for disk_path in all_disks:
        try:
            disk_total = getServerStorageTotal(disk_path)
            disk_used = getServerStorageUsed(disk_path)
            
            drives[disk_path] = {
                "total": disk_total,
                "used": disk_used,
                "percent": getServerStoragePercent(disk_path),
            }
            
            total_used += disk_used
            total_size += disk_total
            
        except Exception as e:
            print(f"Error processing disk {disk_path}: {e}")
            continue

    # Return both individual drives and aggregated data
    return {
        "drives": drives,  # Detailed info for each drive
        "aggregated": {
            "storageTotal": round(total_size, 2),
            "storageUsed": round(total_used, 2),
            "storagePercent": round((total_used / total_size * 100), 2) if total_size > 0 else 0,
        }
    }

def getCpuUsage():
    """Returns system-wide CPU usage percentage."""
    return round(psutil.cpu_percent(interval=1), 2)

def getMemoryUsage():
    """Returns RAM usage percentage."""
    return round(psutil.virtual_memory().percent, 2)


def getServerNodes(server_list):
    servers = Server.query.all()
    print(f"{servers}")
    online_servers = [s for s in servers if s.status == 'online']
    server_list['server_nodes'] = []
    server_list['total'] = len(servers)
    server_list['online'] = len(online_servers)
    server_list['offline'] = len(servers) - len(online_servers)
    for server in servers:
        server_list["server_nodes"].append(server.to_dict())
    return server_list

def getCurrentWebsiteStatus():
    # Simulated website status TODO: Implement actual website status check logic
    return "local"  # online, offline, maintenance, local

@dashboard_bp.route('/live', methods=['GET'])
@permissions_wrapper(['dashboard.route.live', 'dashboard.route.all'])
def live(current_user, permissions_status):

    try:
        data = {
            "performanceMetrics": {
                "cpu": getCpuUsage(), #Number
                "memory": getMemoryUsage(), #Number
            }
        }
        return jsonify({
            "message": "Welcome to the live dashboard!",
            "data": data
        }), 200
    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 500


def timed_call(label, func):
    start = time.perf_counter()
    result = func()
    end = time.perf_counter()
    print(f"[Timer] {label}: {(end - start) * 1000:.2f} ms")
    return result

@dashboard_bp.route('/home', methods=['GET'])
@permissions_wrapper(['dashboard.route.home', 'dashboard.route.all'])
def get_home(current_user, permissions_status):
    start_time = time.perf_counter()

    try:
        # Website status
        version = "1.0.0"
        status = timed_call("getCurrentWebsiteStatus", getCurrentWebsiteStatus)

        # Misc
        motivational_quote = timed_call("getMotivationalQuote", getMotivationalQuote)

        # User stats
        total_users = timed_call("User.query.count", lambda: User.query.count())
        new_users = timed_call("User.query.newUsers", lambda: User.query.filter(
            User.created_at >= datetime.utcnow() - timedelta(days=1)).count())
        active_today = timed_call("User.query.activeToday", lambda: User.query.filter(
            User.last_login >= datetime.utcnow() - timedelta(days=1)).count())
        admin_users = timed_call("User.query.adminUsers", lambda: User.query.join(User.role).filter(
            or_(
                Role.name == "Admin",
                Role.name == "Moderator"
            )
        ).count())


        # Performance metrics
        cpu_usage = timed_call("getCpuUsage", getCpuUsage)
        memory_usage = timed_call("getMemoryUsage", getMemoryUsage)


        # Storage
        storage = timed_call("getStorage", getStorage)

        system_health = timed_call("getSystemHealth", lambda: getSystemHealth(storage, cpu_usage, memory_usage))
        
        # Server Nodes
        def server_nodes_wrapper():
            return getServerNodes({
                "website": {
                    "version": version,
                    "status": status,
                },
                "misc": {
                    "motivationalQuote": motivational_quote,
                    "systemHealth": system_health,
                },
                "userStats": {
                    "totalUsers": total_users,
                    "newUsers": new_users,
                    "activeToday": active_today,
                    "adminUsers": admin_users,
                },
                "performanceMetrics": {
                    "cpu": cpu_usage,
                    "memory": memory_usage,
                },
                "storage": storage,
            })

        data = timed_call("getServerNodes", server_nodes_wrapper)

        # Total duration
        end_time = time.perf_counter()
        duration_ms = round((end_time - start_time) * 1000, 2)
        print(f"[Timer] Total Duration: {duration_ms} ms")

        return jsonify({
            "message": "Welcome to the dashboard!",
            "data": data,
            "responseDurationMs": duration_ms
        }), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "message": str(e)
        }), 500


@dashboard_bp.route('/check_token', methods=['POST'])
@jwt_required()
def check_token():
    try:
        current_user = User.query.get(get_jwt_identity())
        if current_user:
            return jsonify({"status": True})
        else:
            return jsonify({"status": False, "message": "Invalid token"}), 401

    except Exception as e:
        return jsonify({
            "status": False,
            "message": str(e)
        }), 500
