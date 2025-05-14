import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faClock, faTimes, faExclamationTriangle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Spinner from '../../../../ModularComponents/spinner.jsx';
import LastUpdated from '../../../../ModularComponents/lastUpdated.jsx';

import fetchTokens from './AdminPanelAPI/fetchTokens.js';
import generateToken from './AdminPanelAPI/generateToken.js';
import deleteToken from './AdminPanelAPI/deleteToken.js';
import postToken from './AdminPanelAPI/postToken.js';

import './AdminPanelStyles/tokenSection.css'

export default function TokensSection({ userInfo, searchTerm = ''}) {
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [currentToken, setCurrentToken] = useState('');
    const [selectedExpiry, setSelectedExpiry] = useState("1"); // Default to 1 day
    const [showExpiredTokens, setShowExpiredTokens] = useState(false);
    const [tokens, setTokens] = useState([]);

    const filteredTokens = tokens.filter(token =>
        token.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.created_at.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.expires_at?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.used_at?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function loadTokensData(){
        try {
          let tokensData = await fetchTokens();
          if (!tokensData) {
            tokensData = []; // Fallback to empty array if fetch fails
          }
          setTokens(tokensData);
          setLastUpdated(Date.now());
        } finally {
          setLoading(false);
        }
    }

    useEffect(() => {
        loadTokensData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
                loadTokensData();
                setLastUpdated(Date.now()); // Update last updated time
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastUpdated]);

    const handleTokenPost = async () => {
        let tokenExpiry = null;
        let token = null;
    
        tokenExpiry = parseInt(selectedExpiry);
        token = currentToken; // The generated token
    
        setLoading(true);
        const result = await postToken(tokenExpiry, token);
        if (!result) {
          setLoading(false);
          return;
        } else {
          navigator.clipboard.writeText(currentToken)
          setShowTokenModal(false)
          setCurrentToken('')
          setSelectedExpiry("1")
          await loadTokensData();
        }
    };
    
    const handleTokenModal = async () => {
        setShowTokenModal(true);
        const token = await generateToken();
        setCurrentToken(token);
        setLoading(true);
        await loadTokensData(); // Refresh tokens after generating a new one
    };
    
    const handleDeleteToken = async (tokenId) => {
        setLoading(true);
        const result = await deleteToken(tokenId);
        if (!result) {
          setLoading(false);
          return;
        }
        await loadTokensData();
    };
    
    const toggleTokenVisibility = (tokenId) => {
        setTokens((prevTokens) =>
          prevTokens.map((token) =>
            token.id === tokenId ? { ...token, showToken: !token.showToken } : token
          )
        );
    };

    if (loading) {
        return (
            <Spinner item="Tokens" />
        )
    }

    return (
        <div className="admin-panel-tab-content">
            <LastUpdated lastUpdated={lastUpdated} />
            <div className="admin-panel-tab-header">
                <h3>API Token Management</h3>
                <div className='tokens-section-sub-header'>
                    <label className="tokens-section-switch-label">Show Expired Tokens</label>
                    <label className="tokens-section-switch">
                        <input 
                        type="checkbox" 
                        onChange={(e) => setShowExpiredTokens(e.target.checked)} 
                        />
                        <span className="tokens-section-slider"></span>
                    </label>
                    <button className="admin-panel-btn-primary" onClick={handleTokenModal}>
                        <FontAwesomeIcon icon={faKey} /> Generate Token
                    </button>
                </div>
            </div>

            {tokens.length === 0 ? (
                <div className="admin-panel-empty-state">No tokens found</div>
            ) : (
                <div className="tokens-section-token-table-container">
                <table className="tokens-section-token-table">
                    <thead>
                    <tr>
                        <th>Status</th>
                        <th>Token</th>
                        <th>Created</th>
                        <th>Created By</th>
                        <th>Expires</th>
                        <th>Used By</th>
                        <th>Used At</th>
                        <th className='admin-panel-right-align-action'>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tokens.map((token) => {
                    if (token.is_used && !showExpiredTokens) {
                        return null; // Skip rendering this token if it's used and we're not showing expired
                    }

                    return (
                        <tr key={token.id}>
                        <td>
                            <span className={`tokens-section-status-badge ${token.is_used ? 'inactive' : 'active'}`}>
                            {token.is_used ? 'Used' : 'Active'}
                            </span>
                        </td>
                        <td>
                            <div className="tokens-section-token-display">
                            {token.showToken ? (
                                <code>{token.token}</code>
                            ) : (
                                <button
                                className="admin-panel-btn-icon"
                                onClick={() => toggleTokenVisibility(token.id)}
                                title="Reveal Token"
                                >
                                <FontAwesomeIcon icon={token.showToken ? faEyeSlash : faEye} />
                                </button>
                            )}
                            </div>
                        </td>
                        <td>{token.created_at}</td>
                        <td>{token?.creator || 'System'}</td>
                        <td>{!token.is_used ? token.expires_at : '-'}</td>
                        <td>{token.is_used ? (token.user || 'Unknown') : '-'}</td>
                        <td>{token.is_used ? token.used_at : '-'}</td>
                        <td className='admin-panel-right-align'>
                            {!token.is_used && (
                            <button
                                className="admin-panel-btn-icon danger"
                                onClick={() => handleDeleteToken(token.id)}
                                title="Revoke Token"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                            )}
                        </td>
                        </tr>
                    );
                    })}
                    </tbody>
                </table>
                </div>
            )}

            {showTokenModal && (
                <div className="tokens-section-modal">
                <div className="tokens-section-modal-content">
                    <h3>New API Token Generated</h3>
                    <div className="tokens-section-token-display-modal">
                    <input
                    type="text"
                    value={currentToken}
                    onChange={(e) => {
                        if (e.target.value.length <= 19) {
                        setCurrentToken(e.target.value);
                        } else {
                        notification('Token length exceeds 20 characters', 'error'); // Use your notification system here
                        }
                    }}
                    className="tokens-section-code-like"
                    />
                    </div>
                    
                    <div className="tokens-section-token-expiry-section">
                    <h4>Token Expiry Duration</h4>
                    <div className="tokens-section-expiry-options">
                        <label className="tokens-section-expiry-option">
                        <input 
                            type="radio" 
                            name="tokenExpiry" 
                            value="1" 
                            checked={selectedExpiry === "1"}
                            onChange={() => setSelectedExpiry("1")}
                        />
                        <span className="tokens-section-option-content">
                            <FontAwesomeIcon icon={faClock} />
                            <span>1 Day</span>
                        </span>
                        </label>
                        
                        <label className="tokens-section-expiry-option">
                        <input 
                        type="radio" 
                        name="tokenExpiry" 
                        value="3" 
                        checked={selectedExpiry === "3"}
                        onChange={() => setSelectedExpiry("3")}
                        />
                        <span className="tokens-section-option-content">
                            <FontAwesomeIcon icon={faClock} />
                            <span>3 Days</span>
                        </span>
                        </label>
                        
                        <label className="tokens-section-expiry-option">
                        <input 
                        type="radio" 
                        name="tokenExpiry" 
                        value="7" 
                        checked={selectedExpiry === "7"}
                        onChange={() => setSelectedExpiry("7")}
                        />
                        <span className="tokens-section-option-content">
                            <FontAwesomeIcon icon={faClock} />
                            <span>7 Days</span>
                        </span>
                        </label>
                        
                        <label className="tokens-section-expiry-option">
                        <input 
                        type="radio" 
                        name="tokenExpiry" 
                        value="30" 
                        checked={selectedExpiry === "30"}
                        onChange={() => setSelectedExpiry("30")}
                        />
                        <span className="tokens-section-option-content">
                            <FontAwesomeIcon icon={faClock} />
                            <span>30 Days</span>
                        </span>
                        </label>
                    </div>
                    </div>

                    <p className="tokens-section-warning-text">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> 
                    Please copy this token now. It won't be shown again.
                    </p>
                    
                    <div className="tokens-section-form-actions">
                    <button
                        className="admin-panel-btn-primary"
                        onClick={() => handleTokenPost()}
                    >
                        Copy & Post Token
                    </button>
                    <button
                        className="admin-panel-btn-secondary"
                        onClick={() => setShowTokenModal(false)}
                    >
                        Close
                    </button>
                    </div>
                </div>
                </div>
            )}
      </div>
    );
}