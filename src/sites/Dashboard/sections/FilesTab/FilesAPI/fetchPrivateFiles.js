import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export default async function fetchFiles(parent_id = null) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/files/private/${parent_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const data = await handleResponse(response);

    return data;
  });
}
