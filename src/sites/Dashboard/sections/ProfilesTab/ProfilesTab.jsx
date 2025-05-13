import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPen,
  faBan,
  faCloudUploadAlt,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import fetchProfiles from './ProfilesAPI/fetchProfiles';
import fetchProfile from './ProfilesAPI/fetchProfile';
import Spinner from '../../../ModularComponents/spinner.jsx';
import postProfileDetails from './ProfilesAPI/postProfileDetails';
import uploadProfileAvatar from './ProfilesAPI/uploadProfileAvatar';
import banUser from '../UsersManagementTab/UsersManagementAPI/banUser';
import unbanUser from '../UsersManagementTab/UsersManagementAPI/unbanUser';
import deleteProfile from '../UsersManagementTab/UsersManagementAPI/deleteUser.js';
import './profileStyle.css';

function ProfilesTab({ userInfo, searchTerm = '' }) {
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');

    const filteredProfiles = profiles.filter(profile => 
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function getProfiles() {
        try {
            setIsLoading(true);
            const profilesData = await fetchProfiles(userInfo);
            setProfiles(profilesData);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleProfileClick(profileId) {
        try {
            setIsLoading(true);
            const profileData = await fetchProfile(profileId);
            setSelectedProfile(profileData);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function handleBackClick() {
        setSelectedProfile(null);
        setEditingField(null);
    }

    function startEditing(fieldName, currentValue) {
        setEditingField(fieldName);
        setTempValue(currentValue || '');
    }

    function cancelEditing() {
        setEditingField(null);
        setTempValue('');
    }

    async function saveEditing() {
        if (!editingField) return;

        try {
            setIsLoading(true);
            const updatedProfile = {
                ...selectedProfile,
                [editingField]: tempValue
            };
            
            const savedProfile = await postProfileDetails(updatedProfile);
            setSelectedProfile(savedProfile);
            await getProfiles(); // Refresh the list
            setEditingField(null);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleAdminActions = async (action, profile) => {
        const role = userInfo.role.toLowerCase();
        if (role !== 'admin' && role !== 'moderator') {
            alert('You do not have permission to perform this action');
            return;
        }

        const confirmAction = window.confirm(`Are you sure you want to ${action} this profile?`);

        if (!confirmAction) return;

        try {
            setIsLoading(true);
            let result = false;

            switch (action) {
                case 'ban':
                    result = await banUser(profile.id);
                    break;
                case 'unban':
                    result = await unbanUser(profile.id);
                    break;
                case 'delete':
                    result = await deleteProfile(profile.id);
                    break;
                default:
                    return;
            }

            if (result) {
                await getProfiles(); // Refresh the list
                if (action === 'delete' && selectedProfile?.id === profile.id) {
                    setSelectedProfile(null);
                }
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setIsLoading(true);
                const avatarUrl = await uploadProfileAvatar(file);
                const updatedProfile = {
                    ...selectedProfile,
                    avatar: avatarUrl
                };
                const savedProfile = await postProfileDetails(updatedProfile);
                setSelectedProfile(savedProfile);
                await getProfiles(); // Refresh the list
            } catch (error) {
                console.error('Error uploading avatar:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        getProfiles();
    }, []);

    if (isLoading) {
        return (
            <div className="profiles-tab">
                <Spinner item="Profiles"/>
            </div>
        );
    }

    if (selectedProfile) {
    return (
        <div className="profiles-tab__detail-view">
            <button className="profiles-tab__back-button" onClick={handleBackClick}>
                ← Back to Users
            </button>

            <div className="profiles-tab__header">
                <div className="profiles-tab__avatar-wrapper">
                    <div className="profiles-tab__avatar-container">
                        <label className="profiles-tab__avatar-edit-label">
                            {selectedProfile.avatar ? (
                                <img src={selectedProfile.avatar} alt="Profile avatar" />
                            ) : (
                                <div className="profiles-tab__default-avatar">
                                    {selectedProfile.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {(userInfo.id === selectedProfile.userId || userInfo.role.toLowerCase() === 'admin') && (
                                <>
                                    <div className="profiles-tab__avatar-edit-overlay">
                                        <FontAwesomeIcon icon={faCloudUploadAlt} />
                                    </div>
                                    <input 
                                        type="file" 
                                        onChange={handleAvatarChange}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                </>
                            )}
                        </label>
                    </div>
                    <div className={`profiles-tab__status-indicator ${selectedProfile.isOnline ? 'online' : 'offline'}`} />
                </div>

                <div className="profiles-tab__profile-info">
                    <div className="profiles-tab__name-section">
                        {editingField === 'name' ? (
                            <div className="profiles-tab__editing-controls">
                                <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    autoFocus
                                />
                                <div className="profiles-tab__edit-actions">
                                    <button className="profiles-tab__confirm-edit" onClick={saveEditing}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                    <button className="profiles-tab__cancel-edit" onClick={cancelEditing}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <h2>
                                {selectedProfile.name}
                                {(userInfo.id === selectedProfile.userId || userInfo.role.toLowerCase() === 'admin') && (
                                    <button 
                                        className="profiles-tab__edit-icon"
                                        onClick={() => startEditing('name', selectedProfile.name)}
                                    >
                                        <FontAwesomeIcon icon={faPen} />
                                    </button>
                                )}
                            </h2>
                        )}
                        <span className="profiles-tab__user-role">{selectedProfile.role}</span>
                    </div>

                    <div className="profiles-tab__meta-info">
                        <span>Joined: {new Date(selectedProfile.joinDate).toLocaleDateString()}</span>
                        {userInfo.role.toLowerCase() === 'admin' && (
                            <span>Email: {selectedProfile.email}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="profiles-tab__content">
                <div className="profiles-tab__bio-section">
                    <h3>
                        About
                        {(userInfo.id === selectedProfile.userId || userInfo.role.toLowerCase() === 'admin') && (
                            <button 
                                className="profiles-tab__edit-icon"
                                onClick={() => startEditing('description', selectedProfile.description)}
                            >
                                <FontAwesomeIcon icon={faPen} />
                            </button>
                        )}
                    </h3>
                    {editingField === 'description' ? (
                        <div className="profiles-tab__editing-controls">
                            <textarea
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                autoFocus
                            />
                            <div className="profiles-tab__edit-actions">
                                <button className="profiles-tab__confirm-edit" onClick={saveEditing}>
                                    <FontAwesomeIcon icon={faCheck} /> Confirm
                                </button>
                                <button className="profiles-tab__cancel-edit" onClick={cancelEditing}>
                                    <FontAwesomeIcon icon={faTimes} /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p>{selectedProfile.description || "This user hasn't written a bio yet."}</p>
                    )}
                </div>

                <div className="profiles-tab__activity-sections">
                    <div className="profiles-tab__activity-section">
                        <h3>Forum Posts</h3>
                        <div className="profiles-tab__activity-list">
                            {selectedProfile.forumPosts?.length > 0 ? (
                                selectedProfile.forumPosts.map(post => (
                                    <div key={post.id} className="profiles-tab__activity-item">
                                        <span>{post.title}</span>
                                        <small>{new Date(post.date).toLocaleDateString()}</small>
                                    </div>
                                ))
                            ) : (
                                <p>No forum posts yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="profiles-tab__activity-section">
                        <h3>Servers Created</h3>
                        <div className="profiles-tab__activity-list">
                            {selectedProfile.serversCreated?.length > 0 ? (
                                selectedProfile.serversCreated.map(server => (
                                    <div key={server.id} className="profiles-tab__activity-item">
                                        <span>{server.name}</span>
                                        <small>{new Date(server.date).toLocaleDateString()}</small>
                                    </div>
                                ))
                            ) : (
                                <p>No servers created yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {userInfo.role.toLowerCase() === 'admin' && (
                <div className="profiles-tab__admin-actions">
                    <button
                        className="profiles-tab__admin-action-button"
                        onClick={() => handleAdminActions('ban', selectedProfile)}
                    >
                        <FontAwesomeIcon icon={faBan} /> Ban User
                    </button>
                </div>
            )}
        </div>
    );
}

return (
    <div className="profiles-tab">
        <h2 className="profiles-tab__title">Community Members</h2>
        
        <div className="profiles-tab__user-list">
            <div className="profiles-tab__list-header">
                <span>User</span>
                <span>Role</span>
                <span>Joined</span>
                <span>Status</span>
            </div>
            {filteredProfiles.map((profile) => (
                <div 
                    key={profile.id} 
                    className="profiles-tab__user-list-item"
                    onClick={() => handleProfileClick(profile.id)}
                >
                    <div className="profiles-tab__user-main">
                        <div className="profiles-tab__avatar-wrapper">
                            <div className="profiles-tab__avatar-container-list">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt={`${profile.name}'s avatar`} />
                                ) : (
                                    <div className="profiles-tab__default-avatar-list">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="profiles-tab__user-name">{profile.name}</span>
                    </div>
                    <span className="profiles-tab__user-role">{profile.role}</span>
                    <span className="profiles-tab__join-date">{new Date(profile.joinDate).toLocaleDateString()}</span>
                    <span className={`profiles-tab__user-status ${profile.isOnline ? 'online' : 'offline'}`}>
                        {profile.isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            ))}
        </div>
    </div>
);
}

export default ProfilesTab;