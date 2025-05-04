import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/notification.css';

export default function notification(message, type = 'info') {
    const containerId = 'notification-container';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    const notif = document.createElement('div');
    container.appendChild(notif);
    const root = ReactDOM.createRoot(notif);

    const close = () => {
        root.unmount();
        notif.remove();
    };

    const Notification = () => {
        useEffect(() => {
            const timer = setTimeout(close, 4000); // auto-close after 4 seconds
            return () => clearTimeout(timer);
        }, []);

        return (
            <div className={`notification ${type}`}>
                <span>{message}</span>
                <button onClick={close}>×</button>
            </div>
        );
    };

    root.render(<Notification />);
}
