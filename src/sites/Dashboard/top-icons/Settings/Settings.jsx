import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSun, faMoon, faBell, faBellSlash, 
  faUser, faLock, faUserShield, faLanguage,
  faChevronRight,
  faComputer
} from '@fortawesome/free-solid-svg-icons';
import notification from '../../../ModularComponents/notification';
import './settingsStyle.css';

function Settings({ theme, toggleTheme }) {
    const [activeTabSettings, setActiveTabSettings] = useState('general');
    const [showNotifications, setShowNotifications] = useState(false);

    const toggleNotifications = () => {
        const newValue = !showNotifications;
        setShowNotifications(newValue);
        localStorage.setItem('settings', JSON.stringify({ showNotification: newValue }));
        notification(`Notifications ${newValue ? 'on' : 'off'}`, 'info');
    };

    return (
        <div className="top-icon-settings_dropdown">
            <div className="top-icon-settings_header">
                <h3>Settings</h3>
            </div>
            
            <div className="top-icon-settings_tabs">
                <button 
                    className={`top-icon-settings_tab ${activeTabSettings === 'general' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveTabSettings('general');
                    }}
                >
                    General
                    <FontAwesomeIcon icon={faChevronRight} className="top-icon-settings_tab-icon" />
                </button>
                <button 
                    className={`top-icon-settings_tab ${activeTabSettings === 'profile' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveTabSettings('profile');
                    }}
                >
                    Profile
                    <FontAwesomeIcon icon={faChevronRight} className="top-icon-settings_tab-icon" />
                </button>
                <button 
                    className={`top-icon-settings_tab ${activeTabSettings === 'security' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveTabSettings('security');
                    }}
                >
                    Security
                    <FontAwesomeIcon icon={faChevronRight} className="top-icon-settings_tab-icon" />
                </button>
            </div>
            
            <div className="top-icon-settings_content">
                {activeTabSettings === 'general' && (
                    <div className="top-icon-settings_section">
                        <div className="top-icon-settings_item">
                            <div className="top-icon-settings_item-icon">
                                <FontAwesomeIcon 
                                    icon={theme === 'light' ? faSun : theme === 'dark' ? faMoon : faComputer} 
                                    className="top-icon-settings_theme-icon"
                                />
                            </div>
                            <div className="top-icon-settings_item-info">
                                <h4>Theme</h4>
                                <p>Current: {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}</p>
                            </div>
                            <div className="top-icon-settings_theme-toggle">
                                <button 
                                    className="top-icon-settings_theme-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTheme();
                                    }}
                                >
                                    {theme === 'light' ? (
                                        <>
                                            <FontAwesomeIcon icon={faMoon} /> Dark
                                        </>
                                    ) : theme === 'dark' ? (
                                        <>
                                            <FontAwesomeIcon icon={faComputer} /> System
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSun} /> Light
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="top-icon-settings_item">
                            <div className="top-icon-settings_item-icon">
                                <FontAwesomeIcon icon={faLanguage} />
                            </div>
                            <div className="top-icon-settings_item-info">
                                <h4>Language</h4>
                                <p>English (United States)</p>
                            </div>
                            <select className="top-icon-settings_control">
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                                <option>German</option>
                                <option>Chinese</option>
                            </select>
                        </div>
                        
                        <div className="top-icon-settings_item">
                            <div className="top-icon-settings_item-icon">
                                <FontAwesomeIcon icon={showNotifications ? faBell : faBellSlash} />
                            </div>
                            <div className="top-icon-settings_item-info">
                                <h4>Notifications</h4>
                                <p>{showNotifications ? 'Notifications enabled' : 'Notifications disabled'}</p>
                            </div>
                            <label className="top-icon-settings_switch">
                                <input 
                                    type="checkbox" 
                                    checked={showNotifications}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleNotifications();
                                    }}
                                />
                                <span className="top-icon-settings_slider"></span>
                            </label>
                        </div>
                    </div>
                )}
                
                {activeTabSettings === 'profile' && (
                    <div className="top-icon-settings_section">
                        <div className="top-icon-settings_item">
                            <div className="top-icon-settings_item-icon">
                                <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div className="top-icon-settings_item-info">
                                <h4>Profile Information</h4>
                                <p>Update your name, bio, and other details</p>
                            </div>
                            <button className="top-icon-settings_action">Edit</button>
                        </div>
                        
                        <div className="top-icon-settings_item">
                            <div className="top-icon-settings_item-icon">
                                <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div className="top-icon-settings_item-info">
                                <h4>Profile Picture</h4>
                                <p>Change your avatar</p>
                            </div>
                            <button className="top-icon-settings_action">Upload</button>
                        </div>
                    </div>
                )}
                
                {activeTabSettings === 'security' && (
                    <div className="top-icon-settings_section">
                        <div className="top-icon-settings_item">
                            <div className="top-icon-settings_item-icon">
                                <FontAwesomeIcon icon={faLock} />
                            </div>
                            <div className="top-icon-settings_item-info">
                                <h4>Change Password</h4>
                                <p>Update your account password</p>
                            </div>
                            <button className="top-icon-settings_action">Change</button>
                        </div>
                        
                        <div className="top-icon-settings_item">
                            <div className="top-icon-settings_item-icon">
                                <FontAwesomeIcon icon={faUserShield} />
                            </div>
                            <div className="top-icon-settings_item-info">
                                <h4>Two-Factor Authentication</h4>
                                <p>Add an extra layer of security</p>
                            </div>
                            <button className="top-icon-settings_action">Enable</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Settings;