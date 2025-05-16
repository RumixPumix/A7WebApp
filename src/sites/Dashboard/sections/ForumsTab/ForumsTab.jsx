import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThumbsUp, 
  faThumbsDown,
  faPen,
  faTrash,
  faMessage,
  faUser,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import  fetchForumPosts  from './ForumAPI/fetchForumPosts';
import  createPost  from './ForumAPI/createPost';
import { likePost, dislikePost } from './ForumAPI/postReactions';
import { likeComment, dislikeComment } from './ForumAPI/commentReactions';
import  submitComment  from './ForumAPI/submitComment';
import  deleteComment  from './ForumAPI/deleteComment';
import  deletePost  from './ForumAPI/deletePost';
import  updatePost  from './ForumAPI/updatePost';
import  fetchPostComments  from './ForumAPI/fetchPostComments';
import notification from '../../../ModularComponents/notification.jsx';
import Spinner from '../../../ModularComponents/spinner.jsx';
import LastUpdated from '../../../ModularComponents/lastUpdated.jsx';
import ActivePost from './ActivePost.jsx';
import './forumsTabStyle.css';

function ForumsTab({ userInfo, searchTerm = '' }) {
  const [loading, setLoading] = useState({ forum: true });
  const [forumPosts, setForumPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', post_type: 'discussion', message: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

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
      setLastUpdated(Date.now());
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
        result = await updatePost(activePost.id, newPost);
      } else {
        result = await createPost(newPost);
      }

      if (!result) {
        setLoading({ forum: false });
        return;
      } 
      await loadForumPosts();
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
        setIsEditing(true);
        setShowPostModal(true);
        setNewPost({ title: selected.title, post_type: selected.post_type, message: selected.message });
    }
  };

  const handleDeletePost = async (postId) => {
    const selected = forumPosts.find(post => post.id === postId);
    if (!selected) {
        notification('Post not found', 'error');
        return;
    }

    const confirmDelete = window.confirm(
        `Are you sure you want to delete "${selected.title}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
        setLoading({ forum: true });
        const result = await deletePost(postId);
        if (!result) {
            setLoading({ forum: false });
            return;
        }
        await loadForumPosts();
        
        if (activePost?.id === postId) {
            setActivePost(null);
        }
    } catch (error) {
    }
  };

  const handleViewPost = async (post) => {
    setActivePost(post);
  };

  if (loading.forum) {
    return (
      <Spinner item="Forums" />
    );
  }

  return (
    <div className="global-tab-content">
      <div className="global-tab-header">
        <h3>Community Forum</h3>
        <button className="global-btn-primary" onClick={() => setShowPostModal(true)}>New Post</button>
      </div>
      <LastUpdated lastUpdated={lastUpdated} />

      {showPostModal && (
        <div className="forum-tab_modal">
          <div className="forum-tab_modal-content">
            <h3>{isEditing ? "Edit Post" : "Create Post"}</h3>
            <form onSubmit={handleNewPostSubmit}>
              <div className="forum-tab_form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                />
              </div>
              <div className="forum-tab_form-group">
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
              <div className="forum-tab_form-group">
                <label>Message</label>
                <textarea
                  value={newPost.message}
                  onChange={(e) => setNewPost({ ...newPost, message: e.target.value })}
                  required
                />
              </div>
              <div className="forum-tab_form-actions">
                <button type="button" className="global-btn-secondary" onClick={() => setShowPostModal(false)}>Cancel</button>
                <button type="submit" className="global-btn-primary">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {forumPosts.length === 0 ? (
        <div className="global-empty-state">No forum posts found</div>
      ) : activePost ? (
        <ActivePost post={activePost} userInfo={userInfo} setActivePost={setActivePost}/>
      ) : (
        <div className="forum-tab_posts-container">
          {filteredForumPosts.map(post => (
            <div key={post.id} className="forum-tab_post-card" onClick={() => setActivePost(post)}>
              <div className="forum-tab_post-votes">
                <button className="forum-tab_vote-btn">
                  <FontAwesomeIcon icon={faThumbsUp} />
                </button>
                <span className="forum-tab_vote-count">{post.likes || 0}</span>
                <button className="forum-tab_vote-btn">
                  <FontAwesomeIcon icon={faThumbsDown} />
                </button>
              </div>
              <div className="forum-tab_post-content">
                <div className="forum-tab_post-header">
                  <span className={`forum-tab_post-type forum-tab_type-${post.post_type}`}>
                    {post.post_type}
                  </span>
                  <h4 className="forum-tab_post-title">{post.title}</h4>
                  {(userInfo.is_admin || post.author?.id === userInfo.user_id) && (
                    <div className="forum-tab_post-controls">
                      <button
                        className="forum-tab_control-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPost(post.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="forum-tab_control-btn forum-tab_control-btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="forum-tab_post-body">
                  <p>{post.message.length > 250 ? `${post.message.substring(0, 250)}...` : post.message}</p>
                </div>
                <div className="forum-tab_post-footer">
                  <span className="forum-tab_footer-item">
                    <FontAwesomeIcon icon={faUser} className="forum-tab_footer-icon" />
                    {post.author?.username || 'Unknown'}
                  </span>
                  <span className="forum-tab_footer-item">
                    <FontAwesomeIcon icon={faClock} className="forum-tab_footer-icon" />
                    {post.created_at}
                  </span>
                  <span className="forum-tab_footer-item">
                    <FontAwesomeIcon icon={faMessage} className="forum-tab_footer-icon" />
                    {post.comment_count || 0} comments
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ForumsTab;