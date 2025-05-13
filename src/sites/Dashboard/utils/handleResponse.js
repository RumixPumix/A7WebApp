import notification from '../../ModularComponents/notification.jsx';
import { ExpectedIssue } from './expectedIssue.js';

function getNotificationSettings() {
    const settings = JSON.parse(localStorage.getItem('settings'));
    return settings?.showNotifications ?? true;
}

export default async function handleResponse(response, force = true) {
    const showNotification = getNotificationSettings();
    if (response.ok) {
        let dataAPI;
        try {
            dataAPI = await response.json();
        } catch (error) {
            throw new ExpectedIssue('Invalid JSON response from server');
        }

        if (!dataAPI?.message || !dataAPI?.data) {
            throw new ExpectedIssue('Received invalid response format from server');
        }

        if (showNotification) {
            if (force){
                notification(dataAPI.message, 'success');
            }
        }

        return dataAPI.data; 
    }

    let data;
    try {
        data = await response.json();
        if (data?.message) {
            throw new ExpectedIssue(data.message);
        }
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new ExpectedIssue('Invalid JSON response from server');
        } else if (error instanceof ExpectedIssue) {
            throw error; // Re-throw ExpectedIssue errors
        } else {
            throw new Error(error.message); // Handle other errors
        }
    }

    switch (response.status) {
        case 400:
            throw new ExpectedIssue('Invalid request data'); // No need for data.message
        case 401:
            if (showNotification) {
                notification('Token expired or invalid. Please re-login.', 'error');
            }
            setTimeout(() => window.location.reload(), 1000); // 1 second delay
            break;
        case 403:
            throw new ExpectedIssue('Forbidden. You do not have permission to perform this action.');
        case 404:
            throw new ExpectedIssue('Resource not found');
        case 409:
            throw new ExpectedIssue('Conflict: Resource already exists or is in use');
        case 422:
            throw new ExpectedIssue('Token expired or invalid. Please re-login.');
        case 500:
            throw new ExpectedIssue('Internal server error');
        default:
            throw new ExpectedIssue(`Request failed with status ${response.status}`);
    }
}