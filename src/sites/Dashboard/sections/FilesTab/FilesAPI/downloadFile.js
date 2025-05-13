import config from '../../../../../config/config';
import { ExpectedIssue } from '../../../utils/expectedIssue.js';
import errorWrapper from '../../../utils/errorWrapper.js';


export default async function downloadFile(fileId, onProgress) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/files/download/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const contentType = response.headers.get('Content-Type');
    const contentLength = response.headers.get('Content-Length');
    let loaded = 0;
    const total = parseInt(contentLength, 10) || 0;

    if (!response.ok) {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.message){
          throw new ExpectedIssue(errorData.message);
        }
      }
      throw new Error(`Download failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const chunks = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      loaded += value.length;
      if (onProgress && total > 0) {
        onProgress(Math.round((loaded / total) * 100));
      }
    }

    const blob = new Blob(chunks);
    
    if (blob.size < 1024) {
      throw new ExpectedIssue('Downloaded file is too small. Possible server error.');
    }

    triggerDownload(blob, `file-${fileId}`);
    return true;
  });
}