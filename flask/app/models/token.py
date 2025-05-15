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

    def mark_as_used(self, user_id):
        self.is_used = True
        self.used_by = user_id
        self.used_at = datetime.utcnow()

    def to_dict(self, timezone):
        from app.api.utils.timezone_convert import convert_utc_to_user_tz

        return {
            'id': self.id,
            'token': self.token,
            'is_used': self.is_used,
            'created_at': convert_utc_to_user_tz(self.created_at, timezone) if self.created_at else None,
            'expires_at': convert_utc_to_user_tz(self.expires_at, timezone) if self.expires_at else None,
            'created_by': self.creator.username if self.creator else None,
            'used_by': self.user.username if self.user else None,
            'used_at': convert_utc_to_user_tz(self.used_at, timezone) if self.used_at else None,
        }