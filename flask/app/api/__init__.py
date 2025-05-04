from .auth_routes import auth_bp
from .file_routes import file_bp
from .admin_routes import admin_bp
from .dashboard_routes import dashboard_bp
from .users_routes import users_bp
from .forums_routes import forums_bp
from .server_routes import server_bp


def register_routes(app):
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(file_bp, url_prefix='/api/files')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(forums_bp, url_prefix='/api/forums')
    app.register_blueprint(server_bp, url_prefix='/api/server')
