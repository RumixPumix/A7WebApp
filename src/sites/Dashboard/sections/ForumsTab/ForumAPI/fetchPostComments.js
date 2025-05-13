import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export default async function fetchPostComments(postId) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    const data = await handleResponse(response);


    return data['comments'];
    
  });
}
