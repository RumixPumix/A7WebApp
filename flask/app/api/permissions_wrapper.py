from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from fnmatch import fnmatch
from app.models.user import User  # Adjust path as needed

def permissions_wrapper(*required_permissions):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            if not user:
                return jsonify({"message": "User not registered"}), 401

            user_perms = [p.name for p in user.role.permissions] if user.role else []

            permissions_status = {
                perm: any(fnmatch(perm, user_perm) for user_perm in user_perms)
                for perm in required_permissions
            }

            if not any(permissions_status.values()):
                return jsonify({
                    "message": "Insufficient permissions",
                    "permissions_status": permissions_status
                }), 403

            return f(
                current_user=user,
                permissions_status=permissions_status,
                *args,
                **kwargs
            )
        return wrapper
    return decorator
