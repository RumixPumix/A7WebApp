import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export default async function deleteServer(serverId) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/server/delete/${serverId}`, {
    method: 'DELETE', // Use POST method to create a new server
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const data = await handleResponse(response);

    return data; // Return the parsed data

  });
}
