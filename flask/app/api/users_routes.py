from flask import Blueprint

users_bp = Blueprint('users_bp', __name__)

# Define your routes here, for example:
@users_bp.route('/notifications', methods=['GET'])
def get_notifications():
    return "Okay", 200

