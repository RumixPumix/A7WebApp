import config from '../../../../../../config/config.js';
import handleResponse from '../../../../utils/handleResponse.js';
import { ExpectedIssue } from '../../../../utils/expectedIssue.js';
import errorWrapper from '../../../../utils/errorWrapper.js';

export default async function fetchTokens() {
  return errorWrapper(async () => {
    const url = `${config.baseURL}/api/admin/tokens`;
    const options = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    };

    const response = await fetch(url, options);

    const data = await handleResponse(response);

    console.log('Tokens data:', data);

    if (!Array.isArray(data)) {
      throw new ExpectedIssue('Invalid response format from server');
    }

    return data;
  });
}