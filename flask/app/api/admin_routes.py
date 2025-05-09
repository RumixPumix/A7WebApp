from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.token import RegistrationToken
from datetime import datetime, timedelta
from app.models.role import Role
import secrets
import string
from app.api.permissions_wrapper import permissions_wrapper
# Define the blueprint
admin_bp = Blueprint('admin_bp', __name__)

# Example route for the admin panel
@admin_bp.route('/users', methods=['GET'])
@permissions_wrapper('admin.route.get.users')
def get_users(current_user, permissions_status):
    try:
        users = User.query.all()
        user_list = [{"id": u.id, "username": u.username, "last_login":u.last_login,"created_at":u.created_at ,"role": u.role} for u in users]
        return jsonify({
            "message": "Users retrieved successfully",
            "data": user_list
        }), 200

    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 500


@admin_bp.route('/user/<int:user_id>', methods=['DELETE'])
@permissions_wrapper('admin.route.delete.user')
def delete_user(user_id, current_user, permissions_status):
    try:
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
        
        admin_role_id = Role.query.filter_by(name='Admin').first().id
        
        if user_to_delete.role == admin_role_id:
            return jsonify({
                "message": "Cannot delete an admin user"
            }), 403
        
        #Delete the user
        db.session.delete(user_to_delete)
        db.session.commit()

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
@permissions_wrapper('admin.route.create.user')
def add_user(current_user, permissions_status):
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "message": "Invalid request data"
            }), 400
        
        if not ('username' in data and 'password' in data):
            return jsonify({
                "message": "Username and password are required"
            }), 400

        username_data = data.get('username')
        password_data = data.get('password')
        role_data = data.get('role', 'User')

        # Check if username is already taken
        if User.query.filter_by(username=username_data).first():
            return jsonify({
                "message": "Username already exists"
            }), 409
        


        new_user = User(username=username_data, role=role_data)
        new_user.set_password(password_data)
        new_user.set_role(role_data)  # Set the role for the new user
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
@permissions_wrapper('admin.route.update.user')
def update_user(user_id, current_user, permissions_status):
    try:
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
@permissions_wrapper('admin.route.get.tokens')
def get_tokens(current_user, permissions_status):
    try:
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
@permissions_wrapper('admin.route.create.token')
def generate_token(current_user, permissions_status):
    try:
        
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
            created_by=current_user.id,
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
@permissions_wrapper('admin.route.delete.token')
def delete_token(token_id, current_user, permissions_status):
    try:
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
    
@admin_bp.route('/ban/<int:user_id>', methods=['POST'])
@permissions_wrapper('admin.route.ban.user')
def ban_user(user_id, current_user, permissions_status):
    try:
        user_to_ban = User.query.get(user_id)
        if not user_to_ban:
            return jsonify({
                "message": "User not found"
            }), 404

        # Ban the user
        user_to_ban.is_banned = True
        user_to_ban.banned_by = current_user.id  # Set the user who banned
        user_to_ban.ban_reason = request.json.get('reason', None)  # Optional reason for banning
        db.session.commit()

        return jsonify({
            "message": "User banned successfully",
            "data": True
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": str(e)
        }), 500
    
@admin_bp.route('/unban/<int:user_id>', methods=['POST'])
@permissions_wrapper('admin.route.unban.user', 'admin.route.unban.user.limited')
def unban_user(user_id, current_user, permissions_status):
    try:
        user_to_unban = User.query.get(user_id)
        if not user_to_unban:
            return jsonify({"message": "User not found"}), 404

        # Check permissions
        has_full_unban = permissions_status.get('admin.route.unban.user', False)
        has_limited_unban = permissions_status.get('admin.route.unban.user.limited', False)
        
        # Condition 1: User has full unban permission - can unban anyone
        if has_full_unban:
            pass  # Allow the unban
        # Condition 2: User has limited unban AND was the one who banned the user
        elif has_limited_unban and user_to_unban.banned_by == current_user.id:
            pass  # Allow the unban
        else:
            return jsonify({
                "message": "You do not have permission to unban this user"
            }), 403

        # Unban the user
        user_to_unban.is_banned = False
        user_to_unban.banned_by = None  # Clear the banned_by field
        db.session.commit()

        return jsonify({
            "message": "User unbanned successfully",
            "data": True
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500
