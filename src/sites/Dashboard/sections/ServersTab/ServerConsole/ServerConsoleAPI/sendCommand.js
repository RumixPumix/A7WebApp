import config from '../../../../../../config/config';
import handleResponse from '../../../../utils/handleResponse.js';

export default async function sendCommand(command, server) {
  try {
    const response = await fetch(`${config.baseURL}/api/server/send_command/${server}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({ command }) // ✅ fixed here
    });

    const data = await handleResponse(response);

    return data;
  } catch (error) {
    console.error(error);
    return false;
  }
}

