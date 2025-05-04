from app import db

class Plugin(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # IDPlugin
    plugin_name = db.Column(db.String(100), unique=True, nullable=False)
    version = db.Column(db.String(20))

    servers = db.relationship('ServerPlugin', back_populates='plugin', cascade='all, delete-orphan')
