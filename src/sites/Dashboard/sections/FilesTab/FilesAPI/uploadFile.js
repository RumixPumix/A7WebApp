import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';


export default async function uploadFile(file, isPrivate = false) {
  console.log('Uploading file:', file, 'Is private:', isPrivate); // Debugging log
  try {
    if (!file) {
      throw new Error('No file selected for upload.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrivate', isPrivate.toString());

    const response = await fetch(`${config.baseURL}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: formData
    });

    const data = await handleResponse(response);

    return data;

  } catch (error) {
    console.error(error); // Log the error for debugging
    //notification(`${error}`, 'error');
    return false;
  }
}
