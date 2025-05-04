import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCog, faKey, faClock, faTimes, faTrash, faExclamationTriangle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import addUser from './UsersManagementAPI/addUser';
import editUser from './UsersManagementAPI/editUser';
import deleteUser from './UsersManagementAPI/deleteUser';
import fetchUsers from './UsersManagementAPI/fetchUsers';
import fetchTokens from './UsersManagementAPI/fetchTokens';
import generateToken from './UsersManagementAPI/generateToken';
import deleteToken from './UsersManagementAPI/deleteToken';
import postToken from './UsersManagementAPI/postToken';
import notification from '../../../ModularComponents/notification';
import './userManagementStyle.css'; // Assuming you have a CSS file for styling
import Spinner from '../../../ModularComponents/spinner.jsx'; // your spinner component
import LastUpdated from '../../../ModularComponents/lastUpdated.jsx'; // your last updated component

function UserManagementTab() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [currentToken, setCurrentToken] = useState('');
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState({ users: true, tokens: true });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState("1"); // Default to 1 day
  const [showExpiredTokens, setShowExpiredTokens] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null); // Track when last updated


  async function loadUsersData(){
    try {
      let usersData = await fetchUsers();
      if (!usersData) {
        usersData = []; // Fallback to empty array if fetch fails
      }
      setUsers(usersData);
      setLastUpdated(Date.now()); // Update last updated time
    } catch (error) {

    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  }

  async function loadTokensData(){
    try {
      let tokensData = await fetchTokens();
      if (!tokensData) {
        tokensData = []; // Fallback to empty array if fetch fails
      }
      setTokens(tokensData);
    } catch (error) {
    } finally {
      setLoading((prev) => ({ ...prev, tokens: false }));
    }
  }

  useEffect(() => {
    loadUsersData();
    loadTokensData();
  }, []);

  useEffect(() => {
      const interval = setInterval(() => {
        if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
          setLoading({ users: true, tokens: true });
          loadUsersData();
          loadTokensData();
        }
      }, 1000);
  
      return () => clearInterval(interval);
    }, [lastUpdated]);

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setShowPassword(false);
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      username: formData.get('username'),
      role: formData.get('role') === 'Admin',
      ...(!editingUser && { password: formData.get('password') })
    };

    console.log(userData);

    try {
      setLoading((prev) => ({ ...prev, users: true }));
      let result;
      if (editingUser) {
        result = await editUser(editingUser.id, userData);
      } else {
        result = await addUser(userData);
      }
      if (!result) {
        setLoading((prev) => ({ ...prev, users: false }));
        return;
      }
      await loadUsersData();
    }
    catch (error) {
      notification('Failed to add/edit user', 'error'); // Use your notification system here
    } finally {
      setShowUserModal(false);
      setEditingUser(null);
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowPassword(false);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    setLoading((prev) => ({ ...prev, users: true }));
    const result = await deleteUser(userId);
    if (!result) {
      setLoading((prev) => ({ ...prev, users: false }));
      return;
    }
    await loadUsersData();
  };

  const handleTokenPost = async () => {
    let tokenExpiry = null;
    let token = null;

    tokenExpiry = parseInt(selectedExpiry);
    token = currentToken; // The generated token

    setLoading((prev) => ({ ...prev, tokens: true }));
    const result = await postToken(tokenExpiry, token);
    if (!result) {
      setLoading((prev) => ({ ...prev, tokens: false }));
      return;
    } else {
      navigator.clipboard.writeText(currentToken)
      setShowTokenModal(false)
      setCurrentToken('')
      setSelectedExpiry("1")
      await loadTokensData();
    }
  };

  const handleTokenModal = async () => {
    setShowTokenModal(true);
    const token = await generateToken();
    setCurrentToken(token);
    setLoading((prev) => ({ ...prev, tokens: true }));
    await loadTokensData(); // Refresh tokens after generating a new one
  };

  const handleDeleteToken = async (tokenId) => {
    setLoading((prev) => ({ ...prev, tokens: true }));
    const result = await deleteToken(tokenId);
    if (!result) {
      setLoading((prev) => ({ ...prev, tokens: false }));
      return;
    }
    await loadTokensData();
  };

  const toggleTokenVisibility = (tokenId) => {
    setTokens((prevTokens) =>
      prevTokens.map((token) =>
        token.id === tokenId ? { ...token, showToken: !token.showToken } : token
      )
    );
  };

  if (loading.users || loading.tokens) {
    return (
      <Spinner item="Management Board" />
    );
  }

  return (
    <div className="tab-content">
      <LastUpdated lastUpdated={lastUpdated} />
      {/* User Management Section */}
      <div className="tab-header">
        <h3>User Management</h3>
        <button className="btn-primary" onClick={handleOpenAddUser}>
          <FontAwesomeIcon icon={faUserCog} /> Add User
        </button>

        {showUserModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <form onSubmit={handleUserSubmit}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={editingUser?.username || ''}
                    required
                  />
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label>Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                      />
                      <button
                        type="button"
                        className="btn-icon small"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{ marginLeft: '8px' }}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Role</label>
                  <select name="role" defaultValue={editingUser?.role || 'user'}>
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      { users.length === 0 ? (
        <div className="empty-state">No users found</div>
      ) : (
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Role</th>
                <th className='right-align-action'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.created_at}</td>
                  <td>{user.last_login || 'Never'}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className='right-align'>
                    <button
                      className="btn-icon"
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                    >
                      <FontAwesomeIcon icon={faUserCog} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
                          handleDeleteUser(user.id);
                        }
                      }}
                      title="Delete User"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* API Token Management Section */}
      <div className="tab-header" style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>API Token Management</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label className="switch-label">Show Expired Tokens</label>
          <label className="switch">
            <input 
              type="checkbox" 
              onChange={(e) => setShowExpiredTokens(e.target.checked)} 
            />
            <span className="slider round"></span>
          </label>
          <button className="btn-primary" onClick={handleTokenModal}>
            <FontAwesomeIcon icon={faKey} /> Generate Token
          </button>
        </div>
      </div>

      {/* Tokens Table */}
      {tokens.length === 0 ? (
        <div className="empty-state">No tokens found</div>
      ) : (
        <div className="token-table-container">
          <table className="token-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Token</th>
                <th>Created</th>
                <th>Created By</th>
                <th>Expires</th>
                <th>Used By</th>
                <th>Used At</th>
                <th className='right-align-action'>Actions</th>
              </tr>
            </thead>
            <tbody>
            {tokens.map((token) => {
              if (token.is_used && !showExpiredTokens) {
                return null; // Skip rendering this token if it's used and we're not showing expired
              }

              return (
                <tr key={token.id}>
                  <td>
                    <span className={`status-badge ${token.is_used ? 'inactive' : 'active'}`}>
                      {token.is_used ? 'Used' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="token-display">
                      {token.showToken ? (
                        <code>{token.token}</code>
                      ) : (
                        <button
                          className="btn-icon"
                          onClick={() => toggleTokenVisibility(token.id)}
                          title="Reveal Token"
                        >
                          <FontAwesomeIcon icon={token.showToken ? faEyeSlash : faEye} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{token.created_at}</td>
                  <td>{token?.creator || 'System'}</td>
                  <td>{!token.is_used ? token.expires_at : '-'}</td>
                  <td>{token.is_used ? (token.user || 'Unknown') : '-'}</td>
                  <td>{token.is_used ? token.used_at : '-'}</td>
                  <td className='right-align'>
                    {!token.is_used && (
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDeleteToken(token.id)}
                        title="Revoke Token"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Token Modal */}
      {showTokenModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>New API Token Generated</h3>
            <div className="token-display-modal">
            <input
              type="text"
              value={currentToken}
              onChange={(e) => {
                if (e.target.value.length <= 19) {
                  setCurrentToken(e.target.value);
                } else {
                  notification('Token length exceeds 20 characters', 'error'); // Use your notification system here
                }
              }}
              className="code-like"
            />
            </div>
            
            <div className="token-expiry-section">
              <h4>Token Expiry Duration</h4>
              <div className="expiry-options">
                <label className="expiry-option">
                  <input 
                    type="radio" 
                    name="tokenExpiry" 
                    value="1" 
                    checked={selectedExpiry === "1"}
                    onChange={() => setSelectedExpiry("1")}
                  />
                  <span className="option-content">
                    <FontAwesomeIcon icon={faClock} />
                    <span>1 Day</span>
                  </span>
                </label>
                
                <label className="expiry-option">
                  <input 
                  type="radio" 
                  name="tokenExpiry" 
                  value="3" 
                  checked={selectedExpiry === "3"}
                  onChange={() => setSelectedExpiry("3")}
                  />
                  <span className="option-content">
                    <FontAwesomeIcon icon={faClock} />
                    <span>3 Days</span>
                  </span>
                </label>
                
                <label className="expiry-option">
                  <input 
                  type="radio" 
                  name="tokenExpiry" 
                  value="7" 
                  checked={selectedExpiry === "7"}
                  onChange={() => setSelectedExpiry("7")}
                  />
                  <span className="option-content">
                    <FontAwesomeIcon icon={faClock} />
                    <span>7 Days</span>
                  </span>
                </label>
                
                <label className="expiry-option">
                  <input 
                  type="radio" 
                  name="tokenExpiry" 
                  value="30" 
                  checked={selectedExpiry === "30"}
                  onChange={() => setSelectedExpiry("30")}
                  />
                  <span className="option-content">
                    <FontAwesomeIcon icon={faClock} />
                    <span>30 Days</span>
                  </span>
                </label>
              </div>
            </div>

            <p className="warning-text">
              <FontAwesomeIcon icon={faExclamationTriangle} /> 
              Please copy this token now. It won't be shown again.
            </p>
            
            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={() => handleTokenPost()}
              >
                Copy & Post Token
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowTokenModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementTab;
