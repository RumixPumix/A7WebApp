from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
import random
import shutil
import platform
import psutil
from datetime import datetime, timedelta


dashboard_bp = Blueprint('dashboard_bp', __name__)

# Mock server management class instead of using global mutable list
class ServerManager:
    def __init__(self):
        self.servers = [
            {
                "id": 1,
                "name": "Main Server",
                "status": "online",
                "cpu": 45,
                "memory": 62
            },
            {
                "id": 2,
                "name": "Backup Server",
                "status": "offline",
                "cpu": 0,
                "memory": 0
            }
        ]

    def list_servers(self):
        return self.servers

    def get_server(self, server_id):
        return next((s for s in self.servers if s["id"] == server_id), None)

    def perform_action(self, server_id, action):
        server = self.get_server(server_id)

        if not server:
            return None, f"Server with ID {server_id} not found."

        if action == 'start':
            server['status'] = 'online'
            server['cpu'] = 10   # Simulated new usage
            server['memory'] = 20
        elif action == 'stop':
            server['status'] = 'offline'
            server['cpu'] = 0
            server['memory'] = 0
        elif action == 'restart':
            server['status'] = 'restarting'
            server['cpu'] = 0
            server['memory'] = 0
        else:
            return None, f"Invalid action: {action}."

        return server, None


server_manager = ServerManager()

def check_permission(current_user):
    user = User.query.get(current_user)
    if not user:
        return None, (jsonify({"message": "You need to login first!"}), 401)
    return user, None


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

def getSystemHealth():
    # Simulated system health check
    return round(random.uniform(0, 100), 2)  # Random percentage


def get_disk_path():
    """Returns the correct root disk path based on the OS."""
    system = platform.system().lower()
    if system == "windows":
        return "C:\\"
    else:  # Linux, macOS, etc.
        return "/"

def getServerStoragePercent():
    """Returns actual disk usage percentage (0-100)."""
    disk_path = get_disk_path()
    usage = shutil.disk_usage(disk_path)
    return round((usage.used / usage.total) * 100, 2)

def getServerStorageUsed():
    """Returns used storage in GB."""
    disk_path = get_disk_path()
    usage = shutil.disk_usage(disk_path)
    return round(usage.used / (1024 ** 3), 2)  # Bytes → GB

def getServerStorageTotal():
    """Returns total storage in GB."""
    disk_path = get_disk_path()
    usage = shutil.disk_usage(disk_path)
    return round(usage.total / (1024 ** 3), 2)  # Bytes → GB

def calculateUptimePercentage():
    # Simulated uptime percentage
    return round(random.uniform(0, 100), 2)  # Random percentage

def getSecurityAlertCount():
    # Simulated security alert count
    return random.randint(0, 2)  # Random number of alerts

def getCpuUsage():
    """Returns system-wide CPU usage percentage."""
    return round(psutil.cpu_percent(interval=0.5), 2)

def getMemoryUsage():
    """Returns RAM usage percentage."""
    return round(psutil.virtual_memory().percent, 2)


def getResponse():
    # Simulated response time
    return round(random.uniform(0, 500), 2)  # Random milliseconds

def getRequests():
    # Simulated number of requests
    return random.randint(0, 1000)  # Random number of requests

def getSecurity():
    # Simulated security score
    return round(random.uniform(0, 100), 2)  # Random percentage

def getPerformance():
    # Simulated performance score
    return round(random.uniform(0, 100), 2)  # Random percentage

def getStability():
    # Simulated stability score
    return round(random.uniform(0, 100), 2)  # Random percentage

def getServerNodes():
    server_manager = ServerManager()
    return server_manager.list_servers()  # Returns the list of servers

def getUserActivityData():
    # Simulated user activity data
    return [
        {"day": "2023-10-01", "activity": 20},
        {"day": "2023-10-02", "activity": 30},
        {"day": "2023-10-03", "activity": 50},
        {"day": "2023-10-04", "activity": 70},
        {"day": "2023-10-05", "activity": 90}
    ]

def getStorageBreakdown():
    # Simulated storage breakdown with percent included
    drives = [
        {"type": "SSD", "name": "Solid State Drive", "used": 500, "total": 1000},
        {"type": "HDD", "name": "Hard Disk Drive", "used": 300, "total": 800}
    ]

    for d in drives:
        if d["total"] > 0:
            d["percent"] = round((d["used"] / d["total"]) * 100, 2)
        else:
            d["percent"] = 0.0

    return drives

def getRecentActivity():
    # Simulated recent activity
    return [
        {"user": "User1", "action": "Logged in", "timestamp": datetime.utcnow()},
        {"user": "User2", "action": "Uploaded a file", "timestamp": datetime.utcnow()},
        {"user": "User3", "action": "Deleted a file", "timestamp": datetime.utcnow()}
    ]

def getPerformanceTips():
    # Simulated performance tips
    return [
        "Optimize your database queries.",
        "Use caching to speed up response times.",
        "Minimize HTTP requests.",
        "Use a Content Delivery Network (CDN).",
        "Optimize images and other media."
    ]

def getRecommendations():
    # Simulated recommendations
    return [
        "Consider upgrading your server hardware.",
        "Implement a backup strategy.",
        "Regularly update your software and dependencies.",
        "Monitor your server performance regularly.",
        "Implement security best practices."
    ]

@dashboard_bp.route('/live', methods=['GET'])
@jwt_required()
def live():
    user, message = check_permission(get_jwt_identity())
    if message:
        return message
    
    try:
        data = {
            "performanceMetrics": {
                "cpu": getCpuUsage(), #Number
                "memory": getMemoryUsage(), #Number
                "responseTime": getResponse(), #Number
                "requests": getRequests(), #Number
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

@dashboard_bp.route('/home', methods=['GET'])
@jwt_required()
def get_home():
    user, message = check_permission(get_jwt_identity())
    if message:
        return message

    try:
        data = {
            "motivationalQuote": getMotivationalQuote(), #Single string
            "systemHealth": getSystemHealth(), #Number
            "serverStats": {
                "total": len(server_manager.servers),
                "storagePercent": getServerStoragePercent(), #Number
                "storageUsed": getServerStorageUsed(), #Number
                "storageTotal": getServerStorageTotal(), #Number
                "online": len([s for s in server_manager.servers if s["status"] == "online"]),
                "uptime": calculateUptimePercentage(),  # Should be a percentage
                "securityAlerts": getSecurityAlertCount(), #Number
            },
            "userStats": {
                "totalUsers": User.query.count(),
                "newUsers": User.query.filter(User.created_at >= datetime.utcnow() - timedelta(days=1)).count(),
                "activeToday": User.query.filter(User.last_login >= datetime.utcnow() - timedelta(days=1)).count(),
                "adminUsers": User.query.filter_by(is_admin=True).count(),
            },
            "performanceMetrics": {
                "cpu": getCpuUsage(), #Number
                "memory": getMemoryUsage(), #Number
                "responseTime": getResponse(), #Number
                "requests": getRequests(), #Number
            },
            "systemHealthMetrics": {
                "security": getSecurity(), #Number
                "performance": getPerformance(), #Number
                "stability": getStability(), #Number
            },
            "serverNodes": getServerNodes(),  # Should return array of server objects
            "userActivityChart": getUserActivityData(),  # Array of percentages
            "storageBreakdown": getStorageBreakdown(),  # Array of storage type objects
            "recentActivity": getRecentActivity(),  # Array of activity objects
            "performanceTips": getPerformanceTips(),  # Array of strings
            "recommendations": getRecommendations(),
        }


        return jsonify({
            "message": "Welcome to the dashboard!",
            "data": data
        }), 200
    except Exception as e:
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
