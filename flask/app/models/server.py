from app import db
from datetime import datetime
from app.models.user import User


class Server(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    version = db.Column(db.String(10), default='1.21.1')
    path = db.Column(db.String(255))
    port = db.Column(db.Integer)
    seed = db.Column(db.String(255))  # Changed to String to support alphanumeric seeds
    is_online_mode = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ram_limit_mb = db.Column(db.Integer, default=2048)
    status = db.Column(db.String(15), default='offline')  # offline, online, starting, stopping
    description = db.Column(db.Text, nullable=True)

    owner = db.relationship('User', backref=db.backref('servers', lazy=True))
    plugins = db.relationship('ServerPlugin', back_populates='server', cascade='all, delete-orphan')

    __table_args__ = (
        db.CheckConstraint('port BETWEEN 25566 AND 26000', name='check_port_range'),
        db.CheckConstraint('ram_limit_mb BETWEEN 512 AND 8192', name='check_ram_limit'),
    )

    def __repr__(self):
        return f'<Server {self.name} (v{self.version})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'owner_id': self.owner_id,
            'owner_username': self.owner.username if self.owner else None,
            'version': self.version,
            'port': self.port,
            'seed': self.seed,
            'is_online_mode': self.is_online_mode,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'ram_limit_mb': self.ram_limit_mb,
            'status': self.status,
            'description': self.description,
            'path': self.path
        }