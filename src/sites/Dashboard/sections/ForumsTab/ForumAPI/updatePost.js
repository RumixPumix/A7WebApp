import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export default async function updatePost(postId, postData) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(postData)
      });
    
    const data = await handleResponse(response);
    
    return data; // Return the created post or null if not available
  });
}
