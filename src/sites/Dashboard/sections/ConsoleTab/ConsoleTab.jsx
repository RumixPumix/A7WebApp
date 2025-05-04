import React from 'react';
import './consoleStyle.css'; // Assuming you have a CSS file for styling

function ConsoleTab() {
  return (
    <div className="console-container">
      <div className="console-header">
        <div className="console-title">
          <svg className="console-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5A2,2 0 0,1 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z" />
          </svg>
          <h2>Console</h2>
        </div>
        <div className="console-actions">
          <button className="console-btn clear-btn">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
            </svg>
            Clear
          </button>
          <button className="console-btn">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,10.5A1.5,1.5 0 0,0 10.5,12A1.5,1.5 0 0,0 12,13.5A1.5,1.5 0 0,0 13.5,12A1.5,1.5 0 0,0 12,10.5M7.5,10.5A1.5,1.5 0 0,0 6,12A1.5,1.5 0 0,0 7.5,13.5A1.5,1.5 0 0,0 9,12A1.5,1.5 0 0,0 7.5,10.5M16.5,10.5A1.5,1.5 0 0,0 15,12A1.5,1.5 0 0,0 16.5,13.5A1.5,1.5 0 0,0 18,12A1.5,1.5 0 0,0 16.5,10.5Z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="console-content">
        <div className="console-line">
          <span className="console-prompt">&gt;</span>
          <span className="console-text">Welcome to the developer console</span>
        </div>
        <div className="console-line info">
          <span className="console-prompt">&gt;</span>
          <span className="console-text">System info loaded</span>
        </div>
        <div className="console-line warning">
          <span className="console-prompt">!</span>
          <span className="console-text">Warning: Experimental feature enabled</span>
        </div>
        <div className="console-line error">
          <span className="console-prompt">×</span>
          <span className="console-text">Error: Connection timeout</span>
        </div>
        <div className="console-line">
          <span className="console-prompt">&gt;</span>
          <span className="console-text">Ready for input</span>
        </div>
      </div>
      <div className="console-input">
        <span className="console-prompt">&gt;</span>
        <input type="text" placeholder="Type commands here..." />
      </div>
    </div>
  );
}

export default ConsoleTab;