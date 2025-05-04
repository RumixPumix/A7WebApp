import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';

export default async function updatePost(postId, postData) {
  try {
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
  } catch (error) {
    console.error(error); // Log the error for debugging
    //notification(`${error}`, 'error'); // Use your notification system here
    return false;
  }
}
