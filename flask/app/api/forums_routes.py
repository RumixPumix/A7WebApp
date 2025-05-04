from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.forum import ForumPost, ForumComment, post_likes, post_dislikes
from datetime import datetime

forums_bp = Blueprint('forums_bp', __name__)

def check_permission(current_user):
    user = User.query.get(current_user)
    if not user:
        return None, (jsonify({"message": "You need to login first!"}), 401)
    return user, None

# Forum Posts Endpoints
@forums_bp.route('/posts', methods=['GET'])
@jwt_required()
def get_posts():
    user, message = check_permission(get_jwt_identity())
    if message:
        return message
    
    """Get all forum posts with pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    post_type = request.args.get('type')  # Optional filter by post type
    
    query = ForumPost.query
    
    if post_type:
        query = query.filter_by(post_type=post_type)
    
    posts = query.order_by(ForumPost.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'data': [post.to_dict() for post in posts.items],
        'message': "Posts retrieved successfully",
    }), 200

@forums_bp.route('/posts/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post(post_id):
    user, message = check_permission(get_jwt_identity())
    if message:
        return message
    """Get a single forum post by ID"""
    post = ForumPost.query.get_or_404(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    return jsonify({
        'data': post.to_dict(with_comments=True),
        'message': "Post comments retrieved successfully",
        }), 200

@forums_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message

        """Create a new forum post"""
        data = request.get_json()
        if not data or 'title' not in data or 'message' not in data:
            return jsonify({'message': 'Invalid request data'}), 400
        
        post = ForumPost(
            title=data['title'],
            message=data['message'],
            post_type=data.get('post_type', 'discussion'),
            user_id=user.id  # In a real app, get from auth token
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({
            'message': 'Post created successfully',
            'data': True
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@forums_bp.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message

        """Update a forum post"""
        post = ForumPost.query.get_or_404(post_id)
        if not post:
            return jsonify({'message': 'Post not found'}), 404

        if post.user_id != user.id:
            return jsonify({"message": "You are not authorized to update this post!"}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Invalid request data'}), 400
        
        post.title = data.get('title', post.title)
        post.message = data.get('message', post.message)
        post.post_type = data.get('post_type', post.post_type)
        post.updated_at = datetime.utcnow()
        
        db.session.commit()

        return jsonify({
            'message': 'Post updated successfully',
            'data': True
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@forums_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user, message = check_permission(get_jwt_identity())
    if message:
        return message
    """Delete a forum post"""
    post = ForumPost.query.get_or_404(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    
    if post.user_id != user.id:
        return jsonify({"status": False, "message": "You are not authorized to delete this post!"}), 403
    
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({
        'message': 'Post deleted successfully',
        'data': True
        }), 200

# Post Likes/Dislikes Endpoints
@forums_bp.route('/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    user, message = check_permission(get_jwt_identity())
    if message:
        return message
    
    """Like a forum post"""
    user_id = user.id
    
    existing_like = db.session.query(post_likes).filter_by(
        post_id=post_id, user_id=user_id).first()

    if existing_like:
        db.session.execute(
            post_likes.delete().where(
                (post_likes.c.post_id == post_id) &
                (post_likes.c.user_id == user_id)
            )
        )
        db.session.commit()
        return jsonify({'message': 'Like removed', 'data': True}), 200
    
    # Remove dislike if exists
    db.session.execute(
        post_dislikes.delete().where(
            (post_dislikes.c.post_id == post_id) &
            (post_dislikes.c.user_id == user_id)
        )
    )
    
    # Add like
    db.session.execute(
        post_likes.insert().values(post_id=post_id, user_id=user_id)
    )
    
    db.session.commit()
    return jsonify({
        'message': 'Post liked successfully',
        'data': True
        }), 200

@forums_bp.route('/posts/<int:post_id>/dislike', methods=['POST'])
@jwt_required()
def dislike_post(post_id):
    user, message = check_permission(get_jwt_identity())
    if message:
        return message
    """Dislike a forum post"""
    user_id = user.id # In real app, get from auth
    
    # Check if already disliked → remove dislike (toggle off)
    existing_dislike = db.session.query(post_dislikes).filter_by(
        post_id=post_id, user_id=user_id).first()

    if existing_dislike:
        db.session.execute(
            post_dislikes.delete().where(
                (post_dislikes.c.post_id == post_id) &
                (post_dislikes.c.user_id == user_id)
            )
        )
        db.session.commit()
        return jsonify({'message': 'Dislike removed', 'data': True}), 200
    
    # Remove like if exists
    db.session.execute(
        post_likes.delete().where(
            (post_likes.c.post_id == post_id) &
            (post_likes.c.user_id == user_id)
        )
    )
    
    # Add dislike
    db.session.execute(
        post_dislikes.insert().values(post_id=post_id, user_id=user_id)
    )
    
    db.session.commit()
    return jsonify({
        'message': 'Post disliked successfully',
        'data': True
        }), 200


@forums_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(post_id):
    user, message = check_permission(get_jwt_identity())
    if message:
        return message
    """Create a new comment on a post"""
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Invalid request data'}), 400
    
    comment = ForumComment(
        message=data,
        user_id=user.id,  # In real app, get from auth
        post_id=post_id, 
    )
    
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({
        "message": "Comment created successfully",
        "data": True
        }), 201
