import React from 'react';
import './analyticsStyle.css'; // Import your CSS file for styling

function AnalyticsTab() {
    // Sample data - replace with your actual data
    const stats = [
      { label: "Total Visitors", value: "12,489", change: "+12%", trend: "up" },
      { label: "Avg. Session", value: "2m 46s", change: "+3%", trend: "up" },
      { label: "Bounce Rate", value: "34%", change: "-8%", trend: "down" },
      { label: "Conversions", value: "1,284", change: "+24%", trend: "up" }
    ];
  
    const trafficSources = [
      { name: "Direct", value: 45, color: "#6366F1" },
      { name: "Social", value: 25, color: "#EC4899" },
      { name: "Referral", value: 20, color: "#10B981" },
      { name: "Organic", value: 10, color: "#F59E0B" }
    ];
  
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <div className="header-left">
            <h2>
              <svg className="analytics-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3,22V8H7V22H3M10,22V2H14V22H10M17,22V14H21V22H17Z" />
              </svg>
              Analytics Dashboard
            </h2>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="header-right">
            <select className="time-select">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>This year</option>
            </select>
            <button className="export-btn">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
              </svg>
              Export
            </button>
          </div>
        </div>
  
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div className="stat-card" key={index}>
              <div className="stat-info">
                <h3>{stat.label}</h3>
                <p className="stat-value">{stat.value}</p>
              </div>
              <div className={`stat-change ${stat.trend}`}>
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d={stat.trend === "up" ? "M7,15L12,10L17,15H7Z" : "M7,10L12,15L17,10H7Z"} />
                </svg>
                <span>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>
  
        <div className="chart-row">
          <div className="main-chart">
            <div className="chart-header">
              <h3>Visitor Trends</h3>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color current"></span>
                  <span>Current Period</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color previous"></span>
                  <span>Previous Period</span>
                </div>
              </div>
            </div>
            <div className="chart-placeholder">
              {/* Replace with your actual chart component */}
              <div className="mock-chart">
                <div className="line-chart"></div>
              </div>
            </div>
          </div>
  
          <div className="pie-chart">
            <h3>Traffic Sources</h3>
            <div className="chart-placeholder">
              {/* Replace with your actual pie chart component */}
              <div className="mock-pie">
                {trafficSources.map((source, i) => (
                  <div 
                    key={i} 
                    className="pie-segment" 
                    style={{
                      transform: `rotate(${i * 90}deg)`,
                      backgroundColor: source.color,
                      width: `${source.value}%`
                    }}
                  ></div>
                ))}
              </div>
              <div className="pie-legend">
                {trafficSources.map((source, i) => (
                  <div key={i} className="pie-legend-item">
                    <span className="legend-dot" style={{backgroundColor: source.color}}></span>
                    <span>{source.name} - {source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
  
        <div className="bottom-row">
          <div className="device-chart">
            <h3>Devices</h3>
            <div className="chart-placeholder">
              {/* Replace with your actual bar chart component */}
              <div className="mock-bars">
                <div className="bar-container">
                  <div className="bar-label">Mobile</div>
                  <div className="bar" style={{width: "65%", backgroundColor: "#6366F1"}}></div>
                  <div className="bar-value">65%</div>
                </div>
                <div className="bar-container">
                  <div className="bar-label">Desktop</div>
                  <div className="bar" style={{width: "30%", backgroundColor: "#10B981"}}></div>
                  <div className="bar-value">30%</div>
                </div>
                <div className="bar-container">
                  <div className="bar-label">Tablet</div>
                  <div className="bar" style={{width: "5%", backgroundColor: "#F59E0B"}}></div>
                  <div className="bar-value">5%</div>
                </div>
              </div>
            </div>
          </div>
  
          <div className="recent-activity">
            <div className="activity-header">
              <h3>Recent Activity</h3>
              <button className="view-all">View All</button>
            </div>
            <div className="activity-list">
              {[1, 2, 3, 4].map((item) => (
                <div className="activity-item" key={item}>
                  <div className="activity-icon">
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                    </svg>
                  </div>
                  <div className="activity-details">
                    <p className="activity-title">New user registration</p>
                    <p className="activity-time">2 hours ago</p>
                  </div>
                  <div className="activity-badge">New</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  export default AnalyticsTab;