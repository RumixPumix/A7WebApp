import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import './serverConsoleStyle.css';

const ServerConsole = ({ server }) => {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const consoleEndRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000/servers', {
      transports: ['websocket'],
      reconnection: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('join_server', { server_id: server.id });
    });

    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect_error', () => setConnectionStatus('error'));
    socket.on('server_output', (data) => {
      if (data.server_id === server.id) {
        setLogs(prev => [...prev.slice(-500), data.output]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [server.id]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSendCommand = (e) => {
    e.preventDefault();
    if (command.trim() && connectionStatus === 'connected') {
      socketRef.current.emit('server_command', {
        server_id: server.id,
        command: command
      });
      setCommand('');
    }
  };

  return (
    <div className="server-console-modal">
      <div className="server-modal-header">
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
            disabled={connectionStatus !== 'connected'}
          />
        </div>
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={connectionStatus !== 'connected' || !command.trim()}
          >
            Send Command
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServerConsole;