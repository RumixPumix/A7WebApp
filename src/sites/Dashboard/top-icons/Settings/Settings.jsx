import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faBell, faBellSlash, faUser, faLock, faUserShield, faLanguage } from '@fortawesome/free-solid-svg-icons';
import notification from '../../../ModularComponents/notification';
import { setNotificationEnabled } from '../../utils/handleResponse';
import './settingsStyle.css';

function Settings() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [activeTabSettings, setactiveTabSettings] = useState('general');



    const toggleDarkMode = () => {
        console.log('toggled to');
        setIsDarkMode(!isDarkMode);
        // You would typically implement theme switching logic here
    };

    const toggleNotifications = () => {
        console.log('toggled to', newValue);
        const newValue = !showNotifications;
        setShowNotifications(newValue); // ✅ just updates state
        setNotificationEnabled(newValue);
        notification(`Notifications ${newValue ? 'on' : 'off'}`, 'info'); // ✅ triggers after state change is queued
    };

    return (
        <div className="settings-dropdown">
            <div className="settings-header">
                <h3>Settings</h3>
            </div>
            
            <div className="settings-tabs">
                <button 
                    className={`settings-tab ${activeTabSettings === 'general' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setactiveTabSettings('general')}
                    }
                >
                    General
                </button>
                <button 
                    className={`settings-tab ${activeTabSettings === 'profile' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setactiveTabSettings('profile')}
                    }
                >
                    Profile
                </button>
                <button 
                    className={`settings-tab ${activeTabSettings === 'security' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setactiveTabSettings('security')}
                    }
                >
                    Security
                </button>
            </div>
            
            <div className="settings-content">
                {activeTabSettings === 'general' && (
                    <div className="settings-section">
                        <div className="setting-item">
                            <FontAwesomeIcon icon={faLanguage} />
                            <div className="setting-info">
                                <h4>Language</h4>
                                <p>English (United States)</p>
                            </div>
                            <select className="setting-control">
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                                <option>German</option>
                                <option>Chinese</option>
                            </select>
                        </div>
                        
                        <div className="setting-item">
                            <FontAwesomeIcon icon={isDarkMode ? faMoon : faSun} />
                            <div className="setting-info">
                                <h4>Dark Mode</h4>
                                <p>{isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}</p>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={isDarkMode}
                                    onChange={toggleDarkMode}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        
                        <div className="setting-item">
                            <FontAwesomeIcon icon={showNotifications ? faBell : faBellSlash} />
                            <div className="setting-info">
                                <h4>Notifications</h4>
                                <p>{showNotifications ? 'Notifications enabled' : 'Notifications disabled'}</p>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={showNotifications}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleNotifications();
                                    }}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                )}
                
                {activeTabSettings === 'profile' && (
                    <div className="settings-section">
                        <div className="setting-item">
                            <FontAwesomeIcon icon={faUser} />
                            <div className="setting-info">
                                <h4>Profile Information</h4>
                                <p>Update your name, bio, and other details</p>
                            </div>
                            <button className="setting-action">Edit</button>
                        </div>
                        
                        <div className="setting-item">
                            <FontAwesomeIcon icon={faUser} />
                            <div className="setting-info">
                                <h4>Profile Picture</h4>
                                <p>Change your avatar</p>
                            </div>
                            <button className="setting-action">Upload</button>
                        </div>
                        
                        <div className="setting-item">
                            <FontAwesomeIcon icon={faUser} />
                            <div className="setting-info">
                                <h4>Social Links</h4>
                                <p>Add your social media profiles</p>
                            </div>
                            <button className="setting-action">Add</button>
                        </div>
                    </div>
                )}
                
                {activeTabSettings === 'security' && (
                    <div className="settings-section">
                        <div className="setting-item">
                            <FontAwesomeIcon icon={faLock} />
                            <div className="setting-info">
                                <h4>Change Password</h4>
                                <p>Update your account password</p>
                            </div>
                            <button className="setting-action">Change</button>
                        </div>
                        
                        <div className="setting-item">
                            <FontAwesomeIcon icon={faUserShield} />
                            <div className="setting-info">
                                <h4>Two-Factor Authentication</h4>
                                <p>Add an extra layer of security</p>
                            </div>
                            <button className="setting-action">Enable</button>
                        </div>
                        
                        <div className="setting-item">
                            <FontAwesomeIcon icon={faUserShield} />
                            <div className="setting-info">
                                <h4>Login Activity</h4>
                                <p>View recent account activity</p>
                            </div>
                            <button className="setting-action">View</button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="settings-footer">
                <button className="save-settings">Save Settings</button>
            </div>
        </div>
    );
}

export default Settings;