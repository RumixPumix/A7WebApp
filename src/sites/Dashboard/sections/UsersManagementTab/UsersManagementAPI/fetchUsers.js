import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import { ExpectedIssue } from '../../../utils/expectedIssue.js';
import errorWrapper from '../../../utils/errorWrapper.js';


/**
 * Formats a date string into a more readable format (DD.MM - HH:MM)
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month} - ${hours}:${minutes}`;
  } catch {
    return 'Invalid date';
  }
};

/**
 * Fetches users from the server and formats the response data
 * @returns {Promise<Array>} Array of formatted user objects
 */
export default async function fetchUsers() {
  return errorWrapper(async () => {
    const url = `${config.baseURL}/api/admin/users`;
    const options = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    };

    const response = await fetch(url, options);

    const data = await handleResponse(response);

    if (!Array.isArray(data)) {
      throw new ExpectedIssue('Received invalid response format from server');
    }

    return data.map(user => ({
      ...user,
      created_at: formatDate(user.created_at),
      last_login: formatDate(user.last_login),
    }));

  });
}