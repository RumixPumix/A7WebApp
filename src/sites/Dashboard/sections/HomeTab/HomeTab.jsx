import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faServer,
  faUsers,
  faFileAlt,
  faBan,
  faChartLine,
  faBolt,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';
import './homeStyle.css';
import Spinner from '../../../ModularComponents/spinner.jsx';
import fetchHomeData from './HomeAPI/fetchHome.js';
import liveUpdate from './HomeAPI/liveUpdate.js';

const HomeTab = ({ userInfo }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('No quote available');
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [liveData, setLiveData] = useState({});

  const getSafe = (fn, defaultValue = 'None') => {
    try {
      const result = fn();
      return result !== undefined && result !== null ? result : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const fetchData = async () => {
    try {
      const data = await fetchHomeData();
      setDashboardData(data || {});
      setMotivationalQuote(data?.misc?.motivationalQuote || 'No quote available');
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const fetchLiveData = async () => {
    try {
      const response = await liveUpdate();
      setLiveData(response || {});
    } catch {
      setLiveData({});
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening');
    fetchData();
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  const health = useMemo(() => getSafe(() => dashboardData.misc.systemHealth, 0), [dashboardData]);
  const healthStatus = useMemo(() => (health > 70 ? 'good' : health > 40 ? 'fair' : 'poor'), [health]);

  if (isLoading) return <Spinner item="dashboard" />;
  if (error) return <div className="error-message">Error loading dashboard: {error}</div>;
  if (!dashboardData) return <div className="error-message">No data available</div>;

  const userStats = dashboardData.userStats || {};
  const storage = dashboardData.storage?.aggregated || {};
  const serverNodes = dashboardData.server_nodes || [];
  const performanceMetrics = liveData.performanceMetrics || {};

  return (
    <div className="home-tab">
      <header className="home-header">
        <div className="header-content">
          <h1>Good {timeOfDay}, {userInfo.role}</h1>
          <p className="welcome-message">{motivationalQuote}</p>
          <div className="health-indicator">
            <span>System Health:</span>
            <div className="health-bar">
              <div
                className="health-progress"
                style={{ width: `${health}%` }}
                data-health={healthStatus}
              ></div>
            </div>
            <span className="health-value">{health}%</span>
          </div>
        </div>
        <div className="quick-stats">
          <div className="quick-stat">
            <FontAwesomeIcon icon={faBolt} />
            <span>{getSafe(() => dashboardData.online, 0)} Servers Active</span>
          </div>
          <div className="quick-stat">
            <FontAwesomeIcon icon={faUsers} />
            <span>{getSafe(() => userStats.activeToday, 0)} Active Users</span>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="hometab-stat-card server-status-home">
          <div className="card-header">
            <FontAwesomeIcon icon={faServer} className="card-icon" aria-hidden="true" />
            <h3 className="card-title">Server Infrastructure</h3>
            <span className="status-badge online" aria-live="polite">Live</span>
          </div>
          
          <div className="card-content">
            <div className="server-metrics">
              <div className="metric" role="status" aria-label="Server operational status">
                <span className="metric-label">Operational</span>
                <span className="metric-value">
                  {`${getSafe(() => dashboardData.online, 0)} of ${getSafe(() => dashboardData.total, 0)}`}
                </span>
                <div className="metric-bar" style={{ 
                  width: `${(getSafe(() => dashboardData.online, 0) / getSafe(() => dashboardData.total, 1)) * 100}%` 
                }}></div>
              </div>
            </div>

            <div className="server-visual" aria-label="Server nodes list">
              {serverNodes.map((node, index) => (
                <div key={`server-node-${index}`} className={`server-node ${getSafe(() => node.status, 'offline')}`}>
                  <div 
                    className="node-icon" 
                    aria-label={`Server status: ${getSafe(() => node.status, 'offline')}`}
                  >
                    <FontAwesomeIcon 
                      icon={getSafe(() => node.status, 'offline') === 'online' ? faServer : faBan} 
                    />
                  </div>
                  
                  <div className="node-info">
                    <div className="node-name">
                      <strong>{getSafe(() => node.name, 'Unknown Server')}</strong>
                      <span className={`status-badge ${getSafe(() => node.status, 'offline')}`}>
                        {getSafe(() => node.status, 'Offline')}
                      </span>
                    </div>
                    
                    <div className="node-details">
                      <div className="node-detail">
                        <span className="detail-label">Owned by:</span>
                        <span className="detail-value">{getSafe(() => node.owner_username, 'System')}</span>
                      </div>
                      <div className="node-detail">
                        <span className="detail-label">IP:</span>
                        <span className="detail-value">
                          www.ace7esports.com:{getSafe(() => node.port, 'Unknown')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hometab-stat-card user-management">
          <div className="card-header">
            <FontAwesomeIcon icon={faUsers} className="card-icon" />
            <h3>User Management</h3>
            <span className="status-badge">{getSafe(() => userStats.newUsers, 0)} New</span>
          </div>
          <div className="card-content">
            <div className="user-metrics">
              <div className="metric">
                <span>Total Users</span>
                <span className="metric-value large">{getSafe(() => userStats.totalUsers, 0)}</span>
              </div>
              <div className="metric">
                <span>Active Today</span>
                <span className="metric-value large">{getSafe(() => userStats.activeToday, 0)}</span>
              </div>
            </div>
            <div className="user-roles">
              <div className="role">
                <FontAwesomeIcon icon={faUserShield} />
                <span>Administrators: </span>
                <span>{getSafe(() => userStats.adminUsers, 0)}</span>
              </div>
              <div className="role">
                <FontAwesomeIcon icon={faUsers} />
                <span>Standard Users: </span>
                <span>
                  {getSafe(() => userStats.totalUsers - userStats.adminUsers, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hometab-stat-card storage-analytics">
          <div className="card-header">
            <FontAwesomeIcon icon={faFileAlt} className="card-icon" />
            <h3>Storage Analytics</h3>
            <span className="status-badge warning">{getSafe(() => storage.storagePercent, 0)}% Full</span>
          </div>
          <div className="card-content">
            <div className="storage-details">
              <div className="storage-metric">
                <span>Used: </span>
                <span className="metric-value">{getSafe(() => storage.storageUsed, 0)} GB</span>
              </div>
              <div className="storage-metric">
                <span>Available: </span>
                <span className="metric-value">
                  {(getSafe(() => storage.storageTotal - storage.storageUsed, 0)).toFixed(2)} GB
                </span>
              </div>
              <div className="storage-metric">
                <span>Total: </span>
                <span className="metric-value">{getSafe(() => storage.storageTotal, 0)} GB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hometab-stat-card performance-metrics">
          <div className="card-header">
            <FontAwesomeIcon icon={faChartLine} className="card-icon" />
            <h3>Performance Metrics</h3>
            <span className="status-badge">Live</span>
          </div>
          <div className="card-content">
            <div className="performance-grid">
              {['cpu', 'memory', 'responseTime'].map((metric) => {
                const value = getSafe(() => performanceMetrics[metric], 0);
                const displayValue = metric === 'responseTime' ? `${value}ms` : `${value}%`;
                const progressValue = metric === 'responseTime' ? value / 10 : value;
                return (
                  <div key={metric} className={`performance-metric ${metric}`}>
                    <div className="performance-metric-header">
                      <span className="performance-metric-label">
                        {metric === 'cpu'
                          ? 'CPU Usage'
                          : metric === 'memory'
                          ? 'Memory Usage'
                          : 'Response Time'}
                      </span>
                      <span className="performance-metric-value">{displayValue}</span>
                    </div>
                    <div className="performance-metric-bar">
                      <div
                        className="performance-metric-progress"
                        style={{ '--value': `${Math.min(progressValue, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
