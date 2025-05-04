from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from random import randint
import requests
from datetime import datetime
from app import db
from app.models.user import User
from app.models.server import Server
from app.models.plugin import Plugin
from app.models.serverplugin import ServerPlugin
from app.server_handler import start_server, stop_server, restart_server, send_command, get_server_status

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

def check_permission(current_user):
    user = User.query.get(current_user)
    if not user:
        return None, (jsonify({"message": "You need to login first!"}), 401)
    return user, None

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
@jwt_required()
def get_servers():
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
                
        synchronize_servers()
        
        servers = Server.query.all()

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
@jwt_required()
def create_server():
    user, message = check_permission(get_jwt_identity())
    if message:
        return message
    
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    for server in Server.query.all():
            if server.name == data.get('name'):
                return jsonify({"message": "Server name already exists"}), 400
    
    if not user.is_admin:
        servers_owned = Server.query.filter_by(owner_id=user.id).all()
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
            owner_id=user.id,
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
@jwt_required()
def delete_server(server_id):
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message

        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if server.owner_id != user.id or not user.is_admin:
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
@jwt_required()
def update_server():
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        
        server_id = request.args.get('id')
        if not server_id:
            return jsonify({"message": "No server ID provided"}), 400

        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if server.owner_id != user.id or not user.is_admin:
            return jsonify({"message": "You do not have permission to update this server"}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({"message": "No data provided"}), 400
        
        #Generate a name maker, essentially a hash of the user id and when it was created

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
@jwt_required()
def start_server_route(server_id):
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if server.owner_id != user.id or not user.is_admin:
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
@jwt_required()
def stop_server_route(server_id):
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if server.owner_id != user.id or not user.is_admin:
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
@jwt_required()
def restart_server_route(server_id):
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        
        server = Server.query.get(server_id)
        if not server:
            return jsonify({"message": "Server not found"}), 404
        
        if server.owner_id != user.id or not user.is_admin:
            return jsonify({"message": "You do not have permission to restart this server"}), 403

        result = restart_server(server)

        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': str(e),
            'data': False
        }), 500
    
@server_bp.route('/plugins', methods=['GET'])
@jwt_required()
def get_plugins():
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
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



