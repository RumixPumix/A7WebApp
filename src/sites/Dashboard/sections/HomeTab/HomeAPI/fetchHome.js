import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';


export default async function fetchHome() {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/dashboard/home`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const data = await handleResponse(response);
    return data;
    
  });
}
