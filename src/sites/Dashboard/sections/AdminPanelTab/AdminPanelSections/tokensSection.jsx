import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faClock, faTimes, faExclamationTriangle, faEye, faEyeSlash, faTrash } from '@fortawesome/free-solid-svg-icons';
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
    const [showUsedTokens, setShowUsedTokens] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [sortBy, setSortBy] = useState('status_active');


    const filteredTokens = tokens
    .filter(token =>
        token.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.created_at.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.expires_at?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.used_at?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
        switch (sortBy) {
        // Status sorting (Active/Inactive)
        case 'status_active':
            return (a.is_used === b.is_used) ? 0 : a.is_used ? 1 : -1;
        case 'status_inactive':
            return (a.is_used === b.is_used) ? 0 : a.is_used ? -1 : 1;

        // Creation date sorting
        case 'created_asc':
            return new Date(a.created_at) - new Date(b.created_at);
        case 'created_desc':
            return new Date(b.created_at) - new Date(a.created_at);

        // Expiration date sorting
        case 'expires_asc':
            // For tokens that are already used, push them to the bottom
            if (a.is_used && !b.is_used) return 1;
            if (!a.is_used && b.is_used) return -1;
            if (a.is_used && b.is_used) return 0;
            return new Date(a.expires_at) - new Date(b.expires_at);
        case 'expires_desc':
            // For tokens that are already used, push them to the bottom
            if (a.is_used && !b.is_used) return 1;
            if (!a.is_used && b.is_used) return -1;
            if (a.is_used && b.is_used) return 0;
            return new Date(b.expires_at) - new Date(a.expires_at);

        // Usage date sorting
        case 'used_asc':
            // For tokens not used yet, push them to the bottom
            if (!a.used_at && b.used_at) return 1;
            if (a.used_at && !b.used_at) return -1;
            if (!a.used_at && !b.used_at) return 0;
            return new Date(a.used_at) - new Date(b.used_at);
        case 'used_desc':
            // For tokens not used yet, push them to the bottom
            if (!a.used_at && b.used_at) return 1;
            if (a.used_at && !b.used_at) return -1;
            if (!a.used_at && !b.used_at) return 0;
            return new Date(b.used_at) - new Date(a.used_at);

        // Default case (shouldn't happen if all options are covered)
        default:
            return 0;
        }
    });

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
                    <label className="tokens-section-switch-label">Show Used Tokens</label>
                    <label className="tokens-section-switch">
                        <input 
                        type="checkbox" 
                        onChange={(e) => setShowUsedTokens(e.target.checked)} 
                        />
                        <span className="tokens-section-slider"></span>
                    </label>
                    <button className="admin-panel-btn-primary" onClick={handleTokenModal}>
                        <FontAwesomeIcon icon={faKey} /> Generate Token
                    </button>
                </div>
            </div>
            <div className="admin-panel-filters">
                <div style={{ marginLeft: "20px" }}>
                    <label htmlFor="sortBy">Sort By: </label>
                    <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    >
                        <optgroup label="Status">
                            <option value="status_active">Active First</option>
                            <option value="status_inactive">Inactive First</option>
                        </optgroup>
                        
                        <optgroup label="Creation Date">
                            <option value="created_asc">Oldest First</option>
                            <option value="created_desc">Newest First</option>
                        </optgroup>
                        
                        <optgroup label="Expiration">
                            <option value="expires_asc">Soonest First</option>
                            <option value="expires_desc">Latest First</option>
                        </optgroup>
                        
                        <optgroup label="Usage">
                            <option value="used_asc">Oldest Usage</option>
                            <option value="used_desc">Recent Usage</option>
                        </optgroup>
                    </select>
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
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredTokens.map((token) => {
                    if (token.is_used && !showUsedTokens) {
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
                        <td>{token?.created_by || 'System'}</td>
                        <td>{!token.is_used ? token.expires_at : '-'}</td>
                        <td>{token.is_used ? (token.used_by || 'Unknown') : '-'}</td>
                        <td>{token.is_used ? token.used_at : '-'}</td>
                        <td>
                            <div className = "tokens-section-actions">
                                {!token.is_used && (
                                <button
                                    className="admin-panel-btn-icon danger"
                                    onClick={() => handleDeleteToken(token.id)}
                                    title="Revoke Token"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                                )}
                                {token.is_used && (
                                <button
                                    className="admin-panel-btn-icon danger"
                                    onClick={() => handleDeleteToken(token.id)}
                                    title="Delete Token"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                                )}
                            </div>
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