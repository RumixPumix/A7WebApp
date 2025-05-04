import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';

export async function likePost(postId) {
  try {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    const data = await handleResponse(response); // Handle the response using your utility function
    return data; // Return the response data
  } catch (error) {
    console.error('Error liking post:', error); // Log the error for debugging
    //notification(`${error}`, 'error'); // Use your notification system here
    return false;
  }
}

export async function dislikePost(postId) {
  try {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}/dislike`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    const data = await handleResponse(response); // Handle the response using your utility function
    return data; // Return the response data

  } catch (error) {
    console.error(error); // Log the error for debugging
    //notification(`${error}`, 'error'); // Use your notification system here
    return false;
  }
}