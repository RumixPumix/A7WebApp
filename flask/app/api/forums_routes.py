from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.forum import ForumPost, ForumComment, post_likes, post_dislikes
from app.api.permissions_wrapper import permissions_wrapper
from datetime import datetime

forums_bp = Blueprint('forums_bp', __name__)

# Forum Posts Endpoints
@forums_bp.route('/posts', methods=['GET'])
@permissions_wrapper('forum.routes.get.posts')
def get_posts(current_user, permissions_status):
    
    posts = ForumPost.query.order_by(ForumPost.created_at.desc()).all()    

    return jsonify({
        'data': [post.to_dict(current_user.timezone) for post in posts],
        'message': "Posts retrieved successfully",
    }), 200

@forums_bp.route('/posts/<int:post_id>', methods=['GET'])
@permissions_wrapper('forum.routes.get.post')
def get_post(post_id, current_user, permissions_status):

    """Get a single forum post by ID"""
    post = ForumPost.query.get_or_404(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    return jsonify({
        'data': post.to_dict(current_user.timezone, with_comments=True),
        'message': "Post comments retrieved successfully",
        }), 200

@forums_bp.route('/posts', methods=['POST'])
@permissions_wrapper('forum.routes.create.post')
def create_post(current_user, permissions_status):
    try:

        """Create a new forum post"""
        data = request.get_json()
        if not data or 'title' not in data or 'message' not in data:
            return jsonify({'message': 'Invalid request data'}), 400
        
        post = ForumPost(
            title=data['title'],
            message=data['message'],
            post_type=data.get('post_type', 'discussion'),
            user_id=current_user.id  # In a real app, get from auth token
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
@permissions_wrapper(['forum.routes.update.post', 'forum.routes.update.post.all'])
def update_post(post_id, current_user, permissions_status):
    try:

        """Update a forum post"""
        post = ForumPost.query.get_or_404(post_id)
        if not post:
            return jsonify({'message': 'Post not found'}), 404

        if not permissions_status.get('forum.routes.update.post.all'):
            if not post.user_id == current_user.id:
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
@permissions_wrapper(['forum.routes.delete.post', 'forum.routes.delete.post.all'])
def delete_post(post_id, current_user, permissions_status):

    """Delete a forum post"""
    post = ForumPost.query.get_or_404(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    
    if not permissions_status.get('forum.routes.delete.post.all'):
        if not post.user_id == current_user.id:
            return jsonify({"message": "You are not authorized to delete this post!"}), 403
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({
        'message': 'Post deleted successfully',
        'data': True
        }), 200

# Post Likes/Dislikes Endpoints
@forums_bp.route('/posts/<int:post_id>/like', methods=['POST'])
@permissions_wrapper('forum.routes.like.post')
def like_post(post_id, current_user, permissions_status):
    """Like a forum post"""

    post = ForumPost.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    
    existing_like = db.session.query(post_likes).filter_by(
        post_id=post_id, user_id=current_user.id).first()

    if existing_like:
        db.session.execute(
            post_likes.delete().where(
                (post_likes.c.post_id == post_id) &
                (post_likes.c.user_id == current_user.id)
            )
        )
        db.session.commit()
        return jsonify({'message': 'Like removed', 'data': True}), 200
    
    # Remove dislike if exists
    db.session.execute(
        post_dislikes.delete().where(
            (post_dislikes.c.post_id == post_id) &
            (post_dislikes.c.user_id == current_user.id)
        )
    )
    
    # Add like
    db.session.execute(
        post_likes.insert().values(post_id=post_id, user_id=current_user.id)
    )
    
    db.session.commit()
    return jsonify({
        'message': 'Post liked successfully',
        'data': True
        }), 200

@forums_bp.route('/posts/<int:post_id>/dislike', methods=['POST'])
@permissions_wrapper('forum.routes.dislike.post')
def dislike_post(post_id, current_user, permissions_status):
    """Dislike a forum post"""

    post = ForumPost.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    
    # Check if already disliked → remove dislike (toggle off)
    existing_dislike = db.session.query(post_dislikes).filter_by(
        post_id=post_id, user_id=current_user.id).first()

    if existing_dislike:
        db.session.execute(
            post_dislikes.delete().where(
                (post_dislikes.c.post_id == post_id) &
                (post_dislikes.c.user_id == current_user.id)
            )
        )
        db.session.commit()
        return jsonify({'message': 'Dislike removed', 'data': True}), 200
    
    # Remove like if exists
    db.session.execute(
        post_likes.delete().where(
            (post_likes.c.post_id == post_id) &
            (post_likes.c.user_id == current_user.id)
        )
    )
    
    # Add dislike
    db.session.execute(
        post_dislikes.insert().values(post_id=post_id, user_id=current_user.id)
    )
    
    db.session.commit()
    return jsonify({
        'message': 'Post disliked successfully',
        'data': True
        }), 200


@forums_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
@permissions_wrapper('forum.routes.create.comment')
def create_comment(post_id, current_user, permissions_status):

    """Create a new comment on a post"""
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Invalid request data'}), 400
    
    comment = ForumComment(
        message=data,
        user_id=current_user.id,  # In real app, get from auth
        post_id=post_id, 
    )
    
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({
        "message": "Comment created successfully",
        "data": True
        }), 201

#UNIMPLEMENTED

@forums_bp.route('/posts/<int:post_id>/comment/<int:comment_id>/like', methods=['POST'])
@permissions_wrapper('forum.routes.like.comment')
def like_comment(post_id, comment_id, current_user, permissions_status):
    """Like a comment on a post"""
    comment = ForumComment.query.get(comment_id)
    if not comment:
        return jsonify({'message': 'Comment not found'}), 404
    
    existing_like = db.session.query(post_likes).filter_by(
        post_id=post_id, user_id=current_user.id).first()
    if existing_like:
        db.session.execute(
            post_likes.delete().where(
                (post_likes.c.post_id == post_id) &
                (post_likes.c.user_id == current_user.id)
            )
        )
        db.session.commit()
        return jsonify({'message': 'Like removed', 'data': True}), 200
    # Remove dislike if exists
    db.session.execute(
        post_dislikes.delete().where(
            (post_dislikes.c.post_id == post_id) &
            (post_dislikes.c.user_id == current_user.id)
        )
    )
    # Add like
    db.session.execute(
        post_likes.insert().values(post_id=post_id, user_id=current_user.id)
    )
    db.session.commit()
    return jsonify({
        "message": "Comment liked successfully",
        "data": True
        }), 201

@forums_bp.route('/posts/<int:post_id>/comment/<int:comment_id>/dislike', methods=['POST'])
@permissions_wrapper('forum.routes.dislike.comment')
def dislike_comment(post_id, comment_id, current_user, permissions_status):
    """Dislike a comment on a post"""
    comment = ForumComment.query.get(comment_id)
    if not comment:
        return jsonify({'message': 'Comment not found'}), 404
    
    existing_dislike = db.session.query(post_dislikes).filter_by(
        post_id=post_id, user_id=current_user.id).first()
    if existing_dislike:
        db.session.execute(
            post_dislikes.delete().where(
                (post_dislikes.c.post_id == post_id) &
                (post_dislikes.c.user_id == current_user.id)
            )
        )
        db.session.commit()
        return jsonify({'message': 'Dislike removed', 'data': True}), 200
    # Remove like if exists
    db.session.execute(
        post_likes.delete().where(
            (post_likes.c.post_id == post_id) &
            (post_likes.c.user_id == current_user.id)
        )
    )
    # Add dislike
    db.session.execute(
        post_dislikes.insert().values(post_id=post_id, user_id=current_user.id)
    )
    db.session.commit()
    return jsonify({
        "message": "Comment disliked successfully",
        "data": True
        }), 201
    
