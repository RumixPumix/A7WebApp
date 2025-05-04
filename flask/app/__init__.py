from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv
from flask_socketio import SocketIO
import os


db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
socketio = SocketIO(
    cors_allowed_origins="*"
)

def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object('app.config.Config')

    # Enable CORS — allow all origins for now (you can restrict later)
    CORS(app, supports_credentials=True)

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL') + os.getenv('DB_NAME')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    bcrypt.init_app(app)
    socketio.init_app(app)
    jwt.init_app(app)

    from app.api import register_routes
    register_routes(app)

    return app
