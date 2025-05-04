import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/popup.css';

export default function popup(title, message, options = {}) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const close = () => {
        container.classList.add('popup-exit');
        setTimeout(() => {
            root.unmount();
            container.remove();
        }, 300);
    };

    const Popup = () => (
        <div className="modern-popup">
            <div className="popup-overlay" onClick={options.disableOverlayClick ? undefined : close} />
            <div className="popup-content">
                {options.icon && <div className="popup-icon">{options.icon}</div>}
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="popup-actions">
                    {options.secondaryAction && (
                        <button className="secondary-btn" onClick={options.secondaryAction.handler}>
                            {options.secondaryAction.text}
                        </button>
                    )}
                    <button className="primary-btn" onClick={close}>
                        {options.primaryActionText || 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );

    root.render(<Popup />);
}