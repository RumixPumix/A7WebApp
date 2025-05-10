from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.token import RegistrationToken
from app import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import re
import uuid
from app.api.mail_sender import EmailVerificationSystem

auth_bp = Blueprint('auth_bp', __name__)

#Password complexity requirements
# Password must be at least 8 characters long
# must contain at least one Uppercase letter, one lowercase letter, one digit, and one special character
# Username must be 4-16 characters long and can only contain letters, numbers, _, ., -
# Email must be a valid email format and at least 8 characters long

def verify_email(user):
    """Send verification email to the user"""
    try:
        email_uuid = uuid.uuid4()
        user.email_verification_code = str(email_uuid)
        user.email_verification_code_expires = datetime.utcnow() + timedelta(minutes=10)  # Set expiration time
        db.session.commit()
        verification_link = f"https://www.ace7esports.com/verify/{email_uuid}"
        email_system = EmailVerificationSystem()
        recipient = user.email
        email_system.code_expiry_minutes = 10
        # Send verification email
        status = email_system.send_verification_email(recipient, verification_link)
        if status:
            return True
        else:
            return False
    except Exception as e:
        db.session.rollback()
        print(f"Error sending verification email: {e}")
        return False


def validate_username(username):
    # Regex allows a-z, A-Z, 0-9, _, ., -
    return bool(re.fullmatch(r'[A-Za-z0-9_.-]{4,16}', username))

def validate_password(password):
    # Password must be at least 8 characters long
    # must contain at least one Uppercase letter, one lowercase letter, one digit, and one special character
    return bool(re.fullmatch(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$', password))

def validate_email(email):
    # Simple regex for email validation
    return bool(re.fullmatch(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$', email))

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json

    username = data.get('username', None)
    password = data.get('password', None)
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    #Validate username... 

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
                "role": user.role.name if user.role else None,
            }
        }
        return jsonify(response), 200

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    token_value = data.get('token')

    # Validate required fields
    if not username or not password or not token_value or not email:
        return jsonify({
            'status': False,
            'title': 'Registration Failed',
            'message': 'Username, password and token are required'
        }), 400
    
    if not validate_username(username):
        return jsonify({
            'status': False,
            'title': 'Invalid Username',
            'message': 'Username must be 3-20 characters long and can only contain letters, numbers, _, ., -'
        }), 400
    
    if not validate_password(password) < 8:
        return jsonify({
            'status': False,
            'title': 'Weak Password',
            'message': 'Password must be at least 8 characters long'
        }), 400

    # Check username availability
    if User.query.filter_by(username=username).first():
        return jsonify({
            'status': False,
            'title': 'Registration Failed',
            'message': 'Username already exists'
        }), 409
    
    if User.query.filter_by(email=email).first():
        return jsonify({
            'status': False,
            'title': 'Registration Failed',
            'message': 'Email already exists'
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
    #Email validation


    # Create new user
    new_user = User(username=username, email=email)
    new_user.set_password(password)
    new_user.set_role("User")

    try:
        db.session.add(new_user)
        db.session.flush()  # Get the new user ID without committing
        
        # Mark token as used
        token.is_used = True
        token.used_by = new_user.id
        token.used_at = datetime.utcnow()
        
        db.session.commit()

        if not verify_email(new_user):
            return jsonify({
            'status': True,
            'title': 'Success',
            'message': 'User registered but email verification failed'
        }), 201
        
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
