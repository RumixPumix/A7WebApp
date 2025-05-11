from flask import Blueprint, request, jsonify
from random import randint
import requests
from datetime import datetime
from app import db
from app.models.user import User
from app.models.server import Server
from app.models.plugin import Plugin
from app.models.serverplugin import ServerPlugin
from app.api.permissions_wrapper import permissions_wrapper
from app.server_handler import start_server, stop_server, restart_server, send_command, get_server_status, get_server_logs

server_bp = Blueprint('server_bp', __name__)

def get_random_free_port():
    used_ports = {server.port for server in Server.query.all()}
    for _ in range(100):  # Try up to 100 random ports
        port = randint(25566, 26000)
        if port not in used_ports:
            return port
    raise Exception("No free ports available in the allowed range.")

def get_random_seed():
    return str(randint(1000000000, 9999999999))


def get_paper_versions():
    try:
        response = requests.get("https://api.papermc.io/v2/projects/paper")
        if response.status_code == 200:
            data = response.json()
            
            versions = data['versions']
            versions = list(reversed(versions))  # create a reversed copy
            return versions
        else:
            print(f"Error fetching data: {response.status_code}")
            return None
    except Exception as e:
        return None
    
def synchronize_servers():
    servers = Server.query.all()
    for server in servers:
        try:
            server_status = get_server_status(server)
            server.status = server_status["status"]
            server.updated_at = datetime.utcnow()  # <-- update timestamp when checking
        except Exception as e:
            server.status = "offline"
            server.updated_at = datetime.utcnow()  # <-- update timestamp when checking
    db.session.commit()

    
@server_bp.route('/servers', methods=['GET'])
@permissions_wrapper(['server.routes.get'], ['server.routes.get.all'])
def get_servers(current_user, permissions_status):
    try:
                
        synchronize_servers()
        
        servers = Server.query.all()

        if not permissions_status.get('server.routes.get.all'):
            servers = [server for server in servers if server.owner_id == current_user.id]

        data = {
            "servers": [server.to_dict() for server in servers],
            "versions": get_paper_versions(),
        }

        return jsonify({
            'data': data,
            'message': "Servers retrieved successfully",
        }), 200
    except Exception as e:
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    
def verify_server_name(name):
    pass

def verify_server_version(version):
    pass

def verify_server_description(description):
    pass

def verify_server_ram_limit(ram_limit):
    pass

def verify_server_seed(seed):
    pass

@server_bp.route('/create', methods=['POST'])
@permissions_wrapper(['server.routes.create', 'server.routes.create.nolimit'])
def create_server(current_user, permissions_status):
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    for server in Server.query.all():
            if server.name == data.get('name'):
                return jsonify({"message": "Server name already exists"}), 400
    
    if not permissions_status.get('server.routes.create.nolimit'):
        servers_owned = Server.query.filter_by(owner_id=current_user.id).all()
        if len(servers_owned) >= 3:
            return jsonify({"message": "You have reached the maximum number of servers allowed"}), 403
        
    #TODO VERIFY WHAT IS SERVER NAME
    
    #TODO VERIFY SERVER VERSION
    if not data.get('version'):
        return jsonify({"message": "Server version is required"}), 400
    if data.get('version') == 'latest':
        data['version'] = get_paper_versions()[0]
    if data.get('version') not in get_paper_versions():
        return jsonify({"message": "Invalid server version"}), 400
    #TODO VERIFY SERVER RAM LIMIT


    try:
        if not data.get('name'):
            return jsonify({"message": "Server name is required"}), 400
        server = Server(
            name=data.get('name'),
            owner_id=current_user.id,
            version=data.get('version', '1.21.1'),
            path="/servers/" + data.get('name'),
            port=get_random_free_port(),
            seed = data.get('seed') or get_random_seed(),
            description=data.get('description', ''),
            status="creating",
            is_online_mode=data.get('is_online_mode', True),
            ram_limit_mb=data.get('ram_limit_mb') or 2048,
        )
        db.session.add(server)
        db.session.commit()
        
        result = start_server(server)

        return jsonify(result), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    

@server_bp.route('/delete/<int:server_id>', methods=['DELETE'])
@permissions_wrapper(['server.routes.delete', 'server.routes.delete.all'])
def delete_server(server_id, current_user, permissions_status):
    try:
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if not permissions_status.get('server.routes.delete.all'):
            if server.owner_id != current_user.id:
                return jsonify({"message": "You do not have permission to delete this server"}), 403
        
        result = stop_server(server)

        db.session.delete(server)
        db.session.commit()

        return jsonify({
            'data': True,
            'message': result,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'data': False
        }), 500

@server_bp.route('/update', methods=['POST'])
@permissions_wrapper(['server.routes.update', 'server.routes.update.all'])
def update_server(current_user, permissions_status):
    try:

        server_id = request.args.get('id')
        if not server_id:
            return jsonify({"message": "No server ID provided"}), 400

        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"message": "No data provided"}), 400
        
        if not permissions_status.get('server.routes.update.all'):
            if server.owner_id != current_user.id:
                return jsonify({"message": "You do not have permission to update this server"}), 403

        for key, value in data.items():
            setattr(server, key, value)

        db.session.commit()

        return jsonify({
            'data': True,
            'message': "Server updated successfully",
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    

@server_bp.route('/start/<int:server_id>', methods=['POST'])
@permissions_wrapper(['server.routes.start', 'server.routes.start.all'])
def start_server_route(server_id, current_user, permissions_status):
    try:
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if not permissions_status.get('server.routes.start.all'):
            if server.owner_id != current_user.id:
                return jsonify({"message": "You do not have permission to start this server"}), 403

        result = start_server(server)

        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    
@server_bp.route('/stop/<int:server_id>', methods=['POST'])
@permissions_wrapper(['server.routes.stop', 'server.routes.stop.all'])
def stop_server_route(server_id, current_user, permissions_status):
    try:
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if not permissions_status.get('server.routes.stop.all'):
            if server.owner_id != current_user.id:
                return jsonify({"message": "You do not have permission to stop this server"}), 403

        result = stop_server(server)

        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    
@server_bp.route('/restart/<int:server_id>', methods=['POST'])
@permissions_wrapper(['server.routes.restart', 'server.routes.restart.all'])
def restart_server_route(server_id, current_user, permissions_status):
    try:
        
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if not permissions_status.get('server.routes.restart.all'):
            if server.owner_id != current_user.id:
                return jsonify({"message": "You do not have permission to restart this server"}), 403

        result = restart_server(server)

        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    
@server_bp.route('/send_command/<int:server_id>', methods=['POST'])
@permissions_wrapper(['server.routes.send_command', 'server.routes.send_command.all'])
def send_command_route(server_id, current_user, permissions_status):
    try:
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if not server.status == "online":
            return jsonify({"message": "Server is not online"}), 400
        
        if not permissions_status.get('server.routes.send_command.all'):
            if server.owner_id != current_user.id:
                return jsonify({"message": "You do not have permission to send commands to this server"}), 403

        data = request.get_json()
        command = data.get('command')
        if not command:
            return jsonify({"message": "Command is required"}), 400

        result = send_command(server, command)

        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    
@server_bp.route('/servers/<int:server_id>/logs', methods=['GET'])
@permissions_wrapper(['server.routes.logs', 'server.routes.logs.all'])
def server_logs(server_id, current_user, permissions_status):
    try:
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if not server.status == "online":
            return jsonify({"message": "Server is not online"}), 400
        
        if not permissions_status.get('server.routes.logs.all'):
            if server.owner_id != current_user.id:
                return jsonify({"message": "You do not have permission to access logs for this server"}), 403

        try:
            logs = get_server_logs(server.id)
        except Exception as e:
            return jsonify({"message": "Error retrieving logs: " + str(e)}), 500
        
        return jsonify({
            'data': logs,
            'message': "Logs retrieved successfully",
        }), 200
    except Exception as e:
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    
@server_bp.route('/plugins', methods=['GET'])
@permissions_wrapper(['server.routes.plugins'])
def get_plugins(current_user, permissions_status):
    try:
        if not permissions_status.get('server.routes.plugins'):
            return jsonify({"message": "You do not have permission to access plugins"}), 403

        plugins = Plugin.query.all()
        return jsonify({
            'data': [plugin.to_dict() for plugin in plugins],
            'message': "Plugins retrieved successfully",
        }), 200
    except Exception as e:
        return jsonify({
            'message': str(e),
            'data': False
        }), 500



