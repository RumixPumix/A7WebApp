import config from '../../../../../config/config';
import { ExpectedIssue } from '../../../utils/expectedIssue.js';
import errorWrapper from '../../../utils/errorWrapper.js';

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default async function downloadFile(file, onProgress, signal) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/files/download/${file.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      signal
    });

    const contentType = response.headers.get('Content-Type');
    const contentDisposition = response.headers.get('Content-Disposition');
    const contentLength = response.headers.get('Content-Length');
    const total = parseInt(contentLength, 10) || 0;

    if (!response.ok) {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.message) {
          throw new ExpectedIssue(errorData.message);
        }
      }
      throw new Error(`Download failed with status ${response.status}`);
    }

    if (!contentType?.startsWith('application/') && !contentType?.startsWith('image/')) {
      throw new ExpectedIssue('Invalid or unexpected file type received.');
    }

    // Extract filename
    let filename = `${file.file_name}`;
    const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '');
    }

    // Stream the response body
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (onProgress) {
        if (total) {
          onProgress(Math.round((loaded / total) * 100));
        } else {
          onProgress(-1); // unknown total, show indeterminate
        }
      }
    }

    const blob = new Blob(chunks, { type: contentType });

    // Optional file size sanity check
    if (blob.size < 1024 && contentType.includes('text/html')) {
      throw new ExpectedIssue('The file may be invalid or contain an error page.');
    }

    triggerDownload(blob, filename);
    return true;
  });
}
