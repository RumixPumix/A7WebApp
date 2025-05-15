import config from '../../../../../../config/config.js';
import handleResponse from '../../../../utils/handleResponse.js';
import { ExpectedIssue } from '../../../../utils/expectedIssue.js';
import errorWrapper from '../../../../utils/errorWrapper.js';

export default async function fetchUsers() {
  return errorWrapper(async () => {
    const url = `${config.baseURL}/api/admin/users`;
    const options = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    };

    const response = await fetch(url, options);

    const data = await handleResponse(response);

    if (!Array.isArray(data)) {
      throw new ExpectedIssue('Received invalid response format from server');
    }

    return data;
  });
}