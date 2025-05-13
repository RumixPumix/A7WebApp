import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import { ExpectedIssue } from '../../../utils/expectedIssue.js';
import errorWrapper from '../../../utils/errorWrapper.js';


export default async function fetchForumPosts() {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/forums/posts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const data = await handleResponse(response);

    if (!Array.isArray(data)) {
      throw new ExpectedIssue('Received invalid response format from server');
    }

    return data;

  });
}
