from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.token import RegistrationToken
from app import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password, password):
        user.last_login = datetime.utcnow()  # Update last login time
        db.session.commit()
        # Ensure identity is a string
        access_token = create_access_token(identity=str(user.id))  # Convert user.id to string
        response = {
            "status": True,
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "is_admin": user.is_admin
            }
        }
        return jsonify(response), 200

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')
    token_value = data.get('token')

    # Validate required fields
    if not username or not password or not token_value:
        return jsonify({
            'status': False,
            'title': 'Registration Failed',
            'message': 'Username, password and token are required'
        }), 400

    # Check username availability
    if User.query.filter_by(username=username).first():
        return jsonify({
            'status': False,
            'title': 'Registration Failed',
            'message': 'Username already exists'
        }), 409

    # Validate token
    token = RegistrationToken.query.filter_by(token=token_value).first()
    
    if not token:
        return jsonify({
            'status': False,
            'title': 'Invalid Token',
            'message': 'The provided token is invalid'
        }), 400

    if token.is_used:
        return jsonify({
            'status': False,
            'title': 'Token Used',
            'message': 'This token has already been used'
        }), 400

    if datetime.utcnow() > token.expires_at:
        return jsonify({
            'status': False,
            'title': 'Token Expired',
            'message': 'This token has expired'
        }), 400

    # Create new user
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, password=hashed_pw)

    try:
        db.session.add(new_user)
        db.session.flush()  # Get the new user ID without committing
        
        # Mark token as used
        token.is_used = True
        token.used_by = new_user.id
        token.used_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'status': True,
            'title': 'Success',
            'message': 'User registered successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': False,
            'title': 'Registration Error',
            'message': 'An error occurred during registration'
        }), 500

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200
