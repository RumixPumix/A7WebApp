import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileUpload, 
  faFileDownload, 
  faTrashAlt, 
  faLock,
  faFolder,
  faFolderOpen,
  faFile
} from '@fortawesome/free-solid-svg-icons';
import fetchFiles from './FilesAPI/fetchFiles';
import fetchPrivateFiles from './FilesAPI/fetchPrivateFiles';
import downloadFile from './FilesAPI/downloadFile';
import deleteFile from './FilesAPI/deleteFile';
import uploadFile from './FilesAPI/uploadFile';
import Spinner from '../../../ModularComponents/spinner.jsx';
import LastUpdated from '../../../ModularComponents/lastUpdated.jsx';
import ProgressBar from '../../../ModularComponents/progressBar.jsx';

import './filesStyle.css';

function FilesTab({ isAdmin }) {
  const [loading, setLoading] = useState({ files: true });
  const [files, setFiles] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('public');
  const [error, setError] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);

  const currentUserId = localStorage.getItem('username');
  const fileInputRef = useRef(null);
  const loadingRef = useRef(false);

  async function loadFiles() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading({ files: true });
    setError(null);
    
    try {
      const fetchFunction = activeTab === 'private' ? fetchPrivateFiles : fetchFiles;
      const fetchedFiles = await fetchFunction(currentPath.join('/'));
      
      if (fetchedFiles === false) {
        throw new Error('Failed to load files');
      }
      
      setFiles(fetchedFiles || []);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error loading files:', error);
      setError(error.message);
      setFiles([]);
    } finally {
      setLoading({ files: false });
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    loadFiles();
    return () => { loadingRef.current = false; };
  }, [activeTab, currentPath]);

  useEffect(() => {
    let interval;
    if (files.length > 0) {
      interval = setInterval(() => {
        if (lastUpdated && (Date.now() - lastUpdated) > 30000) {
          loadFiles();
        }
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [lastUpdated, activeTab, files.length]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    //setLoading({ files: true });
    setUploadProgress(0);
    
    try {
      const result = await uploadFile(file, activeTab === 'private', (progress) => {
        setUploadProgress(progress);
      }, currentPath.join('/'));
      
      if (!result) throw new Error('Upload failed');
      setLoading({ files: true });
      await loadFiles();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setUploadProgress(0);
      setLoading({ files: false });
    }
  };

  const handleFileDownload = async (fileId) => {
    //setLoading({ files: true });
    setDownloadProgress(0);
    
    try {
      const result = await downloadFile(fileId, (progress) => {
        setDownloadProgress(progress);
      });
      
      if (!result) throw new Error('Download failed');
    } catch (error) {
      console.error('Download error:', error);
      setError(error.message);
    } finally {
      setDownloadProgress(0);
      //setLoading({ files: false });
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    setLoading({ files: true });
    try {
      const result = await deleteFile(fileId);
      if (!result) throw new Error('Deletion failed');
      await loadFiles();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.message);
    } finally {
      setLoading({ files: false });
    }
  };

  const handleFolderClick = (folderName) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateToPath = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const triggerFileInput = () => {
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const getFileIcon = (file) => {
    if (file.isFolder) {
      return currentPath.length > 0 ? faFolderOpen : faFolder;
    }
    return faFile;
  };

  if (loading.files && files.length === 0) {
    return <Spinner item="Files" />;
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
          <button 
            className={`ft-tab-button ${activeTab === 'private' ? 'ft-active' : ''}`}
            onClick={() => {
              setActiveTab('private');
              setCurrentPath([]);
            }}
          >
            <FontAwesomeIcon icon={faLock} /> Private Files
          </button>
        </div>
        
        <div className="ft-file-actions">
          <button className="ft-btn-primary" onClick={triggerFileInput} disabled={loading.files}>
            <FontAwesomeIcon icon={faFileUpload} /> 
            {activeTab === 'private' ? ' Upload Private File' : ' Upload File'}
          </button>
          <input 
            ref={fileInputRef}
            id="ft-file-upload" 
            type="file" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
          />
        </div>
      </div>

      <LastUpdated lastUpdated={lastUpdated} className="ft-last-updated" />

      {error && <div className="ft-error-message">Error: {error}</div>}

      {(uploadProgress > 0 || downloadProgress > 0) && (
        <ProgressBar 
          value={uploadProgress || downloadProgress} 
          label={uploadProgress > 0 ? 'Uploading...' : 'Downloading...'}
          className="ft-progress-bar"
        />
      )}

      {/* Breadcrumb navigation */}
      {currentPath.length > 0 && (
        <div className="ft-breadcrumb">
          <button className="ft-breadcrumb-item" onClick={() => setCurrentPath([])}>
            Root
          </button>
          {currentPath.map((folder, index) => (
            <React.Fragment key={index}>
              <span className="ft-breadcrumb-separator">/</span>
              <button 
                className="ft-breadcrumb-item" 
                onClick={() => navigateToPath(index)}
              >
                {folder}
              </button>
            </React.Fragment>
          ))}
        </div>
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
              {files.map(file => (
                <tr key={file.id} className={file.isPrivate ? 'ft-private-file' : ''}>
                  <td>
                    <FontAwesomeIcon 
                      icon={getFileIcon(file)} 
                      className={file.isFolder ? 'ft-folder-icon' : 'ft-file-icon'} 
                    />
                    {file.isPrivate && (
                      <FontAwesomeIcon 
                        icon={faLock} 
                        className="ft-private-file-icon" 
                      />
                    )}
                    {file.isFolder ? (
                      <button 
                        className="ft-folder-name"
                        onClick={() => handleFolderClick(file.name)}
                      >
                        {file.name}
                      </button>
                    ) : (
                      <span>{file.name}</span>
                    )}
                  </td>
                  <td>{file.isFolder ? '-' : file.size}</td>
                  <td>{file.isFolder ? 'Folder' : (file.type || file.name.split('.').pop().toUpperCase())}</td>
                  <td>{file.uploaded}</td>
                  <td>{file.author || file.uploadedBy}</td>
                  <td className="ft-right-align">
                    {!file.isFolder && (
                      <button 
                        className="ft-btn-icon"
                        onClick={() => handleFileDownload(file.id)}
                        title="Download"
                        disabled={loading.files}
                      >
                        <FontAwesomeIcon icon={faFileDownload} />
                      </button>
                    )}
                    {(isAdmin || (file.author || file.uploadedBy) === currentUserId) && (
                      <button 
                        className="ft-btn-icon ft-danger"
                        onClick={() => handleFileDelete(file.id)}
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

export default FilesTab;