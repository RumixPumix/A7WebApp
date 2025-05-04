import { data } from 'react-router-dom';
import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';

export default async function createPost(postId) {
  try {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
    
    const data = await handleResponse(response); // Handle the response using your utility function

    return data; // Return the created post or null if not available

  } catch (error) {
    console.error(error); // Log the error for debugging
    //notification(`${error}`, 'error'); // Use your notification system here
    return false;
  }
}
