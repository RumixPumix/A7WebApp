import config from '../../../../../config/config';
import { ExpectedIssue } from '../../../utils/expectedIssue.js';
import errorWrapper from '../../../utils/errorWrapper.js';

const allowedFileTypes = [
  'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'xlsx', 'pptx', 'zip', 'rar'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50 GB

export default async function uploadFile(file, isPrivate = false, parent_id, onProgress) {
  return errorWrapper(async () => {
    if (!file) throw new ExpectedIssue('No file selected for upload.');

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedFileTypes.includes(fileExtension)) {
      throw new ExpectedIssue(`File type .${fileExtension} is not allowed.`);
    }

    if (file.size <= 0) {
      throw new ExpectedIssue('Cannot upload an empty file.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ExpectedIssue('File size exceeds the 50 GB limit.');
    }

    if (parent_id !== null && parent_id !== 'null' && isNaN(Number(parent_id))) {
      throw new ExpectedIssue('Invalid parent ID.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_private', isPrivate.toString());
    formData.append('parent_id', parent_id || 'null');

    console.debug('Uploading file:', formData);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.onprogress = (event) => {
        if (onProgress && event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));

      xhr.open('POST', `${config.baseURL}/api/files/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
      xhr.send(formData);
    });
  });
}