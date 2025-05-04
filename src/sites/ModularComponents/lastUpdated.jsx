import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './styles/lastUpdated.css';

function LastUpdated({ lastUpdated, prefix = 'Last updated:', className = '' }) {
  const [displayText, setDisplayText] = useState('');

  const updateDisplay = useCallback(() => {
    if (!lastUpdated) return;

    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    let text = '';

    if (seconds <= 5) {
      text = 'Just now';
    } else if (seconds < 60) {
      text = `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    } else if (seconds < 90) {
      text = 'A minute ago';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      text = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      text = 'Over an hour ago';
    }

    setDisplayText(text);
  }, [lastUpdated]);

  useEffect(() => {
    if (!lastUpdated) return;

    updateDisplay(); // Run immediately
    const interval = setInterval(updateDisplay, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, updateDisplay]);

  if (!lastUpdated) return null;

  return (
    <p className={`last-updated-timer ${className}`}>
      {prefix} {displayText}
    </p>
  );
}

LastUpdated.propTypes = {
  lastUpdated: PropTypes.number,
  prefix: PropTypes.string,
  className: PropTypes.string,
};

export default LastUpdated;