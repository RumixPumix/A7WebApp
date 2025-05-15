import { useState, useEffect, useMemo } from 'react';
import Spinner from '../../../../ModularComponents/spinner.jsx';
import LastUpdated from '../../../../ModularComponents/lastUpdated.jsx';
import { highlight } from '../../../utils/highlight';

import fetchPermissions from './AdminPanelAPI/fetchPermissions.js';
import fetchRoles from './AdminPanelAPI/fetchRoles.js';

import './AdminPanelStyles/permissionsSection.css';

export default function PermissionsSection({ userInfo, searchTerm = '' }) {
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);

    // Filters
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [assignmentFilter, setAssignmentFilter] = useState('all'); // all, assigned, unassigned
    const [sortBy, setSortBy] = useState('name_asc');

    const search = searchTerm.toLowerCase();

    const rolesWithPermissionMap = useMemo(() => {
        const map = {};
        permissions.forEach(p => {
            map[p.id] = roles.filter(role =>
                Array.isArray(role.permissions) &&
                role.permissions.some(perm => perm.id === p.id)
            );
        });
        return map;
    }, [permissions, roles]);

    function getRolesWithPermission(permissionId) {
        return rolesWithPermissionMap[permissionId] || [];
    }

    const filteredPermissions = useMemo(() => {
        const filtered = permissions
            .filter(p =>
                p.name.toLowerCase().includes(search) ||
                (p.description && p.description.toLowerCase().includes(search))
            )
            .filter(p => {
                if (assignmentFilter === 'assigned') {
                    return getRolesWithPermission(p.id).length > 0;
                }
                if (assignmentFilter === 'unassigned') {
                    return getRolesWithPermission(p.id).length === 0;
                }
                return true;
            })
            .filter(p => {
                if (!selectedRoleId) return true;
                return getRolesWithPermission(p.id).some(role => role.id === Number(selectedRoleId));
            });

        return filtered.sort((a, b) => {
            if (sortBy === 'name_asc') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'name_desc') {
                return b.name.localeCompare(a.name);
            } else if (sortBy === 'role_count_hight_low') {
                return getRolesWithPermission(b.id).length - getRolesWithPermission(a.id).length;
            } else if (sortBy === 'role_count_low_high') {
                return getRolesWithPermission(a.id).length - getRolesWithPermission(b.id).length;
            }
            return 0;
        });
    }, [permissions, search, assignmentFilter, selectedRoleId, roles, sortBy]);

    async function loadAllData() {
        try {
            const [permissionsData, rolesData] = await Promise.all([
                fetchPermissions(),
                fetchRoles()
            ]);
            setPermissions(permissionsData || []);
            setRoles(rolesData || []);
            setLastUpdated(Date.now());
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
                loadAllData();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [lastUpdated]);

    if (loading) {
        return <Spinner item="Permissions" />;
    }

    return (
        <div className="admin-panel-tab-content">
            <LastUpdated lastUpdated={lastUpdated} />
            <div className="admin-panel-tab-header" style={{ marginTop: '40px' }}>
                <h3>Permissions</h3>
            </div>

            {/* Filters UI */}
            <div className="admin-panel-filters">
                <div>
                    <label htmlFor="roleFilter">Filter by Role: </label>
                    <select
                        id="roleFilter"
                        value={selectedRoleId}
                        onChange={e => setSelectedRoleId(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginLeft: '20px' }}>
                    <label htmlFor="assignmentFilter">Assignment: </label>
                    <select
                        id="assignmentFilter"
                        value={assignmentFilter}
                        onChange={e => setAssignmentFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="assigned">Assigned Only</option>
                        <option value="unassigned">Unassigned Only</option>
                    </select>
                </div>

                <div style={{ marginLeft: '20px' }}>
                    <label htmlFor="sortBy">Sort By: </label>
                    <select
                        id="sortBy"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                    >
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                        <option value="role_count_hight_low">Amount (H-L)</option>
                        <option value="role_count_low_high">Amount (L-H)</option>
                    </select>
                </div>

            </div>

            {filteredPermissions.length === 0 ? (
                <div className="admin-panel-empty-state">
                    No permissions found{searchTerm && ` for "${searchTerm}"`}
                </div>
            ) : (
                <div className="permissions-section-permissions-table-container">
                    <table className="permissions-section-permissions-table">
                        <thead>
                            <tr>
                                <th>Permission</th>
                                <th>Description</th>
                                <th>Assigned to Roles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPermissions.map(permission => (
                                <tr key={permission.id}>
                                    <td><code>{highlight(permission.name, searchTerm)}</code></td>
                                    <td>{permission.description ? highlight(permission.description, searchTerm) : '-'}</td>
                                    <td>
                                        {getRolesWithPermission(permission.id).map(role => (
                                            <span key={role.id} className={`permissions-section-role-chip ${role.name.toLowerCase()}`}>
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
