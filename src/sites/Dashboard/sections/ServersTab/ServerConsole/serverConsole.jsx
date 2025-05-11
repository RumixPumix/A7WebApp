import React, { useEffect, useState, useRef, useCallback } from 'react';
import './serverConsoleStyle.css';
import sendCommand from './ServerConsoleAPI/sendCommand';
import getLog from './ServerConsoleAPI/getLog';

const ServerConsole = ({ server, onBack }) => {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const consoleEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);


  // Function to fetch logs from server
  const fetchLogs = useCallback(async () => {
    try {
      const logs = await getLog(server.id);
      if (logs) {
        setLogs(logs);
        setConnectionStatus('connected');
      }
      else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Error fetching logs:', error);
    }
  }, [server.id]);

  // Function to send command to server
  const handleSendCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || connectionStatus !== 'connected') return;

    try {
      setIsLoading(true);
      const result = await sendCommand(command, server.id);
      if (result) {
        setCommandHistory(prev => [...prev, command].slice(-50)); // Keep last 50 commands
        setHistoryIndex(-1);
        await fetchLogs();
      } else {
        setConnectionStatus('error');
      }
      setCommand('');
    } catch (error) {
      console.error('Error sending command:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
  if (connectionStatus === 'disconnected') {
    const timeout = setTimeout(() => {
      fetchLogs();
    }, 5000); // Try to reconnect every 5 seconds if disconnected
    return () => clearTimeout(timeout);
  }
}, [connectionStatus, fetchLogs]);

  // Set up polling for logs
useEffect(() => {
  let isMounted = true;

  const safeFetchLogs = async () => {
    try {
      const logs = await getLog(server.id);
      if (isMounted) {
        if (logs) {
          setLogs(logs);
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      }
    } catch (error) {
      if (isMounted) {
        setConnectionStatus('error');
        console.error('Error fetching logs:', error);
      }
    }
  };

  safeFetchLogs();
  pollingIntervalRef.current = setInterval(safeFetchLogs, 2000);

  return () => {
    isMounted = false;
    clearInterval(pollingIntervalRef.current);
  };
}, [server]);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="server-console-modal">
      <div className="server-modal-header">
        <button className="back-button" onClick={onBack}>
            ← Back to servers
        </button>
        <h3>Server Console: {server.name}</h3>
        <div className={`server-status ${connectionStatus}`}>
          <span className="status-indicator"></span>
          {connectionStatus.toUpperCase()}
        </div>
      </div>

      <div className="console-output">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="console-line">{log}</div>
          ))
        ) : (
          <div className="empty-state">
            {connectionStatus === 'connected' 
              ? "Waiting for server output..." 
              : "Not connected to server"}
          </div>
        )}
        <div ref={consoleEndRef} />
      </div>

      <form onSubmit={handleSendCommand} className="server-modal-form">
        <div className="form-group">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={connectionStatus === 'connected' 
              ? "Enter server command..." 
              : "Connect to server first"}
            disabled={connectionStatus !== 'connected' || isLoading}
            onKeyDown={(e) => {
              // Arrow up/down for command history
              if (e.key === 'ArrowUp' && commandHistory.length > 0) {
                e.preventDefault();
                const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
                setHistoryIndex(newIndex);
                setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const newIndex = Math.max(historyIndex - 1, -1);
                setHistoryIndex(newIndex);
                setCommand(newIndex === -1 ? '' : commandHistory[commandHistory.length - 1 - newIndex]);
              }
            }}
          />
        </div>
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={connectionStatus !== 'connected' || !command.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Command'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServerConsole;