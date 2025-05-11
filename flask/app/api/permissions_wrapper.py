from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from app.models.user import User
from fnmatch import fnmatch

def permissions_wrapper(*required_permissions):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            if not user:
                return jsonify({"message": "User not registered"}), 401

            # Get user permissions (empty list if no role/permissions)
            user_perms = [p.name for p in user.role.permissions] if user.role else []

            # Flatten all required permissions (handle both strings and lists)
            all_required_perms = []
            for perm in required_permissions:
                if isinstance(perm, (list, tuple)):
                    all_required_perms.extend(perm)
                elif isinstance(perm, str):
                    all_required_perms.append(perm)

            # Create complete permission status dictionary
            permissions_status = {}
            has_any_permission = False

            for required_perm in all_required_perms:
                if not isinstance(required_perm, str):
                    continue
                    
                matched = any(
                    fnmatch(user_perm, required_perm) or 
                    fnmatch(required_perm, user_perm)
                    for user_perm in user_perms
                )

                permissions_status[required_perm] = matched
                if matched:
                    has_any_permission = True

            # Check if user has at least one required permission
            if not has_any_permission:
                return jsonify({
                    "message": "Insufficient permissions",
                    "required_permissions": all_required_perms,
                    "user_permissions": user_perms
                }), 403

            return f(
                current_user=user,
                permissions_status=permissions_status,
                *args,
                **kwargs
            )
        return wrapper
    return decorator