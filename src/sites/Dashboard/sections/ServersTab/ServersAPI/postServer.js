import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';

export default async function postServer(serverData) {
  console.log('postServer', serverData); // Log the server data for debugging
  try {
    const response = await fetch(`${config.baseURL}/api/server/create`, {
    method: 'POST', // Use POST method to create a new server
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(serverData) // Send the server data as JSON
    });

    const data = await handleResponse(response);

    return data; // Return the parsed data

  } catch (error) {
    console.error(error);
    //notification(`${error}`, 'error'); // Use your notification system here
    return false;
  }
}
