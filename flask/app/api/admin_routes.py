from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.token import RegistrationToken
from datetime import datetime, timedelta
import secrets
import string


# Define the blueprint
admin_bp = Blueprint('admin_bp', __name__)

def check_permission(current_user):
    user = User.query.get(current_user)
    if not user:
        return None, (jsonify({"message": "You need to login first!"}), 401)
    if not user.is_admin:
        return None, (jsonify({"message": "Access denied"}), 403)
    return user, None

# Example route for the admin panel
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        current_user = get_jwt_identity()
        user, message = check_permission(current_user)
        if message:
            return message
        
        users = User.query.all()
        user_list = [{"id": u.id, "username": u.username, "last_login":u.last_login,"created_at":u.created_at ,"is_admin": u.is_admin} for u in users]
        return jsonify({
            "message": "Users retrieved successfully",
            "data": user_list
        }), 200
    
    

    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 500

@admin_bp.route('/user/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        current_user = get_jwt_identity()
        user, message = check_permission(current_user)
        if message:
            return message
        
        if not user_id:
            return jsonify({
                "status": False,
                "message": "Incorrect format of JSON data - User ID is required"
            }), 400
        user_to_delete = User.query.get(user_id)
        if not user_to_delete:
            return jsonify({
                "message": "User not found"
            }), 404
        
        if user_to_delete.is_admin:
            return jsonify({
                "message": "Cannot delete an admin user"
            }), 403
        
        #Delete the user
        db.session.delete(user_to_delete)
        db.session.commit()

        
        #TODO : Implement user deletion logic
        return jsonify({
            "message": "User deleted successfully",
            "data": True
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": str(e)
        }), 500

@admin_bp.route('/user', methods=['POST'])
@jwt_required()
def add_user():
    try:
        current_user = get_jwt_identity()
        user, message = check_permission(current_user)
        if message:
            return message

        data = request.get_json()
        if not data:
            return jsonify({
                "message": "Invalid request data"
            }), 400
        username_data = data.get('username', None)
        password_data = data.get('password', None)
        is_admin_data = data.get('is_admin', False)

        if not username_data or not password_data:
            return jsonify({
                "message": "Username and password are required"
            }), 400

        # Check if username is already taken
        if User.query.filter_by(username=username_data).first():
            return jsonify({
                "message": "Username already exists"
            }), 409

        new_user = User(username=username_data, is_admin=is_admin_data)
        new_user.set_password(password_data)

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": "User created successfully",
            "data":True
        }) , 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": str(e)
        }), 500

@admin_bp.route('/user/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        current_user = get_jwt_identity()
        user, message = check_permission(current_user)
        if message:
            return message

        user_to_update = User.query.get(user_id)
        if not user_to_update:
            return jsonify({
                "message": "User not found"
            }), 404

        response = request.get_json()
        if not response:
            return jsonify({
                "message": "Invalid request data"
            }), 400
        
        new_username = response.get('username', user_to_update.username)
        new_password = response.get('password', None)
        new_is_admin = response.get('role', user_to_update.is_admin)

        user_to_update.username = new_username
        user_to_update.is_admin = new_is_admin

        if new_password:
            user_to_update.set_password(new_password)

        db.session.commit()

        return jsonify({
            "message": "User updated successfully",
            "data": True
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": str(e)
        }), 500
    

@admin_bp.route('/tokens', methods=['GET'])
@jwt_required()
def get_tokens():
    try:
        current_user = get_jwt_identity()
        user, message = check_permission(current_user)
        if message:
            return message
        
        # Get all tokens with creator/user relationships
        tokens = RegistrationToken.query \
        .options(
            db.joinedload(RegistrationToken.creator),
            db.joinedload(RegistrationToken.user)
        ) \
        .order_by(RegistrationToken.created_at.desc()) \
        .all()
        
        # Format response
        token_list = []
        for token in tokens:
            token_data = {
                "id": token.id,
                "token": token.token,
                "is_used": token.is_used,
                "created_at": token.created_at.isoformat() if token.created_at else None,
                "expires_at": token.expires_at.isoformat() if token.expires_at else None,
                "used_at": token.used_at.isoformat() if token.used_at else None,
                "is_valid": token.is_valid(),
                "creator": {
                    "id": token.creator.id,
                    "username": token.creator.username
                } if token.creator else None,
                "user": {
                    "id": token.user.id,
                    "username": token.user.username
                } if token.user else None
            }
            token_list.append(token_data)
        
        return jsonify({
            "message": "Tokens retrieved successfully",
            "data": token_list
        }), 200
    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 500

@admin_bp.route('/token', methods=['POST'])
@jwt_required()
def generate_token():
    try:
        current_user = get_jwt_identity()
        user, message = check_permission(current_user)
        if message:
            return message
        
        response = request.get_json()
        if not response:
            return jsonify({"message": "Invalid request data"}), 400

        days_valid = response.get('tokenExpiry', 7)
        if not (1 <= days_valid <= 30):
            return jsonify({"message": "Token expiration must be between 1-30 days."}), 400

        user_provided_token = response.get('token')
        if user_provided_token:
            if len(user_provided_token) > 19:
                return jsonify({
                    "message": "Token length must be less than 20 characters."
                }), 400
            token = user_provided_token
        else:
            token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))

        if RegistrationToken.query.filter_by(token=token).first():
            return jsonify({
                "message": "Token already exists"
            }), 409

        new_token = RegistrationToken(
            token=token,
            created_by=user.id,
            days_valid=days_valid
        )

        db.session.add(new_token)
        db.session.commit()

        return jsonify({
            "message": "Token created successfully",
            "data": True
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500
    

@admin_bp.route('/token/<int:token_id>', methods=['DELETE'])
@jwt_required()
def delete_token(token_id):
    try:
        current_user = get_jwt_identity()
        user, message = check_permission(current_user)
        if message:
            return message
        # Find the token
        token = RegistrationToken.query.get(token_id)
        if not token:
            return jsonify({
                "message": "Token not found"
            }), 404

        # Delete the token
        db.session.delete(token)
        db.session.commit()

        return jsonify({
            "message": "Token revoked successfully",
            "data": True
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": str(e)
        }), 500