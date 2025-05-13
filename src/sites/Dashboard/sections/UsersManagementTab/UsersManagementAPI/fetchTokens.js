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
 * Fetches tokens from the server and formats the response data
 * @returns {Promise<Array>} Array of formatted token objects
 */
export default async function fetchTokens() {
  return errorWrapper(async () => {
    const url = `${config.baseURL}/api/admin/tokens`;
    const options = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    };

    const response = await fetch(url, options);

    const data = await handleResponse(response);

    // Handle case where data might not be in expected format
    if (!Array.isArray(data)) {
      throw new ExpectedIssue('Invalid response format from server');
    }

    // Transform the user data
    return data.map(token => ({
        ...token, //
        created_at: formatDate(token.created_at), 
        expires_at: formatDate(token.expires_at),
        used_at: formatDate(token.used_at),
        is_valid: token.is_valid ? 'Yes' : 'No',
        creator: token.creator.username || 'Unknown',
        user: token.user?.username || 'Unknown'
    }));
  });
}