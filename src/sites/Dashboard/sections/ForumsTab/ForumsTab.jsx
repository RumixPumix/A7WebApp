import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThumbsUp, 
  faThumbsDown,
  faPen,       // Add this
  faTrash      // Add this
} from '@fortawesome/free-solid-svg-icons';
// Import your API functions
import  fetchForumPosts  from './ForumAPI/fetchForumPosts';
import  createPost  from './ForumAPI/createPost';
import { likePost, dislikePost } from './ForumAPI/postReactions';
import  submitComment  from './ForumAPI/submitComment';
import  deletePost  from './ForumAPI/deletePost';
import  updatePost  from './ForumAPI/updatePost'; // Assuming you have an update function
import  fetchPostComments  from './ForumAPI/fetchPostComments'; // Assuming you have a function to fetch comments
import notification from '../../../ModularComponents/notification.jsx';
import Spinner from '../../../ModularComponents/spinner.jsx'; // Assuming you have a spinner component
import LastUpdated from '../../../ModularComponents/lastUpdated.jsx'; // Assuming you have a last updated component
import './forumsStyle.css'; // Your CSS file for styling


function ForumsTab({ userInfo, searchTerm = '' }) {
  const [loading, setLoading] = useState({ forum: true });
  const [forumPosts, setForumPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', post_type: 'discussion', message: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null); // Track when last updated

  const filteredForumPosts = forumPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.created_at.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.post_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function loadForumPosts() {
    try {
      const posts = await fetchForumPosts();
      if (!posts) {
        setLoading({ forum: false });
        return;
      }
      setForumPosts(posts);
      setLastUpdated(Date.now()); // Update last updated time
    } catch (error) {

    } finally {
      setLoading({ forum: false });
    }
  }

  useEffect(() => {
    loadForumPosts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
        //setLoading({ forum: true });
        loadForumPosts();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleNewPostSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (isEditing && activePost) {
        result = await updatePost(activePost.id, newPost);  // <--- call your edit API here
      } else {
        result = await createPost(newPost);
      }

      if (!result) {
        setLoading({ forum: false });
        return;
      } 
      await loadForumPosts(); // Reload posts after creating/updating
      handleViewPost(result.id);
      setShowPostModal(false);
      setNewPost({ title: '', post_type: 'discussion', message: '' });
      setIsEditing(false);
      setActivePost(null);
    } catch (error) {

    }
  };

  const handleEditPost = async (postId) => {
    const selected = forumPosts.find(post => post.id === postId);
    if (selected) {
        selected.comments = await fetchPostComments(postId);
        setActivePost(selected);
        setIsEditing(true);  // <-- Add this!
        setShowPostModal(true);
        setNewPost({ title: selected.title, post_type: selected.post_type, message: selected.message });
    }
  };


   const handleDeletePost = async (postId) => {
        const selected = forumPosts.find(post => post.id === postId);
        if (!selected) {
            notification('Post not found', 'error'); // Use your notification system here
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${selected.title}"? This action cannot be undone.`
        );

        if (!confirmDelete) return;

        try {
            setLoading({ forum: true });
            const result = await deletePost(postId);  // Assuming this calls your API and handles auth.
            if (!result) {
                setLoading({ forum: false });
                return;
            }
            await loadForumPosts(); // Reload posts after deleting
            
            if (activePost?.id === postId) {
                setActivePost(null); // Close detail view if the deleted post was being viewed.
            }
        } catch (error) {
        }
    };

  const handleViewPost = async (postId) => {
    const selected = forumPosts.find(post => post.id === postId);
    if (selected) {
      selected.comments = await fetchPostComments(postId); // Add comments to the selected post
      setActivePost(selected);
    }
  };

  const handleLikePost = async (postId) => {
    const result = await likePost(postId);
    if (!result) return;
  
    // Fetch updated post data after the like
    const updatedPosts = await fetchForumPosts();
    setForumPosts(updatedPosts);
  
    const updatedPost = updatedPosts.find(p => p.id === postId);
    if (updatedPost) {
      updatedPost.comments = await fetchPostComments(postId);
      setActivePost(updatedPost);
    }
  };

  const handleDislikePost = async (postId) => {
    const result = await dislikePost(postId);
    if (!result) return;
  
    // Fetch updated post data after the dislike
    const updatedPosts = await fetchForumPosts();
    setForumPosts(updatedPosts);
  
    const updatedPost = updatedPosts.find(p => p.id === postId);
    if (updatedPost) {
      updatedPost.comments = await fetchPostComments(postId);
      setActivePost(updatedPost);
    }
  };
  

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const message = form.comment.value.trim();
    if (!message) return;

    try {
      console.log('Submitting comment:', message);
      const result  = await submitComment(activePost.id, message);
      if (!result) {
        console.log('Failed to submit comment');
        setLoading({ forum: false });
        return;
      }
      const comments = await fetchPostComments(activePost.id);
      if (!comments) {
        setLoading({ forum: false });
        return;
      }
      console.log('Comments before:', activePost.comments);
      activePost.comments = comments;
      setActivePost(activePost);
      console.log('Comments after:', activePost.comments);
      form.reset();
    } catch (error) {

    }
  };

  const handleLikeComment = async (commentId, postId) => {
    const result = await likeComment(commentId, postId);
    if (!result) return;

    activePost.comments = await fetchPostComments(postId);
    setActivePost(activePost);
  };

  const handleDislikeComment = async (commentId, postId) => {
    const result = await dislikeComment(commentId, postId);
    if (!result) return;
    activePost.comments = await fetchPostComments(postId);
    setActivePost(activePost);
  };



  if (loading.forum) {
    return (
      <Spinner item="Forums" />
    );
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h3>Community Forum</h3>
        <button className="btn-primary" onClick={() => setShowPostModal(true)}>New Post</button>
      </div>
      <LastUpdated lastUpdated={lastUpdated} />

      {showPostModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{isEditing ? "Edit Post" : "Create Post"}</h3>
            <form onSubmit={handleNewPostSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newPost.post_type}
                  onChange={(e) => setNewPost({ ...newPost, post_type: e.target.value })}
                >
                  <option value="discussion">Discussion</option>
                  <option value="question">Question</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={newPost.message}
                  onChange={(e) => setNewPost({ ...newPost, message: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPostModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {forumPosts.length === 0 ? (
        <div className="empty-state">No forum posts found</div>
      ) : activePost ? (
        <div className="forum-post-detail">
          <button className="back-button" onClick={() => setActivePost(null)}>
            ← Back to posts
          </button>

          <div className="post-header">
            <h2>{activePost.title}</h2>
            <div className="post-meta">
              <span>Posted by {activePost.author?.username || 'Unknown'}</span>
              <span>{activePost.created_at}</span>
              <span className="post-type">{activePost.post_type}</span>
            </div>
          </div>

          <div className="post-content">
            <p>{activePost.message}</p>
          </div>

          <div className="post-actions">
            <button onClick={() => handleLikePost(activePost.id)}>
              <FontAwesomeIcon icon={faThumbsUp} /> Like ({activePost.like_count})
            </button>
            <button onClick={() => handleDislikePost(activePost.id)}>
              <FontAwesomeIcon icon={faThumbsDown} /> Dislike ({activePost.dislike_count})
            </button>
          </div>

          <div className="post-comments">
            <h3>Comments ({activePost.comment_count})</h3>
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea name="comment" placeholder="Add a comment..." required />
              <button type="submit" className="btn-primary">Post Comment</button>
            </form>

            {activePost.comments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span>{comment.author}</span>
                  <span>{comment.created_at}</span>
                </div>
                <div className="comment-content">
                  <p>{comment.message}</p>
                </div>
                <div className="comment-actions">
                  <button>Reply</button>
                  <div>
                    <button onClick={() => handleLikeComment(comment.id, activePost.id)}><FontAwesomeIcon icon={faThumbsUp} /></button>
                    <span>{comment.likes}</span>
                    <button onClick={() => handleDislikeComment(comment.id, activePost.id)}><FontAwesomeIcon icon={faThumbsDown} /></button>
                    <span>{comment.dislikes}</span>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="forum-posts-list">
            {filteredForumPosts.map(post => (
                <div
                key={post.id}
                className="forum-post-card"
                onClick={() => handleViewPost(post.id)}
                >
                <div className="post-header">
                    <h4>{post.title}</h4>
                    <span className="post-type">{post.post_type}</span>
                    {(userInfo.is_admin || post.author?.id === userInfo.user_id) && (
                    <div className="post-controls">
                    <button
                    className="btn-icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Your edit logic here
                        handleEditPost(post.id);
                    }}
                    >
                    <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                    className="btn-icon danger"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Your delete logic here
                        handleDeletePost(post.id);
                    }}
                    >
                    <FontAwesomeIcon icon={faTrash} />
                    </button>
                    </div>
                    )}
                </div>
                <div className="post-preview">
                    <p>{post.message.length > 150 ? `${post.message.substring(0, 150)}...` : post.message}</p>
                </div>
                <div className="post-footer">
                    <span>Posted by {post.author?.username || 'Unknown'}</span>
                    <span>{post.created_at}</span>
                    <span>{post.comment_count || 0} comments</span>
                </div>
                </div>
            ))}
            </div>
      )}
    </div>
  );
}

export default ForumsTab;
