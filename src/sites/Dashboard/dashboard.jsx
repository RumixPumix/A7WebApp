import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignOutAlt, faServer, faUsers, faFileUpload, faFileDownload,
  faComments, faTerminal, faChartLine, faCog, faBell,
  faHouse
} from '@fortawesome/free-solid-svg-icons';
import './dashboardStyle.css';
import { setNotificationEnabled } from './utils/handleResponse';
import notification from '../ModularComponents/notification';
import ServersTab from './sections/ServersTab/ServersTab';
import UserManagementTab from './sections/UsersManagementTab/UsersManagementTab';
import FilesTab from './sections/FilesTab/FilesTab';
import ForumsTab from './sections/ForumsTab/ForumsTab';
import ConsoleTab from './sections/ConsoleTab/ConsoleTab';
import HomeTab from './sections/HomeTab/HomeTab';
import AnalyticsTab from './sections/AnalyticsTab/AnalyticsTab';
import Messages from './top-icons/Messages/Messages';
import Settings from './top-icons/Settings/Settings';

function Dashboard({ userInfo }) {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || 'home';
    });
    const [loading, setLoading] = useState({ servers: false, users: false, files: false, forum: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const navigate = useNavigate();

    const isAdmin = userInfo?.is_admin === "true"; // make sure it's a boolean
    const username = userInfo?.username;
    const userId = userInfo?.user_id;

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
    
        setNotificationEnabled(showNotifications); // ✅ will now trigger when showNotifications changes
    
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [navigate, showNotifications]); // ✅ combine into one array

    const toggleNotifications = () => {
        const newValue = !showNotifications;
        setShowNotifications(newValue); // ✅ just updates state
        notification(`Notifications ${newValue ? 'on' : 'off'}`, 'info'); // ✅ triggers after state change is queued
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    const renderActiveTab = () => {
        localStorage.setItem('activeTab', activeTab);
        switch (activeTab) {
            case 'servers': return <ServersTab isAdmin={isAdmin} />;
            case 'userManagement': return <UserManagementTab />;
            case 'files': return <FilesTab isAdmin={isAdmin} currentUserId={userId} />;
            case 'forums': return <ForumsTab />;
            case 'console': return <ConsoleTab />;
            case 'analytics': return <AnalyticsTab />;
            case 'home': return <HomeTab isAdmin={isAdmin}/>;
            default: return <HomeTab />;
        }
    };

    const tabs = [
        { key: 'home', label: 'Home', icon: faHouse, adminOnly: false, showLoading: null },
        { key: 'servers', label: 'Servers', icon: faServer, adminOnly: false, showLoading: 'servers' },
        { key: 'files', label: isAdmin ? 'File Manager' : 'Files', icon: isAdmin ? faFileUpload : faFileDownload, adminOnly: false, showLoading: 'files' },
        { key: 'forums', label: 'Community Forum', icon: faComments, adminOnly: false, showLoading: 'forum' },
        { key: 'console', label: 'Console', icon: faTerminal, adminOnly: true, showLoading: null },
        { key: 'userManagement', label: 'User Management', icon: faUsers, adminOnly: true, showLoading: 'users' },
        { key: 'analytics', label: 'Analytics', icon: faChartLine, adminOnly: true, showLoading: null },
    ];

    const renderTabs = () => (
        tabs.map(tab => {
            if (tab.adminOnly && !isAdmin) return null;
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
                        <div className="user-avatar">{username?.charAt(0).toUpperCase()}</div>
                        <div>
                            <p className="username">{username}</p>
                            <p className="user-role">{isAdmin ? 'Administrator' : 'User'}</p>
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
