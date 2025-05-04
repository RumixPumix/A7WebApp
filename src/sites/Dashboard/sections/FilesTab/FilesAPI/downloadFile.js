import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';


export default async function downloadFile(fileId) {
  try {
    const response = await fetch(`${config.baseURL}/api/files/download/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (response.status === 422) {
      // Handle validation errors
      throw new Error('Token expired or invalid. Please re-login.');
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Unknown server error');
    }

    const contentType = response.headers.get('Content-Type');
    const blob = await response.blob();

    // Try to detect JSON errors only
    if (contentType && contentType.includes('application/json')) {
      const text = await blob.text();
      try {
        const json = JSON.parse(text);
        if (json.message) {
          throw new Error(json.message);
        }
      } catch (e) {
        throw new Error(text || 'Server returned an unexpected response.');
      }
    }

    // Optional: check blob size if you want (e.g., must be at least 1 KB)
    if (blob.size < 1024) { // 1 KB minimum (you can adjust)
      throw new Error('Downloaded file is too small. Possible server error.');
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `file-${fileId}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    notification('Download started successfully!', 'success');
    return true;

  } catch (error) {
    console.error(error); // Log the error for debugging
    //notification(`${error}`, 'error');
    return false;
  }
}
