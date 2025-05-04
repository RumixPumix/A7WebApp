from app import db
from datetime import datetime

class ServerPlugin(db.Model):
    server_id = db.Column(db.Integer, db.ForeignKey('server.id', ondelete='CASCADE'), primary_key=True)
    plugin_id = db.Column(db.Integer, db.ForeignKey('plugin.id', ondelete='CASCADE'), primary_key=True)
    installed_at = db.Column(db.DateTime, default=datetime.utcnow)

    server = db.relationship('Server', back_populates='plugins')
    plugin = db.relationship('Plugin', back_populates='servers')