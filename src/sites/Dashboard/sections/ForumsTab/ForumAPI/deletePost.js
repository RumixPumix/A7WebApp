import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export default async function createPost(postId) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
    
    const data = await handleResponse(response); // Handle the response using your utility function

    return data; // Return the created post or null if not available

  });
}
