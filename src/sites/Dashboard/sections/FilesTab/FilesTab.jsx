import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileUpload, 
  faFileDownload, 
  faTrashAlt, 
  faLock,
  faFolder,
  faFile
} from '@fortawesome/free-solid-svg-icons';
import './filesStyle.css';
import Spinner from '../../../ModularComponents/spinner.jsx';
import LastUpdated from '../../../ModularComponents/lastUpdated.jsx';
import ProgressBar from '../../../ModularComponents/progressBar.jsx';

import uploadFile from './FilesAPI/uploadFile';
import deleteFile from './FilesAPI/deleteFile';
import downloadFile from './FilesAPI/downloadFile';
import fetchFiles from './FilesAPI/fetchFiles';
import fetchPrivateFiles from './FilesAPI/fetchPrivateFiles';
import notification from '../../../ModularComponents/notification.jsx';

const LimitDisplay = ({ hasNoLimit, limits }) => (
    hasNoLimit ? (
        <span className="ft-no-limit">No Limit</span>
    ) : (
        <>
            <strong>Limits:</strong>
            <span>{limits.per_hour}</span>
            <span>{limits.today}</span>
        </>
    )
);

//TODO ADD ZIP DOWNLOAD FOR FOLDERS

// Permission constants
const PERMISSIONS = {
  LIST_FILES: 'file.route.list',
  LIST_ALL_FILES: 'file.route.list.all',
  GET_PRIVATE_FILES: 'file.route.get.private.files',
  UPLOAD: 'file.route.upload',
  UPLOAD_NO_LIMIT: 'file.route.upload.nolimit',
  UPLOAD_PRIVATE: 'file.route.upload.private.file',
  UPLOAD_PRIVATE_NO_LIMIT: 'file.route.upload.private.file.nolimit',
  DOWNLOAD: 'file.route.download',
  DOWNLOAD_ALL: 'file.route.download.all',
  DELETE: 'file.route.delete',
  DELETE_ALL: 'file.route.delete.all'
};

const DEFAULT_LIMITS = { 
    per_hour: "Files today: 0/10", 
    today: "Total size today: 0 / 50 GB" 
};

function FilesTab({ userInfo, searchTerm = '' }) {
    const [loading, setLoading] = useState({ files: true });
    const [files, setFiles] = useState([]);
    const [limits, setLimits] = useState(DEFAULT_LIMITS);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [activeTab, setActiveTab] = useState('public');
    const [currentPath, setCurrentPath] = useState([]); // Now tracks {id, file_name} objects
    const fileUploadInputRef = useRef(null);

    // Filter files based on search term (client-side)
    const filteredFiles = files.filter(file => 
        file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.file_size && file.file_size.toString().includes(searchTerm)) ||
        (file.uploaded_at && file.uploaded_at.toLowerCase().includes(searchTerm)) ||
        (file.uploaded_by && file.uploaded_by.toLowerCase().includes(searchTerm))
    );

    // Check if user has specific permission
    const hasPermission = (permission) => {
        if (!userInfo?.permissions) return false;
        
        // Handle both string (comma-separated) and array cases
        const permissionsList = typeof userInfo.permissions === 'string'
            ? userInfo.permissions.split(',')
            : Array.isArray(userInfo.permissions)
                ? userInfo.permissions.map(p => typeof p === 'object' ? p.name : p)
                : [];
        
        return permissionsList.includes(permission);
    };

    function getParentId() {
        const parent_id = currentPath.length > 0 
                ? currentPath[currentPath.length - 1].id 
                : null;
        return parent_id;
    }


    async function loadFiles() {
        try {
            let global = false;
            if (searchTerm) {
                global = true;
            }
            const parent_id = getParentId();
            const fetchFunction = activeTab === 'private' ? fetchPrivateFiles : fetchFiles;
            const fetchedData = await fetchFunction(parent_id, global);

            const { files, limits } = fetchedData;
            
            setFiles(files || []);
            setLimits(limits || DEFAULT_LIMITS);
            setLastUpdated(new Date());
        } finally {
            setLoading({ files: false });
        }
    }

    useEffect(() => {
        loadFiles(); // Initial fetch

        const interval = setInterval(() => {
            loadFiles(); // Refresh every 30s
        }, 30000);

        return () => clearInterval(interval);
    }, [activeTab, currentPath]);

    //Fetch Functions
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadProgress(0);

        const parent_id = currentPath.length > 0 
                ? currentPath[currentPath.length - 1].id 
                : null;
        const isPrivate = activeTab === 'private';


        try {
            await uploadFile(file, isPrivate, parent_id, (progress) => {
                setUploadProgress(progress);
            });

            setUploadProgress(100);
            setTimeout(() => {
                setUploadProgress(0);
                loadFiles();
            }, 500);
        } catch (error) {
            console.error(error);
            notification('An unexpected error occurred check console for more details.', 'error');
        } finally {
            setUploadProgress(0);
        }
    };

    const handleFileDownload = async (file) => {
        try {
            setDownloadProgress(0);
            const success = await downloadFile(file.id, (progress) => {
            setDownloadProgress(progress);
            });
            
            if (success) {
                setDownloadProgress(100);
                setTimeout(() => setDownloadProgress(0), 500);
            }
        } catch (error) {
            console.error(error);
            notification('An unexpected error occurred check console for more details.', 'error');
        } finally {
            setDownloadProgress(0);
        } 
    };

    const handleFileDelete = async (file) => {
        if (window.confirm(`Are you sure you want to delete ${file.file_name}?`)) {
            const success = await deleteFile(file.id);
            if (success) {
                loadFiles();
            }
        }
    };



    // UI Functions
    const handleFolderClick = (folder) => {
        if (folder.is_folder) {
            setCurrentPath(prev => [...prev, { 
                id: folder.id, 
                name: folder.file_name 
            }]);
        }
    };

    const navigateToFolder = (index) => {
        // Navigate to specific folder in path
        setCurrentPath(prev => prev.slice(0, index + 1));
    };

    const triggerFileUpload = () => {
        fileUploadInputRef.current.value = '';
        fileUploadInputRef.current.click();
    };

    // Check if upload button should be shown
    const showUploadButton = () => {
        if (activeTab === 'private') {
            return hasPermission(PERMISSIONS.UPLOAD_PRIVATE) || 
                hasPermission(PERMISSIONS.UPLOAD_PRIVATE_NO_LIMIT);
        }
        return hasPermission(PERMISSIONS.UPLOAD) || 
            hasPermission(PERMISSIONS.UPLOAD_NO_LIMIT);
    };

    // Check if download should be allowed for a file
    const allowDownload = (file) => {
        if (hasPermission(PERMISSIONS.DOWNLOAD_ALL)) return true;
        if (file.is_private) {
            return (file.uploaded_by === userInfo.username && hasPermission(PERMISSIONS.DOWNLOAD));
        }
        return hasPermission(PERMISSIONS.DOWNLOAD);
    };

    // Check if delete should be allowed for a file
    const allowDelete = (file) => {
        if (hasPermission(PERMISSIONS.DELETE_ALL)) return true;
        if (!hasPermission(PERMISSIONS.DELETE)) return false;
        return file.uploaded_by === userInfo.username;
    };

    if (loading.files) {
        return <Spinner />;
    }

    return (
        <div className="ft-tab-content">
            <div className="ft-tab-header">
                <div className="ft-file-tabs">
                    <button 
                        className={`ft-tab-button ${activeTab === 'public' ? 'ft-active' : ''}`}
                        onClick={() => {
                            setActiveTab('public');
                            setCurrentPath([]);
                        }}
                    >
                        Public Files
                    </button>
                    {hasPermission(PERMISSIONS.GET_PRIVATE_FILES) && (
                        <button 
                            className={`ft-tab-button ${activeTab === 'private' ? 'ft-active' : ''}`}
                            onClick={() => {
                                setActiveTab('private');
                                setCurrentPath([]);
                            }}
                        >
                            <FontAwesomeIcon icon={faLock} /> Private Files
                        </button>
                    )}
                </div>

                <div className="ft-file-limits">
                    {activeTab === 'private' && (
                        <div className="ft-file-limits-item">
                            <LimitDisplay 
                                hasNoLimit={hasPermission(PERMISSIONS.UPLOAD_PRIVATE_NO_LIMIT)}
                                limits={limits}
                            />
                        </div>
                    )}
                    
                    {activeTab === 'public' && (
                        <div className="ft-file-limits-item">
                            <LimitDisplay 
                                hasNoLimit={hasPermission(PERMISSIONS.UPLOAD_NO_LIMIT)}
                                limits={limits}
                            />
                        </div>
                    )}
                </div>

                {showUploadButton() && (
                    <div className="ft-file-actions">
                        <button className="ft-btn-primary" onClick={triggerFileUpload} disabled={loading.files}>
                            <FontAwesomeIcon icon={faFileUpload} />
                            {activeTab === 'private' ? ' Upload Private File' : ' Upload File'}
                        </button>
                        <input 
                            ref={fileUploadInputRef}
                            id="ft-file-upload" 
                            type="file" 
                            style={{ display: 'none' }} 
                            onChange={handleFileUpload}
                        />
                    </div>
                )}
            </div>

            {/* Breadcrumb navigation */}
            <div className="ft-breadcrumbs">
                <button onClick={() => setCurrentPath([])}>Root</button>
                {currentPath.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                        <span> / </span>
                        <button onClick={() => navigateToFolder(index)}>
                            {folder.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            <LastUpdated lastUpdated={lastUpdated} className="ft-last-updated" />

            {(uploadProgress > 0 || downloadProgress > 0) && (
                <ProgressBar 
                    value={uploadProgress || downloadProgress} 
                    label={uploadProgress > 0 ? 'Uploading...' : 'Downloading...'}
                    className="ft-progress-bar"
                />
            )}

            {files.length === 0 ? (
                <div className="ft-empty-state">
                    {activeTab === 'private' ? 'No private files found' : 'No files found'}
                </div>
            ) : (
                <div className="ft-file-table-container">
                    <table className="ft-file-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Size</th>
                                <th>Type</th>
                                <th>Uploaded</th>
                                <th>Uploaded By</th>
                                <th className="ft-right-align">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map(file => (
                                <tr 
                                    key={file.id} 
                                    className={file.is_private ? 'ft-private-file' : ''} 
                                    onClick={() => file.is_folder && handleFolderClick(file)}
                                >
                                    <td>
                                        <FontAwesomeIcon 
                                            icon={file.is_folder ? faFolder : faFile} 
                                            className={file.is_folder ? 'ft-folder-icon' : 'ft-file-icon'} 
                                        />
                                        {file.is_private && (
                                            <FontAwesomeIcon icon={faLock} className="ft-private-file-icon" />
                                        )}
                                        <span>{file.file_name}</span>
                                    </td>
                                    <td>{file.is_folder ? '' : formatFileSize(file.file_size)}</td>
                                    <td>{file.is_folder ? '' : (file.mime_type || file.file_name.split('.').pop().toUpperCase())}</td>
                                    <td>{file.is_folder ? '' : formatDate(file.uploaded_at)}</td>
                                    <td>{file.is_folder ? '' : file.uploaded_by}</td>
                                    <td className="ft-right-align">
                                        {!file.is_folder && allowDownload(file) && (
                                            <button 
                                                className="ft-btn-icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFileDownload(file);
                                                }}
                                                title="Download"
                                                disabled={loading.files}
                                            >
                                                <FontAwesomeIcon icon={faFileDownload} />
                                            </button>
                                        )}
                                        {allowDelete(file) && (
                                            <button 
                                                className="ft-btn-icon ft-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFileDelete(file);
                                                }}
                                                title="Delete"
                                                disabled={loading.files}
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Helper functions (add these at the bottom of your file)
function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString();
}

export default FilesTab;