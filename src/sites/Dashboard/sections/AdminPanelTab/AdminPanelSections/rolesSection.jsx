import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faEdit, faTrash   } from '@fortawesome/free-solid-svg-icons';
import Spinner from '../../../../ModularComponents/spinner.jsx';
import LastUpdated from '../../../../ModularComponents/lastUpdated.jsx';
import { highlight } from '../../../utils/highlight';


import fetchRoles from './AdminPanelAPI/fetchRoles.js';
import fetchPermissions from './AdminPanelAPI/fetchPermissions.js';

import './AdminPanelStyles/rolesSection.css'

export default function RolesSection({ userInfo, searchTerm = ''}) {
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [draggedPermission, setDraggedPermission] = useState(null);
    const [sortBy, setSortBy] = useState('name_asc');

    const filteredRoles = useMemo(() => {
      const filtered = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const sorted = filtered.sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'permission_count_low_high') return a.permissions.length - b.permissions.length;
        if (sortBy === 'permission_count_high_low') return b.permissions.length - a.permissions.length;
        return 0;
      });

      return sorted;
    }, [roles, searchTerm, sortBy]);

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

    async function loadPermissionsData(){
        try {
          let permissionsData = await fetchPermissions(); // Assuming you have a function to fetch permissions
          if (!permissionsData) {
            permissionsData = []; // Fallback to empty array if fetch fails
          }
          setPermissions(permissionsData);
        } finally {
          setLoading(false);
        }
    }

    useEffect(() => {
        loadPermissionsData();
        loadRolesData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
                loadRolesData();
                loadPermissionsData();
                setLastUpdated(Date.now()); // Update last updated time
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastUpdated]);

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
    setLoading(true);
    const result = await deleteRole(roleId);
    if (!result) {
      setLoading(false);
      return;
    }
    await loadRolesData();
  };

  if (loading) {
    return (
        <Spinner item="Roles" />
    )
  }

return (
  <div className="admin-panel-tab-content">
    <LastUpdated lastUpdated={lastUpdated} />
    <div className="admin-panel-tab-header" style={{ marginTop: "40px" }}>
      <h3>Roles Management</h3>
      <button className="admin-panel-btn-primary" onClick={handleOpenAddRole}>
        <FontAwesomeIcon icon={faUserShield} /> Add Role
      </button>

      {showRoleModal && (
        <div className="role-section-modal">
          <div className="role-section-modal-content">
            <h3>{editingRole ? "Edit Role" : "Add New Role"}</h3>
            <form onSubmit={handleRoleSubmit}>
              <div className="role-section-form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  name="roleName"
                  defaultValue={editingRole?.name || ""}
                  required
                />
              </div>

              <div className="role-section-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  defaultValue={editingRole?.description || ""}
                  rows="3"
                />
              </div>

              <div className="role-section-form-group">
                <label>Permissions</label>
                <div className="role-section-permissions-dnd-container">
                  {/* Inactive Permissions */}
                  <div className="role-section-permissions-column">
                    <h4>Available Permissions</h4>
                    <div className="role-section-permissions-list inactive">
                      {permissions
                        .filter(
                          (permission) =>
                            !editingRole?.permissions?.some(
                              (perm) => perm.id === permission.id,
                            ),
                        )
                        .map((permission) => (
                          <div
                            key={`inactive-${permission.id}`}
                            className="role-section-permission-item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, permission)}
                          >
                            {permission.name}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Active Permissions */}
                  <div className="role-section-permissions-column">
                    <h4>Assigned Permissions</h4>
                    <div
                      className="role-section-permissions-list active"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, "assign")}
                    >
                      {editingRole?.permissions?.map((permission) => (
                        <div
                          key={`active-${permission.id}`}
                          className="role-section-permission-item"
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

              <div className="role-section-form-actions">
                <button
                  type="button"
                  className="admin-panel-btn-secondary"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-panel-btn-primary">
                  {editingRole ? "Update Role" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    <div className="admin-panel-filters">
      <div style={{ marginLeft: "20px" }}>
        <label htmlFor="sortBy">Sort By: </label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="permission_count_high_low">Perm. Count (H-L)</option>
          <option value="permission_count_low_high">Perm. Count (L-H)</option>
        </select>
      </div>
    </div>


    {filteredRoles.length === 0 ? (
      <div className="admin-panel-empty-state">No roles found</div>
    ) : (
      <div className="role-section-roles-table-container">
        <table className="role-section-roles-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Description</th>
              <th>Permissions Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role) => (
              <tr key={role.id}>
                <td>
                  <span className={`role-section-role-badge ${role.name.toLowerCase()}`}>
                    {highlight(role.name, searchTerm)}
                  </span>
                </td>
                <td>{role.description ? highlight(role.description, searchTerm) : '-'}</td>
                <td>{role.permissions?.length || 0}</td>
                <td>
                  <div className = "role-section-actions">
                    <button
                      className="admin-panel-btn-icon"
                      onClick={() => handleEditRole(role)}
                      title="Edit Role"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="admin-panel-btn-icon danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete the ${role.name} role?`,
                          )
                        ) {
                          handleDeleteRole(role.id);
                        }
                      }}
                      title="Delete Role"
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