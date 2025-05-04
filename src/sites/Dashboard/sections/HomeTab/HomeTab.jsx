import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faServer, 
  faUsers, 
  faFileAlt, 
  faComments,
  faChartLine,
  faClock,
  faBolt,
  faShieldAlt,
  faNetworkWired,
  faCloudUploadAlt,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';
import './homeStyle.css';
import Spinner from '../../../ModularComponents/spinner.jsx';
import fetchHomeData from './HomeAPI/fetchHome.js';
import liveUpdate from './HomeAPI/liveUpdate.js'; // Import the live update function

const HomeTab = (isAdmin) => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('No quote available');
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [liveData, setLiveData] = useState(null);


  async function fetchLiveData() {
    try {
      const response = await liveUpdate();
      if (!response) {
        setLiveData({});
        return;
      }
      setLiveData(response);
    } catch (error) {

    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveData();
    }, 5000); // fetch every 1 second
  
    return () => clearInterval(interval); // cleanup when component unmounts
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(
      hour < 12 ? 'morning' : 
      hour < 18 ? 'afternoon' : 'evening'
    );

    const fetchData = async () => {
      try {
        let data = await fetchHomeData();
        if (!data) {
          data = {};
        }
        setDashboardData(data);
        setMotivationalQuote(data.motivationalQuote || 'No quote available');
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
    fetchLiveData(); // Fetch live data on component mount

  }, []);

  // Helper function to safely access nested properties
  const getSafe = (fn, defaultValue = 'None') => {
    try {
      return fn() || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  if (isLoading) {
    return <Spinner item="dashboard" />;
  }

  if (error) {
    return <div className="error-message">Error loading dashboard: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="error-message">No data available</div>;
  }

  return (
    <div className="home-tab">
      <header className="home-header">
        <div className="header-content">
        <h1>
          Good {timeOfDay}, {isAdmin.isAdmin ? 'Administrator' : 'User'}
        </h1>
          <p className="welcome-message">
            {motivationalQuote}
          </p>
          <div className="health-indicator">
            <span>System Health:</span>
            <div className="health-bar">
              <div 
                className="health-progress" 
                style={{ width: `${getSafe(() => dashboardData.systemHealth, 0)}%` }}
                data-health={getSafe(() => dashboardData.systemHealth) > 70 ? 'good' : getSafe(() => dashboardData.systemHealth) > 40 ? 'fair' : 'poor'}
              ></div>
            </div>
            <span className="health-value">{getSafe(() => dashboardData.systemHealth, 0)}%</span>
          </div>
        </div>
        <div className="quick-stats">
          <div className="quick-stat">
            <FontAwesomeIcon icon={faBolt} />
            <span>{getSafe(() => dashboardData.serverStats.online, 0)} Servers Active</span>
          </div>
          <div className="quick-stat">
            <FontAwesomeIcon icon={faUsers} />
            <span>{getSafe(() => dashboardData.userStats.activeToday, 0)} Active Users</span>
          </div>
          <div className="quick-stat">
            <FontAwesomeIcon icon={faShieldAlt} />
            <span>Security Level: {getSafe(() => dashboardData.serverStats.securityAlerts, 0) > 0 ? 'Alert' : 'Normal'}</span>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        {/* Server Status Card */}
        <div className="hometab-stat-card server-status-home">
          <div className="card-header">
            <FontAwesomeIcon icon={faServer} className="card-icon" />
            <h3>Server Infrastructure</h3>
            <span className="status-badge online">Live</span>
          </div>
          <div className="card-content">
            <div className="server-metrics">
              <div className="metric">
                <span>Operational</span>
                <span className="metric-value">
                  {getSafe(() => `${dashboardData.serverStats.online}/${dashboardData.serverStats.total}`, '0/0')}
                </span>
              </div>
              <div className="metric">
                <span>Uptime</span>
                <span className="metric-value">
                  {getSafe(() => dashboardData.serverStats.uptime, 0)}%
                </span>
              </div>
            </div>
            <div className="server-visual">
              {getSafe(() => dashboardData.serverNodes, []).map((node, index) => (
                <div key={index} className="server-node">
                  <div className={`node-icon ${getSafe(() => node.type, '')}`}></div>
                  <span>{getSafe(() => node.name, 'Unknown Server')}</span>
                  <span className={`node-status ${getSafe(() => node.status, 'offline')}`}>
                    {getSafe(() => node.status, 'Offline')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Management Card */}
        <div className="hometab-stat-card user-management">
          <div className="card-header">
            <FontAwesomeIcon icon={faUsers} className="card-icon" />
            <h3>User Management</h3>
            <span className="status-badge">
              {getSafe(() => dashboardData.userStats.newUsers, 0)} New
            </span>
          </div>
          <div className="card-content">
            <div className="user-metrics">
              <div className="metric">
                <span>Total Users</span>
                <span className="metric-value large">
                  {getSafe(() => dashboardData.userStats.totalUsers, 0)}
                </span>
              </div>
              <div className="metric">
                <span>Active Today</span>
                <span className="metric-value large">
                  {getSafe(() => dashboardData.userStats.activeToday, 0)}
                </span>
              </div>
            </div>
            <div className="user-roles">
              <div className="role">
                <FontAwesomeIcon icon={faUserShield} />
                <span>Administrators: </span>
                <span>{getSafe(() => dashboardData.userStats.adminUsers, 0)}</span>
              </div>
              <div className="role">
                <FontAwesomeIcon icon={faUsers} />
                <span>Standard Users: </span>
                <span>
                  {getSafe(() => dashboardData.userStats.totalUsers - dashboardData.userStats.adminUsers, 0)}
                </span>
              </div>
            </div>
            <div className="user-activity-chart">
              {getSafe(() => dashboardData.userActivityChart, []).map((value, index) => (
                <div 
                  key={index} 
                  className="chart-bar" 
                  style={{ height: `${getSafe(() => value, 0)}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Storage Analytics Card */}
        <div className="hometab-stat-card storage-analytics">
          <div className="card-header">
            <FontAwesomeIcon icon={faFileAlt} className="card-icon" />
            <h3>Storage Analytics</h3>
            <span className="status-badge warning">
              {getSafe(() => dashboardData.serverStats.storagePercent, 0)}% Full
            </span>
          </div>
          <div className="card-content">
            <div className="storage-visual">
              
              <div className="storage-details">
                <div className="storage-metric">
                  <span>Used: </span>
                  <span className="metric-value">
                    {getSafe(() => dashboardData.serverStats.storageUsed, 0)} GB
                  </span>
                </div>
                <div className="storage-metric">
                  <span>Available: </span>
                  <span className="metric-value">
                  {(
                    getSafe(() => dashboardData.serverStats.storageTotal - dashboardData.serverStats.storageUsed, 0)).toFixed(2)} GB
                  </span>
                </div>
                <div className="storage-metric">
                  <span>Total: </span>
                  <span className="metric-value">
                    {getSafe(() => dashboardData.serverStats.storageTotal, 0)} GB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="hometab-stat-card activity-timeline">
          <div className="card-header">
            <FontAwesomeIcon icon={faClock} className="card-icon" />
            <h3>Activity Timeline</h3>
            <span className="status-badge">
              {getSafe(() => dashboardData.recentActivity.length, 0)} Events
            </span>
          </div>
          <div className="card-content">
            <div className="timeline">
              {getSafe(() => dashboardData.recentActivity, []).map((activity, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-icon">
                    <FontAwesomeIcon icon={getSafe(() => activity.icon, faComments)} />
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-time">
                      {getSafe(() => activity.time, 'Unknown time')}
                    </span>
                    <p className="timeline-text">
                      {getSafe(() => activity.text, 'No activity description')}
                    </p>
                  </div>
                </div>
              ))}
              {getSafe(() => dashboardData.recentActivity.length, 0) === 0 && (
                <div className="no-activity">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="hometab-stat-card performance-metrics">
          <div className="card-header">
            <FontAwesomeIcon icon={faChartLine} className="card-icon" />
            <h3>Performance Metrics</h3>
            <span className="status-badge">Live</span>
          </div>
          <div className="card-content">
            <div className="performance-grid">
              <div className="performance-metric cpu">
                <div className="performance-metric-header">
                  <span className="performance-metric-label">CPU Usage</span>
                  <span className="performance-metric-value">
                    {getSafe(() => liveData.performanceMetrics.cpu, 0)}%
                  </span>
                </div>
                <div className="performance-metric-bar">
                  <div 
                    className="performance-metric-progress" 
                    style={{ '--value': `${Math.min(getSafe(() => liveData.performanceMetrics.cpu, 0), 100)}%` }}
                  />
                </div>
              </div>

              <div className="performance-metric memory">
                <div className="performance-metric-header">
                  <span className="performance-metric-label">Memory Usage</span>
                  <span className="performance-metric-value">
                    {getSafe(() => liveData.performanceMetrics.memory, 0)}%
                  </span>
                </div>
                <div className="performance-metric-bar">
                  <div 
                    className="performance-metric-progress" 
                    style={{ '--value': `${Math.min(getSafe(() => liveData.performanceMetrics.memory, 0), 100)}%` }}
                  />
                </div>
              </div>

              <div className="performance-metric response-time">
                <div className="performance-metric-header">
                  <span className="performance-metric-label">Response Time</span>
                  <span className="performance-metric-value">
                    {getSafe(() => liveData.performanceMetrics.responseTime, 0)}ms
                  </span>
                </div>
                <div className="performance-metric-bar">
                  <div 
                    className="performance-metric-progress" 
                    style={{ '--value': `${Math.min(getSafe(() => liveData.performanceMetrics.responseTime/10, 0), 100)}%` }}
                  />
                </div>
              </div>

              <div className="performance-metric requests">
                <div className="performance-metric-header">
                  <span className="performance-metric-label">Requests</span>
                  <span className="performance-metric-value">
                    {getSafe(() => liveData.performanceMetrics.requests, 0)}/sec
                  </span>
                </div>
                <div className="performance-metric-bar">
                  <div 
                    className="performance-metric-progress" 
                    style={{ '--value': `${Math.min(getSafe(() => liveData.performanceMetrics.requests/2, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="performance-tips-container">
              <h4 className="performance-tips-title">Optimization Tips</h4>
              <ul className="performance-tips-list">
                {getSafe(() => dashboardData.performanceTips, []).length > 0 ? (
                  getSafe(() => dashboardData.performanceTips, []).map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))
                ) : (
                  <li>No optimization tips available</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="hometab-stat-card system-recommendations">
          <div className="card-header">
            <FontAwesomeIcon icon={faShieldAlt} className="card-icon" />
            <h3>System Health</h3>
            <span className="status-badge success">Good</span>
          </div>
          <div className="card-content">
            <div className="health-metrics">
              <div className="health-metric">
                <span>Security</span>
                <div className="health-indicator">
                  <div className="health-bar small">
                    <div 
                      className="health-progress" 
                      style={{ width: `${getSafe(() => dashboardData.systemHealthMetrics.security, 0)}%` }}
                    ></div>
                  </div>
                  <span className="health-value">
                    {getSafe(() => dashboardData.systemHealthMetrics.security, 0)}%
                  </span>
                </div>
              </div>
              <div className="health-metric">
                <span>Performance</span>
                <div className="health-indicator">
                  <div className="health-bar small">
                    <div 
                      className="health-progress" 
                      style={{ width: `${getSafe(() => dashboardData.systemHealthMetrics.performance, 0)}%` }}
                    ></div>
                  </div>
                  <span className="health-value">
                    {getSafe(() => dashboardData.systemHealthMetrics.performance, 0)}%
                  </span>
                </div>
              </div>
              <div className="health-metric">
                <span>Stability</span>
                <div className="health-indicator">
                  <div className="health-bar small">
                    <div 
                      className="health-progress" 
                      style={{ width: `${getSafe(() => dashboardData.systemHealthMetrics.stability, 0)}%` }}
                    ></div>
                  </div>
                  <span className="health-value">
                    {getSafe(() => dashboardData.systemHealthMetrics.stability, 0)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="recommendations">
              <h4>Recommendations</h4>
              {getSafe(() => dashboardData.recommendations, []).length > 0 ? (
                getSafe(() => dashboardData.recommendations, []).map((rec, index) => (
                  <div 
                    key={index} 
                    className={`recommendation-item ${getSafe(() => rec.priority, 'info')}`}
                  >
                    <FontAwesomeIcon icon={getSafe(() => rec.icon, faShieldAlt)} />
                    <span>{getSafe(() => rec.text, 'No recommendation text')}</span>
                  </div>
                ))
              ) : (
                <div className="recommendation-item info">
                  <FontAwesomeIcon icon={faShieldAlt} />
                  <span>No recommendations at this time</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTab;