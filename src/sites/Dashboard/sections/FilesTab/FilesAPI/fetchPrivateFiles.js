import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';


function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default async function fetchFiles() {
  try {
    const response = await fetch(`${config.baseURL}/api/files/private`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const data = await handleResponse(response);

    if (!Array.isArray(data)) {
      throw new Error('Received invalid response format from server');
    }

    return data.map(file => ({
      id: file.id,
      name: `${file.file_name}.${file.file_extension}`,
      size: formatFileSize(file.file_size),
      uploaded: new Date(file.uploaded_at).toLocaleDateString(),
      uploadedBy: file.uploader_username,
      author: file.uploader_username
    }));
  } catch (error) {
    console.error(error); // Log the error for debugging
    //notification(`${error}`, 'error'); // Use your notification system here
    return false;
  }
}
