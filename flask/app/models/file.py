from app import db
from datetime import datetime

class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255), nullable=False)  # Increased length and removed unique constraint
    file_extension = db.Column(db.String(10), nullable=False)  # Increased length for longer extensions
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Changed to user ID foreign key
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    file_size = db.Column(db.BigInteger, nullable=False)  # Changed to BigInteger for large files
    file_path = db.Column(db.String(512), nullable=False)  # Increased length for longer paths
    mime_type = db.Column(db.String(100), nullable=True)  # Added for content type
    is_private = db.Column(db.Boolean, default=False)  # Added for access control
    description = db.Column(db.Text, nullable=True)  # Added for file description
    
    # Relationship to user who uploaded the file
    user = db.relationship('User', backref=db.backref('uploaded_files', lazy=True))
    
    def __repr__(self):
        return f'<File {self.file_name}.{self.file_extension}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'file_name': self.file_name,
            'file_extension': self.file_extension,
            'full_name': f"{self.file_name}.{self.file_extension}",
            'uploaded_by': self.uploaded_by,
            'uploaded_at': self.uploaded_at.isoformat(),
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'is_private': self.is_private,
            'description': self.description,
            'uploader_username': self.user.username if self.user else None
        }