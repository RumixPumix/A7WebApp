from app import db
from .permission import role_permissions

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(200), nullable=True)
    permissions = db.relationship('Permission', secondary=role_permissions, backref='roles')
