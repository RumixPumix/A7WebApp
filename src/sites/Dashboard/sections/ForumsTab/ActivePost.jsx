import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThumbsUp, 
  faThumbsDown,
  faTrash,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
// Import your API functions
import { likePost, dislikePost } from './ForumAPI/postReactions';
import { likeComment, dislikeComment } from './ForumAPI/commentReactions';
import  submitComment  from './ForumAPI/submitComment';
import  deleteComment  from './ForumAPI/deleteComment';
import  fetchPostComments  from './ForumAPI/fetchPostComments';

import './activePostStyle.css';

export default function ActivePost({ post, userInfo, setActivePost }) {
    const [currentPost, setCurrentPost] = useState(post);
    
    async function refreshPost() {
        let newpost = await fetchPostComments(post.id);
        if (!newpost) {
            newpost = {};
            return;
        }
        setCurrentPost(newpost);
        return newpost;
    }

    useEffect(() => {
        refreshPost();
    }, [post]);

    const handleLikePost = async (postId) => {
        const result = await likePost(postId);
        if (!result) return;
        await refreshPost();
    };

    const handleDislikePost = async (postId) => {
        const result = await dislikePost(postId);
        if (!result) return;
        await refreshPost();
    };
    

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const message = form.comment.value.trim();
        if (!message) return;

        const result  = await submitComment(currentPost.id, message);
        if (!result) {
            return;
        }
        await refreshPost();
        form.reset();
    };

    const handleDeleteComment = async (commentId, postId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
        if (!confirmDelete) return;
        const result = await deleteComment(postId, commentId);
        if (!result) return;
        await refreshPost();
    };

    const handleLikeComment = async (commentId, postId) => {
        const result = await likeComment(postId, commentId);
        if (!result) return;
        await refreshPost();
    };

    const handleDislikeComment = async (commentId, postId) => {
        const result = await dislikeComment(postId, commentId);
        if (!result) return;
        await refreshPost();
    };
    
    return (
        <>
        <>
            <button 
                    className="global-back-button" 
                    onClick={() => setActivePost(null)}
                    >
                    <FontAwesomeIcon icon={faArrowLeft} className="global-back-icon" />
                    Back to Forums
            </button>
        </>
        <div className="forum-tab-active-post_container">
            <div className="forum-tab-active-post_card">
                <div className="forum-tab-active-post_vote-container">
                    <button 
                        className="forum-tab-active-post_vote-btn" 
                        onClick={() => handleLikePost(currentPost.id)}
                        aria-label="Like post"
                    >
                        <FontAwesomeIcon icon={faThumbsUp} />
                    </button>
                    <span className="forum-tab-active-post_vote-count">{currentPost.like_count - currentPost.dislike_count}</span>
                    <button 
                        className="forum-tab-active-post_vote-btn" 
                        onClick={() => handleDislikePost(currentPost.id)}
                        aria-label="Dislike post"
                    >
                        <FontAwesomeIcon icon={faThumbsDown} />
                    </button>
                </div>
                
                <div className="forum-tab-active-post_content">
                    <div className="forum-tab-active-post_header">
                        <h2 className="forum-tab-active-post_title">{currentPost.title}</h2>
                        <div className="forum-tab-active-post_meta">
                            <span className="forum-tab-active-post_author">{currentPost.author?.username || 'Unknown'}</span>
                            <span className="forum-tab-active-post_date">{currentPost.created_at}</span>
                            <span className="forum-tab-active-post_type">{currentPost.post_type}</span>
                        </div>
                    </div>
                    
                    <div className="forum-tab-active-post_body">
                        <p>{currentPost.message}</p>
                    </div>
                </div>
            </div>
            
            <div className="forum-tab-active-post_comments-section">
                <h3 className="forum-tab-active-post_comments-title">Discussion ({currentPost.comment_count || 0})</h3>
                
                <form onSubmit={handleCommentSubmit} className="forum-tab-active-post_comment-form">
                    <textarea 
                        name="comment" 
                        placeholder="What are your thoughts?" 
                        required 
                        className="forum-tab-active-post_comment-input"
                    />
                    <button type="submit" className="global-btn-primary forum-tab-active-post_comment-submit">
                        Post Comment
                    </button>
                </form>
                
                {(!currentPost.comments || currentPost.comments.length === 0) ? (
                    <div className="global-empty-state forum-tab-active-post_no-comments">
                        No comments yet. Be the first to share what you think!
                    </div>
                ) : (
                    <div className="forum-tab-active-post_comments-list">
                        {currentPost.comments.map(comment => (
                            <div key={comment.id} className="forum-tab-active-post_comment">
                                <div className="forum-tab-active-post_comment-vote-container">
                                    <button 
                                        className="forum-tab-active-post_comment-vote-btn"
                                        onClick={() => handleLikeComment(comment.id, currentPost.id)}
                                        aria-label="Like comment"
                                    >
                                        <FontAwesomeIcon icon={faThumbsUp} />
                                    </button>
                                    <span className="forum-tab-active-post_comment-vote-count">{comment.likes - comment.dislikes}</span>
                                    <button 
                                        className="forum-tab-active-post_comment-vote-btn"
                                        onClick={() => handleDislikeComment(comment.id, currentPost.id)}
                                        aria-label="Dislike comment"
                                    >
                                        <FontAwesomeIcon icon={faThumbsDown} />
                                    </button>
                                </div>
                                
                                <div className="forum-tab-active-post_comment-content">
                                    <div className="forum-tab-active-post_comment-header">
                                        <span className="forum-tab-active-post_comment-author">{comment.author}</span>
                                        <span className="forum-tab-active-post_comment-date">{comment.created_at}</span>
                                    </div>
                                    <div className="forum-tab-active-post_comment-text">
                                        <p>{comment.message}</p>
                                    </div>
                                    <div className="forum-tab-active-post_comment-actions">
                                        {(userInfo.is_admin || comment.author_id === userInfo.user_id) && (
                                            <button 
                                                className="forum-tab-active-post_comment-delete"
                                                onClick={() => handleDeleteComment(comment.id, currentPost.id)}
                                                aria-label="Delete comment"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}