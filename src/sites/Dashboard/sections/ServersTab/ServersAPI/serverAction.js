import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';

export default async function serverAction(serverId, action) {
  try {
    const response = await fetch(`${config.baseURL}/api/server/${action}/${serverId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const data = await handleResponse(response);

    return data;
    
  } catch (error) {
    console.error(error); // Log the error for debugging
    //notification(`${error}`, 'error'); // Use your notification system here
    return false;
  }
}
