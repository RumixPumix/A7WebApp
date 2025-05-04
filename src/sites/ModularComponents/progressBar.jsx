// src/ModularComponents/ProgressBar.jsx
import React from 'react';
import './styles/progressBar.css'; // Adjust the path as necessary

const ProgressBar = ({ value, label }) => {
  return (
    <div className="progress-container">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${value}%` }}
        >
          <span className="progress-text">{value}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;