import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCog, faLock, faEdit, faUserShield, faKey, faClock, faTimes, faTrash, faExclamationTriangle, faEye, faEyeSlash, faShield, faUsers, faHome, faGear, faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';
import addUser from './AdminPanelAPI/addUser.js';
import editUser from './AdminPanelAPI/editUser.js';
import deleteUser from './AdminPanelAPI/deleteUser.js';
import fetchUsers from './AdminPanelAPI/fetchUsers.js';
import fetchTokens from './AdminPanelAPI/fetchTokens.js';
import fetchRoles from './AdminPanelAPI/fetchRoles.js';
import fetchPermissions from './AdminPanelAPI/fetchPermissions.js';
import generateToken from './AdminPanelAPI/generateToken.js';
import deleteToken from './AdminPanelAPI/deleteToken.js';
import postToken from './AdminPanelAPI/postToken.js';
import notification from '../../../ModularComponents/notification.jsx';
import './adminPanelStyle.css'; // Assuming you have a CSS file for styling
import Spinner from '../../../ModularComponents/spinner.jsx'; // your spinner component
import LastUpdated from '../../../ModularComponents/lastUpdated.jsx'; // your last updated component

function AdminPanelTab({ userInfo, searchTerm = ''}) {
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [currentToken, setCurrentToken] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState({ users: true, tokens: true, permissions: true, roles: true });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState("1"); // Default to 1 day
  const [showExpiredTokens, setShowExpiredTokens] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null); // Track when last updated
  const [draggedPermission, setDraggedPermission] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // Track the active tab
  const valid_activeTabs = ['users', 'tokens', 'roles', 'permissions', 'home'];
  const [darkMode, setDarkMode] = useState(false); // Track dark mode state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.created_at.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_login?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredTokens = tokens.filter(token =>
    token.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.created_at.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.expires_at?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.used_at?.toLowerCase().includes(searchTerm.toLowerCase())
  );


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
    } finally {
      setLoading((prev) => ({ ...prev, tokens: false }));
    }
  }

  async function loadPermissionsData(){
    try {
      let permissionsData = await fetchPermissions(); // Assuming you have a function to fetch permissions
      if (!permissionsData) {
        permissionsData = []; // Fallback to empty array if fetch fails
      }
      setPermissions(permissionsData);
    } finally {
      setLoading((prev) => ({ ...prev, permissions: false }));
    }
  }

  async function loadRolesData(){
    try {
      let rolesData = await fetchRoles(); // Assuming you have a function to fetch roles
      if (!rolesData) {
        rolesData = []; // Fallback to empty array if fetch fails
      }
      setRoles(rolesData);
    } finally {
      setLoading((prev) => ({ ...prev, roles: false }));
    }
  }

  useEffect(() => {
    loadUsersData();
    loadTokensData();
    loadPermissionsData();
    loadRolesData();
  }, []);

  useEffect(() => {
      const interval = setInterval(() => {
        if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
          //setLoading({ users: true, tokens: true });
          loadUsersData();
          loadTokensData();
          loadPermissionsData();
          loadRolesData();
          setLastUpdated(Date.now()); // Update last updated time
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

  const handleOpenAddRole = () => {
    setEditingRole(null);
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const roleData = {
      name: formData.get('roleName'),
      description: formData.get('description'),
      permissions: Array.from(formData.getAll('permissions')),
    };

    console.log(roleData);
  }

  const handleEditRole = (role) => {
    setEditingRole(role);
    setShowRoleModal(true);
  };

  const handleDragStart = (e, permission) => {
    setDraggedPermission(permission);
    e.dataTransfer.setData('text/plain', permission.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, action) => {
    e.preventDefault();
    if (!draggedPermission) return;

    const updatedPermissions = action === 'assign'
      ? [...(editingRole?.permissions || []), draggedPermission]
      : editingRole?.permissions?.filter(perm => perm.id !== draggedPermission.id);

    setEditingRole({
      ...editingRole,
      permissions: updatedPermissions
    });
  };

  const handleDeleteRole = async (roleId) => {
    setLoading((prev) => ({ ...prev, roles: true }));
    const result = await deleteRole(roleId);
    if (!result) {
      setLoading((prev) => ({ ...prev, roles: false }));
      return;
    }
    await loadRolesData();
  };

  const getRolesWithPermission = (permissionId) => {
    return roles.filter(role => role.permissions && role.permissions.includes(permissionId));
  };



  if (loading.users || loading.tokens) {
    return (
      <Spinner item="Management Board" />
    );
  }

  if (!valid_activeTabs.includes(activeTab)) {
    setActiveTab('home'); // Default to users tab if invalid tab is set
  }
  if (activeTab === 'home') {
    return (
      <div className={`admin-dashboard ${darkMode ? 'dark' : 'light'}`}>
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h2>Admin<span>Portal</span></h2>
            <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? '◄' : '►'}
            </button>
          </div>
          
          <nav>
            <ul>
              <li className="active">
                <button onClick={() => setActiveTab('home')}>
                  <FontAwesomeIcon icon={faHome} className="icon" />
                  {sidebarOpen && <span>Dashboard</span>}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('users')}>
                  <FontAwesomeIcon icon={faUsers} className="icon" />
                  {sidebarOpen && <span>Users</span>}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('tokens')}>
                  <FontAwesomeIcon icon={faKey} className="icon" />
                  {sidebarOpen && <span>Tokens</span>}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('roles')}>
                  <FontAwesomeIcon icon={faShield} className="icon" />
                  {sidebarOpen && <span>Roles</span>}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('permissions')}>
                  <FontAwesomeIcon icon={faLock} className="icon" />
                  {sidebarOpen && <span>Permissions</span>}
                </button>
              </li>
            </ul>
          </nav>
          
          <div className="sidebar-footer">
            <button className="settings-btn" onClick={() => setDarkMode(!darkMode)}>
              <FontAwesomeIcon icon={faGear} className="icon" />
              {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            <button className="logout-btn">
              <FontAwesomeIcon icon={faArrowAltCircleLeft} className="icon" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>
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
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
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
              {filteredUsers.map((user) => (
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
            {filteredTokens.map((token) => {
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
      {/* Roles Management Section */}
      <div className="tab-header" style={{ marginTop: '40px' }}>
        <h3>Roles Management</h3>
        <button className="btn-primary" onClick={handleOpenAddRole}>
          <FontAwesomeIcon icon={faUserShield} /> Add Role
        </button>

        {showRoleModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>{editingRole ? 'Edit Role' : 'Add New Role'}</h3>
              <form onSubmit={handleRoleSubmit}>
                <div className="form-group">
                  <label>Role Name</label>
                  <input
                    type="text"
                    name="roleName"
                    defaultValue={editingRole?.name || ''}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingRole?.description || ''}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-dnd-container">
                    {/* Inactive Permissions */}
                    <div className="permissions-column">
                      <h4>Available Permissions</h4>
                      <div className="permissions-list inactive">
                        {permissions
                          .filter(permission => !editingRole?.permissions?.some(perm => perm.id === permission.id))
                          .map(permission => (
                            <div 
                              key={`inactive-${permission.id}`}
                              className="permission-item"
                              draggable
                              onDragStart={(e) => handleDragStart(e, permission)}
                            >
                              {permission.name}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Active Permissions */}
                    <div className="permissions-column">
                      <h4>Assigned Permissions</h4>
                      <div 
                        className="permissions-list active"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'assign')}
                      >
                        {editingRole?.permissions?.map(permission => (
                          <div
                            key={`active-${permission.id}`}
                            className="permission-item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, permission)}
                          >
                            {permission.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Roles Table */}
      {roles.length === 0 ? (
        <div className="empty-state">No roles found</div>
      ) : (
        <div className="roles-table-container">
          <table className="roles-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Permissions Count</th>
                <th className='right-align-action'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <span className={`role-badge ${role.name.toLowerCase()}`}>
                      {role.name}
                    </span>
                  </td>
                  <td>{role.description || '-'}</td>
                  <td>{role.permissions?.length || 0}</td>
                  <td className='right-align'>
                    <button
                      className="btn-icon"
                      onClick={() => handleEditRole(role)}
                      title="Edit Role"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the ${role.name} role?`)) {
                          handleDeleteRole(role.id);
                        }
                      }}
                      title="Delete Role"
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

      {/* Permissions Section */}
      <div className="tab-header" style={{ marginTop: '40px' }}>
        <h3>Permissions</h3>
      </div>

      {permissions.length === 0 ? (
        <div className="empty-state">No permissions found</div>
      ) : (
        <div className="permissions-table-container">
          <table className="permissions-table">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Description</th>
                <th>Assigned to Roles</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.id}>
                  <td>
                    <code>{permission.name}</code>
                  </td>
                  <td>{permission.description || '-'}</td>
                  <td>
                    {getRolesWithPermission(permission.id).map(role => (
                      <span key={role.id} className="role-chip">
                        {role.name}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPanelTab;
