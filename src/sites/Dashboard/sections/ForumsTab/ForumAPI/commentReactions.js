import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export async function likeComment(postId, commentId) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}/comment/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    const data = await handleResponse(response); // Handle the response using your utility function
    
    return data; // Return the response data
  });
}

export async function dislikeComment(postId, commentId) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}/comment/${commentId}/dislike`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    const data = await handleResponse(response); // Handle the response using your utility function
    return data; // Return the response data

  });
}