import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCog, faTrash, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import addUser from './AdminPanelAPI/addUser.js';
import editUser from './AdminPanelAPI/editUser.js';
import deleteUser from './AdminPanelAPI/deleteUser.js';
import fetchUsers from './AdminPanelAPI/fetchUsers.js';
import Spinner from '../../../../ModularComponents/spinner.jsx';
import LastUpdated from '../../../../ModularComponents/lastUpdated.jsx';

//TEMP FIX
import fetchRoles from './AdminPanelAPI/fetchRoles.js';
//END TEMP FIX

import './AdminPanelStyles/userSection.css';


export default function UsersSection({ userInfo, searchTerm = ''}){
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    //TEMPORARY FIX
    const[roles, setRoles] = useState([]);

    async function loadRolesData(){
            try {
            let rolesData = await fetchRoles(); // Assuming you have a function to fetch roles
            if (!rolesData) {
                rolesData = []; // Fallback to empty array if fetch fails
            }
            setRoles(rolesData);
            setLastUpdated(Date.now());
            } finally {
            setLoading(false);
            }
    }
    // END TEMP FIX

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.created_at.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_login?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function loadUsersData(){
        try {
            let usersData = await fetchUsers();
            if (!usersData) {
                usersData = []; // Fallback to empty array if fetch fails
            }
            setUsers(usersData);
            setLastUpdated(Date.now()); // Update last updated time
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsersData();
        //temp fix
        loadRolesData()
        //
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
                loadUsersData();
                //TEMP FIX
                loadRolesData()
                //
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
            setLoading(true);
            let result;
            if (editingUser) {
                result = await editUser(editingUser.id, userData);
            } else {
                result = await addUser(userData);
            }
            if (!result) {
                setLoading(false);
                return;
            }
            await loadUsersData();
        } finally {
            setShowUserModal(false);
            setEditingUser(null);
            setLoading(false);
        }
    };
    
    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowPassword(false);
        setShowUserModal(true);
    };
    
    const handleDeleteUser = async (userId) => {
        setLoading(true);
        const result = await deleteUser(userId);
        if (!result) {
            setLoading(false);
            return;
        }
        await loadUsersData();
    };

    if (loading) {
        return (
            <Spinner item="Users" />
        );
    }

    return (
        <div className="admin-panel-tab-content">
            <LastUpdated lastUpdated={lastUpdated} />
            <div className="admin-panel-tab-header">
                <h3>User Management</h3>
                <button className="admin-panel-btn-primary" onClick={handleOpenAddUser}>
                    <FontAwesomeIcon icon={faUserCog} /> Add User
                </button>

                {showUserModal && (
                <div className="user-section-modal">
                    <div className="user-section-modal-content">
                        <h3>{editingUser ? "Edit User" : "Add New User"}</h3>
                        <form onSubmit={handleUserSubmit}>
                        <div className="user-section-form-group">
                            <label>Username</label>
                            <input
                            type="text"
                            name="username"
                            defaultValue={editingUser?.username || ""}
                            required
                            />
                        </div>

                        {!editingUser && (
                            <div className="user-section-form-group">
                            <label>Password</label>
                            <div className="user-section-password-input-wrapper">
                                <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                />
                                <button
                                type="button"
                                className="admin-panel-btn-icon small"
                                onClick={() => setShowPassword((prev) => !prev)}
                                style={{ marginLeft: "8px" }}
                                >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                </button>
                            </div>
                            </div>
                        )}

                        <div className="user-section-form-group">
                            <label>Role</label>
                            <select name="role" defaultValue={editingUser?.role || "user"}>
                            {roles.map((role) => (
                                <option key={role.id} value={role.name}>
                                {role.name}
                                </option>
                            ))}
                            </select>
                        </div>

                        <div className="user-section-form-actions">
                            <button
                            type="button"
                            className="admin-panel-btn-secondary"
                            onClick={() => setShowUserModal(false)}
                            >
                            Cancel
                            </button>
                            <button type="submit" className="admin-panel-btn-primary">
                            {editingUser ? "Update User" : "Create User"}
                            </button>
                        </div>
                        </form>
                    </div>
                </div>
                )}
            </div>
            {users.length === 0 ? (
                <div className="admin-panel-empty-state">No users found</div>
            ) : (
                <div className="user-section-user-table-container">
                    <table className="user-section-user-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Joined</th>
                                <th>Last Login</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.username}</td>
                                    <td>{user.created_at}</td>
                                    <td>{user.last_login || "Never"}</td>
                                    <td>
                                        <span className={`user-section-role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
                                    </td>
                                    <td>
                                        <div className = "user-section-actions">
                                            <button
                                            className="admin-panel-btn-icon"
                                            onClick={() => handleEditUser(user)}
                                            title="Edit User"
                                            >
                                            <FontAwesomeIcon icon={faUserCog} />
                                            </button>
                                            <button
                                            className="admin-panel-btn-icon danger"
                                            onClick={() => {
                                                if (
                                                window.confirm(
                                                    `Are you sure you want to delete ${user.username}?`,
                                                )
                                                ) {
                                                handleDeleteUser(user.id);
                                                }
                                            }}
                                            title="Delete User"
                                            >
                                            <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
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