import React from 'react';
import './styles/spinner.css';  // Assuming you have your CSS in a separate file

const Spinner = ({ item }) => (
  <div className="loading-overlay">
    <div className="loading-spinner"></div>
    <p>Loading your {item}...</p>
  </div>
);

export default Spinner;