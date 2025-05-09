from app import db, bcrypt
from datetime import datetime
from app.models.role import Role

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))
    role = db.relationship('Role', backref='users')
    is_banned = db.Column(db.Boolean, default=False)
    banned_by = db.Column(db.Integer, db.ForeignKey('user.id'), default=None)
    ban_reason = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True) # TO be added in the future.
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)
    
    def set_role(self, role_name):
        """Set user's role by name. Defaults to 'User' if role not found."""
        if not isinstance(role_name, str):
            raise ValueError("Role name must be a string")
            
        role = Role.query.filter_by(name=role_name).first()
        
        if not role:  # If role doesn't exist, default to 'User'
            role = Role.query.filter_by(name='User').first()
            if not role:  # Safety check in case User role doesn't exist
                raise ValueError("Default 'User' role not found in database")
        
        self.role = role
        self.role_id = role.id
