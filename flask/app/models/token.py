from app import db
from datetime import datetime, timedelta

class RegistrationToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(120), unique=True, nullable=False)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # Admin who created the token
    used_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # User who claimed the token
    used_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by])
    user = db.relationship('User', foreign_keys=[used_by])

    def __init__(self, token, created_by, days_valid=7):
        self.token = token
        self.created_by = created_by
        self.expires_at = datetime.utcnow() + timedelta(days=days_valid)

    def is_valid(self):
        return (
            not self.is_used 
            and datetime.utcnow() < self.expires_at
        )

    def mark_as_used(self, user_id):
        self.is_used = True
        self.used_by = user_id
        self.used_at = datetime.utcnow()