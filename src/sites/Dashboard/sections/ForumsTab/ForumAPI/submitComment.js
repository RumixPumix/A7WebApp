import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export default async function submitComment(postId, commentData) {
  return errorWrapper(async () => {
    const response = await fetch(`${config.baseURL}/api/forums/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(commentData)
      });

    const data = await handleResponse(response); // Handle the response using your utility function

    return data;
  });
}
