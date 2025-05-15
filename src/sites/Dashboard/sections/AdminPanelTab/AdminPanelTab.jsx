import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faKey, 
  faUserShield, 
  faShieldAlt,
  faArrowLeft,
  faUserCog
} from '@fortawesome/free-solid-svg-icons';
import UsersSection from './AdminPanelSections/usersSection.jsx';
import TokensSection from './AdminPanelSections/tokensSection.jsx';
import RolesSection from './AdminPanelSections/rolesSection.jsx';
import PermissionsSection from './AdminPanelSections/permissionsSection.jsx';

import './adminPanelDefault.css';
import './adminPanelStyle.css'


const tabs = [
  { 
    id: 'users', 
    label: 'Users', 
    icon: faUsers,
    color: '#4e73df',
    component: UsersSection 
  },
  { 
    id: 'tokens', 
    label: 'Tokens', 
    icon: faKey,
    color: '#1cc88a',
    component: TokensSection 
  },
  { 
    id: 'roles', 
    label: 'Roles', 
    icon: faUserShield,
    color: '#f6c23e',
    component: RolesSection 
  },
  { 
    id: 'permissions', 
    label: 'Permissions', 
    icon: faShieldAlt,
    color: '#e74a3b',
    component: PermissionsSection 
  },
];

function AdminPanelTab({ userInfo, searchTerm = '' }) {
  const [activeTab, setActiveTab] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);

  const handleBack = () => {
    setActiveTab(null);
  };

  if (activeTab) {
    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    
    return (
      <div className="admin-tab-section">
        <button 
          className="admin-tab-back-button" 
          onClick={handleBack}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="admin-tab-back-icon" />
          Back to Dashboard
        </button>
        <div className="admin-tab-section-header">
          <div 
            className="admin-tab-section-icon"
            style={{ backgroundColor: activeTabData.color }}
          >
            <FontAwesomeIcon icon={activeTabData.icon} />
          </div>
          <h2 className="admin-tab-section-title">{activeTabData.label} Management</h2>
        </div>
        <ActiveComponent 
          userInfo={userInfo} 
          searchTerm={searchTerm} 
          setActiveTab={setActiveTab} 
        />
      </div>
    );
  }

  return (
    <div className="admin-tab-container">
      <div className="admin-tab-header">
        <FontAwesomeIcon icon={faUserCog} className="admin-tab-main-icon" />
        <h2 className="admin-tab-title">Admin Dashboard</h2>
        <p className="admin-tab-subtitle">Manage your application settings and users</p>
      </div>
      
      <div className="admin-tab-grid">
        {tabs.map((tab) => (
          <div 
            key={tab.id}
            className={`admin-tab-card ${hoveredTab === tab.id ? 'admin-tab-card-hover' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              '--hover-color': tab.color,
              '--icon-color': tab.color
            }}
          >
            <div className="admin-tab-card-icon">
              <FontAwesomeIcon icon={tab.icon} />
            </div>
            <h3 className="admin-tab-card-title">{tab.label}</h3>
            <div className="admin-tab-card-arrow">
              <FontAwesomeIcon icon={faArrowLeft} rotation={180} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanelTab;