from app import db
from datetime import datetime


class ForumPost(db.Model):
    __tablename__ = 'forum_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    post_type = db.Column(db.String(50), nullable=False)  # e.g., 'question', 'discussion', 'announcement'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', backref=db.backref('forum_posts', lazy=True))
    
    # Likes/dislikes (many-to-many with user)
    likes = db.relationship(
        'User',
        secondary='post_likes',
        backref=db.backref('liked_posts', lazy='dynamic')
    )
    
    dislikes = db.relationship(
        'User',
        secondary='post_dislikes',
        backref=db.backref('disliked_posts', lazy='dynamic')
    )
    
    # Comments (one-to-many)
    comments = db.relationship(
        'ForumComment',
        backref='post',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __repr__(self):
        return f'<ForumPost {self.title}>'
    
    def to_dict(self, with_comments=False):
        data = {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'post_type': self.post_type,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id,
            'author': {
            'username': self.author.username if self.author else 'Unknown',
            'id': self.author.id if self.author else None
            },
            'like_count': len(self.likes),
            'dislike_count': len(self.dislikes),
            'comment_count': self.comments.count()
        }
        
        if with_comments:
            data['comments'] = [comment.to_dict() for comment in self.comments.all()]
        
        return data

# Association tables for likes/dislikes
post_likes = db.Table('post_likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('post_id', db.Integer, db.ForeignKey('forum_posts.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

post_dislikes = db.Table('post_dislikes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('post_id', db.Integer, db.ForeignKey('forum_posts.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

class ForumComment(db.Model):
    __tablename__ = 'forum_comments'
    
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', backref=db.backref('forum_comments', lazy=True))
    
    post_id = db.Column(db.Integer, db.ForeignKey('forum_posts.id'), nullable=False)
    
    # Comment likes/dislikes
    likes = db.Column(db.Integer, default=0)
    dislikes = db.Column(db.Integer, default=0)
    
    # Parent comment for nested comments
    parent_id = db.Column(db.Integer, db.ForeignKey('forum_comments.id'))
    replies = db.relationship(
        'ForumComment',
        backref=db.backref('parent', remote_side=[id]),
        lazy='dynamic'
    )
    
    def __repr__(self):
        return f'<ForumComment {self.id}>'
    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id,
            'author': self.author.username,  # Assuming User model has username
            'post_id': self.post_id,
            'parent_id': self.parent_id,
            'likes': self.likes,
            'dislikes': self.dislikes,
            'reply_count': self.replies.count()
        }