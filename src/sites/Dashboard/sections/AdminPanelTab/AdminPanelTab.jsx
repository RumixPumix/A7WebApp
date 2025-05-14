import { useState, useEffect } from 'react';
import './adminPanelStyle.css'; // New CSS for the tab navigation
import UsersSection from './AdminPanelSections/usersSection.jsx';
import TokensSection from './AdminPanelSections/tokensSection.jsx';
import RolesSection from './AdminPanelSections/rolesSection.jsx';
import PermissionsSection from './AdminPanelSections/permissionsSection.jsx';

//For sections of admin panel
import './adminPanelDefault.css'

function AdminPanelTab({ userInfo, searchTerm = '' }) {
  const [activeTab, setActiveTab] = useState(null);

  const tabs = [
    { id: 'users', label: 'Users', component: UsersSection },
    { id: 'tokens', label: 'Tokens', component: TokensSection },
    { id: 'roles', label: 'Roles', component: RolesSection },
    { id: 'permissions', label: 'Permissions', component: PermissionsSection },
  ];

  const handleBack = () => {
    setActiveTab(null);
  };

  if (activeTab) {
    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;
    return (
      <div className="admin-panel-section">
        <button className="back-button" onClick={handleBack}>
          &larr; Back to Admin Panel
        </button>
        <ActiveComponent 
          userInfo={userInfo} 
          searchTerm={searchTerm} 
          setActiveTab={setActiveTab} 
        />
      </div>
    );
  }

  return (
    <div className="admin-panel-tab">
      <h2 className="admin-panel-title">Admin Panel</h2>
      <div className="tab-grid">
        {tabs.map((tab) => (
          <div 
            key={tab.id} 
            className="tab-card"
            onClick={() => setActiveTab(tab.id)}
          >
            <h3>{tab.label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanelTab;