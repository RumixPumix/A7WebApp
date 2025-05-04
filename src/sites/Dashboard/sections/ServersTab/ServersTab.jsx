// src/sections/ServersTab.js
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPowerOff, 
  faRedo, 
  faTimes, 
  faTrash, 
  faCog, 
  faInfoCircle, 
  faServer 
} from '@fortawesome/free-solid-svg-icons';
import fetchServers from './ServersAPI/fetchServers';
import postServer from './ServersAPI/postServer';
import serverAction from './ServersAPI/serverAction';
import deleteServer from './ServersAPI/deleteServer';
import Spinner from '../../../ModularComponents/spinner.jsx';
import LastUpdated from '../../../ModularComponents/lastUpdated.jsx';
import ServerConsole from './ServerConsole/serverConsole.jsx'
import './serversStyle.css';

function ServersTab({ isAdmin, currentUserId }) {
  const [loading, setLoading] = useState({ servers: true });
  const [servers, setServers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentServer, setCurrentServer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverConsole, setServerConsole] = useState(null)
  const [minecraftVersions, setMinecraftVersions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    version: 'latest',
    seed: '',
    is_online_mode: true,
    ram_limit_mb: 1024,
    description: ''
  });

  const filteredServers = servers.filter(server => 
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (server.description && server.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  async function loadServers() {
    try {
      const servers = await fetchServers();
      setServers(servers["servers"] || []);
      setMinecraftVersions(servers["versions"] || []);
      setLastUpdated(Date.now());
    } catch (error) {

    } finally {
      setLoading({ servers: false });
    }
  }

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
        loadServers();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleServerAction = async (serverId, action) => {
    setLoading({ servers: true });
    await serverAction(serverId, action);
    await loadServers();
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      version: 'latest',
      seed: '',
      is_online_mode: true,
      ram_limit_mb: 1024,
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (server) => {
    setModalMode('edit');
    setCurrentServer(server);
    setFormData({
      name: server.name,
      version: server.version,
      seed: server.seed || '',
      is_online_mode: server.is_online_mode !== false,
      ram_limit_mb: server.ram_limit_mb || 1024,
      description: server.description || ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Only allow letters (a-zA-Z), numbers (0-9), and hyphens (-)
      const validatedValue = value.replace(/[^a-zA-Z0-9-]/g, '');
      
      setFormData(prev => ({
        ...prev,
        [name]: validatedValue
      }));
    }
  };

  const handleRamChange = (e) => {
    setFormData(prev => ({
      ...prev,
      ram_limit_mb: parseInt(e.target.value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Final validation check before submission
    const isValid = /^[a-zA-Z0-9-]+$/.test(formData.name);
    
    if (!isValid) {
      alert('Server name can only contain letters, numbers, and hyphens.');
      return;
    }
    try {
      if (modalMode === 'edit') {
        await postServer({ ...formData, id: currentServer.id });
      } else {
        await postServer(formData);
      }
      setShowModal(false);
      loadServers();
    } catch (error) {

    }
  };

  const handleDeleteServer = async (serverId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this server?")) {
      setLoading({ servers: true });
      await deleteServer(serverId);
      loadServers();
    }
  };

  if (serverConsole) {
    return <ServerConsole server={serverConsole} />
  }

  if (loading.servers) {
    return <Spinner item="Servers" />;
  }

  return (
    <div className="servers-container">
      <div className="servers-header">
        <div className="header-left">
          <h2>
            <FontAwesomeIcon icon={faServer} className="header-icon" />
            Server Management
          </h2>
          <LastUpdated timestamp={lastUpdated} />
        </div>
        
        <div className="header-right">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search servers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              <FontAwesomeIcon icon={faPlay} /> Deploy New Server
            </button>
          )}
        </div>
      </div>

      {filteredServers.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faInfoCircle} size="2x" />
          <p>No servers found</p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              Deploy your first server
            </button>
          )}
        </div>
      ) : (
        <div className="servers-grid">
          {filteredServers.map(server => (
            <div 
              key={server.id} 
              className={`server-card ${server.status}`}
              onClick={() => (isAdmin || server.owner_id === currentUserId) && setServerConsole(server)}
            >
              <div className="card-header">
                <div className="server-status">
                  <div className="status-indicator"></div>
                  <span>{server.status.toUpperCase()}</span>
                </div>
                {(isAdmin || server.owner_id === currentUserId) && (
                  <button 
                    className="btn-icon danger"
                    onClick={(e) => handleDeleteServer(server.id, e)}
                    title="Delete Server"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>

              <div className="card-body">
                <h3>{server.name}</h3>
                {server.description && (
                  <p className="server-description">{server.description}</p>
                )}
                
                <div className="server-meta">
                  <div className="meta-item">
                    <span className="meta-label">Version</span>
                    <span className="meta-value">{server.version}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Port</span>
                    <span className="meta-value">{server.port}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">RAM</span>
                    <span className="meta-value">{server.ram_limit_mb}MB</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Online Mode</span>
                    <span className="meta-value">
                      {server.is_online_mode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {server.seed && (
                    <>
                      <div className="meta-item">
                        <span className="meta-label">Seed</span>
                        <span className="meta-value">{server.seed}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">IP Address</span>
                        <span className="meta-value">ace7esports.com:{server.port}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <div className="server-owner">
                  <span>Owner: {server.owner_username || 'Unknown'}</span>
                </div>
                
                {(isAdmin || server.owner_id === currentUserId) && (
                  <div className="server-actions">
                    <button 
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServerAction(server.id, 'start');
                      }}
                      disabled={server.status === 'online' || server.status === 'starting'}
                      title="Start Server"
                    >
                      <FontAwesomeIcon icon={faPlay} />
                    </button>
                  
                    <button 
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServerAction(server.id, 'stop');
                      }}
                      disabled={server.status === 'offline' || server.status === 'stopping'}
                      title="Stop Server"
                    >
                      <FontAwesomeIcon icon={faPowerOff} />
                    </button>
                  
                    <button 
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServerAction(server.id, 'restart');
                      }}
                      disabled={server.status === 'offline' || server.status === 'starting' || server.status === 'stopping'}
                      title="Restart Server"
                    >
                      <FontAwesomeIcon icon={faRedo} />
                    </button>
                  
                    <button 
                      className="btn-icon"
                      onClick={() => (isAdmin || server.owner_id === currentUserId) && openEditModal(server)}
                      disabled={server.status === 'starting' || server.status === 'stopping'}
                      title="Configure Server"
                    >
                      <FontAwesomeIcon icon={faCog} />
                    </button>
                  </div>

                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="server-modal-overlay">
          <div className="server-modal">
            <div className="server-modal-header">
              <h3>
                {modalMode === 'create' ? 'Deploy New Server' : 'Update Server'}
              </h3>
              <button 
                className="btn-icon" 
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="server-modal-form">
              <div className="form-group">
                <label htmlFor="server-name">Server Name</label>
                <input
                  id="server-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  maxLength={15}
                  required
                  pattern="[a-zA-Z0-9-]+"
                  title="Only letters, numbers, and hyphens are allowed"
                  placeholder="MinecraftServer"
                />
                <div className="form-hint">
                  {formData.name.length}/15 characters
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="server-description">Description (Optional)</label>
                <textarea
                  id="server-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  maxLength={140}
                  placeholder="Short description of your server"
                />
                <div className="form-hint">
                  {formData.description.length}/140 characters
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="server-version">Minecraft Version</label>
                <select
                  id="server-version"
                  name="version" 
                  value={formData.version}
                  onChange={handleInputChange}
                  required
                >
                  {minecraftVersions.map(version => (
                    <option key={version} value={version}>
                      {version === 'latest' ? 'Latest Version' : version}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="server-seed">World Seed (Optional)</label>
                <input
                  id="server-seed"
                  type="text"
                  name="seed"
                  value={formData.seed}
                  onChange={handleInputChange}
                  placeholder="Leave blank for random"
                />
              </div>

              <div className="form-group">
                <label>RAM Allocation</label>
                <div className="ram-slider-container">
                  <input
                    type="range"
                    name="ram_limit_mb"
                    min="512"
                    max="4096"
                    step="256"
                    value={formData.ram_limit_mb}
                    onChange={handleRamChange}
                    className="ram-slider"
                  />
                  <div className="ram-value">{formData.ram_limit_mb}MB</div>
                </div>
                <div className="ram-presets">
                  {[1024, 2048, 3072, 4096].map(ram => (
                    <button 
                      key={ram}
                      type="button" 
                      onClick={() => setFormData({...formData, ram_limit_mb: ram})}
                    >
                      {ram >= 1024 ? `${ram/1024}GB` : `${ram}MB`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  name="is_online_mode"
                  id="onlineMode"
                  checked={formData.is_online_mode}
                  onChange={handleInputChange}
                />
                <label htmlFor="onlineMode">Enable Online Mode (Minecraft authentication)</label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'create' ? 'Deploy Server' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServersTab;