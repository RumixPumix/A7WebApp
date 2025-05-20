import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignOutAlt, faServer, faUsers, faFileUpload,
  faComments, faTerminal, faCog, faBell,
  faHouse, faTools, faSearch, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import './dashboardMain.css';
import './global.css';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
    const navigate = useNavigate();

    const userInfo = getUserInfo();
    
    // Theme handling
    useEffect(() => {
        const applyTheme = () => {
            const root = document.documentElement;
            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                root.classList.add('dark-theme');
                root.classList.remove('light-theme');
            } else {
                root.classList.add('light-theme');
                root.classList.remove('dark-theme');
            }
        };
        
        applyTheme();
        localStorage.setItem('theme', theme);
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => theme === 'system' && applyTheme();
        mediaQuery.addListener(listener);
        
        return () => mediaQuery.removeListener(listener);
    }, [theme]);

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
    }, [navigate]);

    const toggleNotifications = () => {
        const newValue = !showNotifications;
        setShowNotifications(newValue);
        localStorage.setItem('settings', JSON.stringify({ showNotification: newValue }));
        notification(`Notifications ${newValue ? 'on' : 'off'}`, 'info');
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            return 'light';
        });
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
        { key: 'home', label: 'Home', icon: faHouse, adminOnly: false },
        { key: 'servers', label: 'Servers', icon: faServer, adminOnly: false },
        { key: 'files', label: userInfo.is_admin ? 'File Manager' : 'Files', icon: faFileUpload, adminOnly: false },
        { key: 'forums', label: 'Community', icon: faComments, adminOnly: false },
        { key: 'profiles', label: 'Profiles', icon: faUsers, adminOnly: false },
        { key: 'console', label: 'Console', icon: faTerminal, adminOnly: true },
        { key: 'adminPanel', label: 'Admin', icon: faTools, adminOnly: true },
    ];

    const renderTabs = () => (
        tabs.map(tab => {
            if (tab.adminOnly && !userInfo.is_admin) return null;
            return (
                <button 
                    key={tab.key}
                    className={`dashboard-main_menu-item ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                    aria-label={tab.label}
                >
                    <FontAwesomeIcon icon={tab.icon} className="dashboard-main_menu-icon" />
                    <span className="dashboard-main_menu-label">{tab.label}</span>
                </button>
            );
        })
    );

    return (
        <div className={`dashboard-main_dashboard-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="dashboard-main_sidebar">
                <div className="dashboard-main_sidebar-header">
                    <div className="dashboard-main_logo">
                        {sidebarCollapsed ? 'AP' : 'Ace7 Panel'}
                    </div>
                    <button 
                        className="dashboard-main_collapse-btn"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <FontAwesomeIcon icon={sidebarCollapsed ? faChevronRight : faChevronLeft} />
                    </button>
                </div>
                
                <div className="dashboard-main_user-info">
                    <div className="dashboard-main_user-avatar">
                        {userInfo.username?.charAt(0).toUpperCase()}
                    </div>
                    {!sidebarCollapsed && (
                        <div className="dashboard-main_user-details">
                            <p className="dashboard-main_username">{userInfo.username}</p>
                            <p className="dashboard-main_user-role">{userInfo.role}</p>
                        </div>
                    )}
                </div>

                <nav className="dashboard-main_sidebar-menu">
                    {renderTabs()}
                </nav>

                <div className="dashboard-main_sidebar-footer">
                    <button 
                        className="dashboard-main_menu-item"
                        onClick={handleLogout}
                        aria-label="Logout"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className="dashboard-main_menu-icon" />
                        {!sidebarCollapsed && <span className="dashboard-main_menu-label">Logout</span>}
                    </button>
                </div>
            </div>

            <div className="dashboard-main_main-content">
                <header className="dashboard-main_top-nav">
                    <div className="dashboard-main_search-container">
                        <FontAwesomeIcon icon={faSearch} className="dashboard-main_search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search dashboard..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="dashboard-main_search-input"
                        />
                    </div>

                    <div className="dashboard-main_nav-controls">
                        <button 
                            className={`dashboard-main_nav-btn ${showNotifications ? 'active' : ''}`}
                            onClick={toggleNotifications}
                            aria-label={showNotifications ? 'Notifications on' : 'Notifications off'}
                        >
                            <FontAwesomeIcon icon={faBell} />
                            {showNotifications && <span className="dashboard-main_active-dot"></span>}
                        </button>
                        
                        <div className="dashboard-main_nav-dropdown">
                            <button 
                                className={`dashboard-main_nav-btn ${showMessages ? 'active' : ''}`}
                                onClick={() => {
                                    setShowMessages(!showMessages);
                                    setShowSettings(false);
                                }}
                                aria-label="Messages"
                            >
                                <FontAwesomeIcon icon={faComments} />
                                {showMessages && <span className="dashboard-main_active-dot"></span>}
                            </button>
                            {showMessages && (
                                <div className="dashboard-main_dropdown-content">
                                    <Messages />
                                </div>
                            )}
                        </div>
                        
                        <div className="dashboard-main_nav-dropdown">
                            <button 
                                className={`dashboard-main_nav-btn ${showSettings ? 'active' : ''}`}
                                onClick={() => {
                                    setShowSettings(!showSettings);
                                    setShowMessages(false);
                                }}
                                aria-label="Settings"
                            >
                                <FontAwesomeIcon icon={faCog} />
                                {showSettings && <span className="dashboard-main_active-dot"></span>}
                            </button>
                            {showSettings && (
                                <Settings theme={theme} toggleTheme={toggleTheme}/>
                            )}
                        </div>
                    </div>
                </header>

                <main className="dashboard-main_content-area">
                    {renderActiveTab()}
                </main>
            </div>
        </div>
    );
}

export default Dashboard;