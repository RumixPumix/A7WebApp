import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';


export default async function fetchHome() {
  try {
    const response = await fetch(`${config.baseURL}/api/dashboard/home`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const data = await handleResponse(response);
    return data;
    
  } catch (error) {
    console.error(error);
    return false;
  }
}
