import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';

export default async function fetchServers() {
  try {
    const response = await fetch(`${config.baseURL}/api/server/servers`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const data = await handleResponse(response);

    if (!Array.isArray(data)) {
      //throw new Error('Received invalid response format from server');
    }

    return data; // Return the parsed data

  } catch (error) {
    console.error(error);
    //notification(`${error}`, 'error'); // Use your notification system here
    return false;
  }
}
