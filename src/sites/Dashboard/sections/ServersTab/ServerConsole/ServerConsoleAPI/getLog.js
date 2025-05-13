import config from '../../../../../../config/config';
import handleResponse from '../../../../utils/handleResponse.js';
import { ExpectedIssue } from '../../../../utils/expectedIssue.js';
import errorWrapper from '../../../../utils/errorWrapper.js';

export default async function getLog(server) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/server/servers/${server}/logs`, {
    method: 'GET', // Use POST method to create a new server
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
    });

    const data = await handleResponse(response);


    return data; // Return the parsed data

  });
}
