from app import db
from datetime import datetime

class File(db.Model):
    __tablename__ = 'file'
    
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=True)
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.BigInteger, nullable=True)
    is_private = db.Column(db.Boolean, default=False)
    is_folder = db.Column(db.Boolean, default=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('file.id', ondelete='CASCADE'), nullable=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to user
    user = db.relationship('User', backref=db.backref('uploaded_files', lazy=True))

    # Self-referential relationship
    parent = db.relationship(
        'File',
        remote_side=[id],
        backref=db.backref('children', cascade='all, delete-orphan', lazy='dynamic')
    )

    def to_dict(self):
        return {
            'id': self.id,
            'file_name': self.file_name,
            'mime_type': self.mime_type,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'is_private': self.is_private,
            'is_folder': self.is_folder,
            'parent_id': self.parent_id,
            'uploaded_by': self.user.username if self.user else None,
            'uploaded_at': self.uploaded_at.isoformat(),
        }
