import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignOutAlt, faServer, faUsers, faFileUpload,
  faComments, faTerminal, faCog, faBell,
  faHouse, faTools
} from '@fortawesome/free-solid-svg-icons';
import './dashboardStyle.css';
import './global.css'
import notification from '../ModularComponents/notification';
import ServersTab from './sections/ServersTab/ServersTab';
import AdminPanelTab from './sections/AdminPanelTab/AdminPanelTab';
import FilesTab from './sections/FilesTab/FilesTab';
import ForumsTab from './sections/ForumsTab/ForumsTab';
import ConsoleTab from './sections/ConsoleTab/ConsoleTab';
import HomeTab from './sections/HomeTab/HomeTab';
import ProfilesTab from './sections/ProfilesTab/ProfilesTab';
import Messages from './top-icons/Messages/Messages';
import Settings from './top-icons/Settings/Settings';
import getUserInfo from './utils/getUserInfo';

function Dashboard() {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || 'home';
    });
    const [loading, setLoading] = useState({ servers: false, users: false, files: false, forum: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const navigate = useNavigate();

    const userInfo = getUserInfo();
    localStorage.setItem('settings', JSON.stringify({ showNotifications }));

    useEffect(() => {
        let isMounted = true;        
    
        async function periodicTokenCheck() {
            try {
                const validateAndFetchUser = (await import('../../API/validateAndFetchUser')).default;
                const user = await validateAndFetchUser();
                if (isMounted && !user) {
                    window.localStorage.clear();
                    window.location.reload();
                    navigate('/login', { replace: true });
                }
            } catch (error) {
                window.localStorage.clear();
                window.location.reload();
                if (isMounted) navigate('/login', { replace: true });
            }
        }
    
        const interval = setInterval(periodicTokenCheck, 5 * 60 * 1000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [navigate, showNotifications]); // ✅ combine into one array

    const toggleNotifications = () => {
        const newValue = !showNotifications;
        setShowNotifications(newValue); // ✅ just updates state
        localStorage.setItem('settings', JSON.stringify({ showNotification: newValue }));
        notification(`Notifications ${newValue ? 'on' : 'off'}`, 'info'); // ✅ triggers after state change is queued
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    const renderActiveTab = () => {
        localStorage.setItem('activeTab', activeTab);
        switch (activeTab) {
            case 'servers': return <ServersTab userInfo={userInfo} searchTerm={searchQuery} />;
            case 'adminPanel': return <AdminPanelTab userInfo={userInfo} searchTerm={searchQuery} />;
            case 'profiles': return <ProfilesTab userInfo={userInfo} searchTerm={searchQuery} />;
            case 'files': return <FilesTab userInfo={userInfo} searchTerm={searchQuery} />;
            case 'forums': return <ForumsTab userInfo={userInfo} searchTerm={searchQuery} />;
            case 'console': return <ConsoleTab userInfo={userInfo}/>;
            case 'home': return <HomeTab userInfo={userInfo}/>;
            default: return <HomeTab userInfo={userInfo} />;
        }
    };

    const tabs = [
        { key: 'home', label: 'Home', icon: faHouse, adminOnly: false, showLoading: null },
        { key: 'servers', label: 'Servers', icon: faServer, adminOnly: false, showLoading: 'servers' },
        { key: 'files', label: userInfo.is_admin ? 'File Manager' : 'Files', icon: faFileUpload, adminOnly: false, showLoading: 'files' },
        { key: 'forums', label: 'Community Forum', icon: faComments, adminOnly: false, showLoading: 'forum' },
        { key: 'profiles', label: 'Profiles', icon: faUsers, adminOnly: false, showLoading: null },
        { key: 'console', label: 'Console', icon: faTerminal, adminOnly: true, showLoading: null },
        { key: 'adminPanel', label: 'Admin Panel', icon: faTools, adminOnly: true, showLoading: 'users' },
    ];

    const renderTabs = () => (
        tabs.map(tab => {
            if (tab.adminOnly && !userInfo.is_admin) return null;
            return (
                <div 
                    key={tab.key}
                    className={`menu-item ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                >
                    <FontAwesomeIcon icon={tab.icon} />
                    <span>{tab.label}</span>
                    {tab.showLoading && loading[tab.showLoading] && <span className="loading-dot"></span>}
                </div>
            );
        })
    );

    return (
        <div className="dashboard-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Ace7 Panel</h2>
                    <div className="user-info">
                        <div className="user-avatar">{userInfo.username?.charAt(0).toUpperCase()}</div>
                        <div>
                            <p className="username">{userInfo.username}</p>
                            <p className="user-role">{userInfo.role}</p>
                        </div>
                    </div>
                </div>
                <div className="sidebar-menu">
                    {renderTabs()}
                </div>
                <div className="sidebar-footer">
                    <div className="menu-item" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <span>Logout</span>
                    </div>
                </div>
            </div>

            <div className="main-content">
                <div className="top-nav">
                    <div className="search-bar">
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="nav-icons">
                        <div 
                            className={`notification-icon ${showNotifications ? 'active' : ''}`}
                            onClick={toggleNotifications}
                            title={showNotifications ? 'Notifications On' : 'Notifications Off'}
                        >
                            <FontAwesomeIcon icon={faBell} />
                        </div>
                        <div 
                            className="messages-icon"
                            onClick={() => {
                                setShowMessages(!showMessages);
                                setShowSettings(false);
                            }}
                        >
                            <FontAwesomeIcon icon={faComments} />
                            {showMessages && <Messages />}
                        </div>
                        <div 
                            className="settings-icon"
                            onClick={() => {
                                setShowSettings(!showSettings);
                                setShowMessages(false);
                            }}
                        >
                            <FontAwesomeIcon icon={faCog} />
                            {showSettings && <Settings />}
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    {renderActiveTab()}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

