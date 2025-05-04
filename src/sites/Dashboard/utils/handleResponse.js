import notification from '../../ModularComponents/notification.jsx';

let showNotification = false; // Default to false

export function setNotificationEnabled(enabled) {
    showNotification = enabled;
}

export default async function handleResponse(response, customShow = true) {
    if (response.ok) {
        let dataAPI;
        try {
            dataAPI = await response.json();
        } catch (error) {
            throw new Error('Invalid JSON response from server');
        }

        if (!dataAPI?.message || !dataAPI?.data) {
            throw new Error('Received invalid response format from server');
        }

        if (showNotification && customShow) {
            notification(dataAPI.message, 'success');
        }

        return dataAPI.data; 
    }

    let data;
    try {
        data = await response.json();
        console.log(data);
        if (data?.message) {
            notification(data.message, 'error');
            throw new Error(data.message);
        }
    } catch (error) {
        throw new Error(error);
    }
    console.log("Somehow we reached me?")

    switch (response.status) {
        case 400:
            throw new Error('Invalid request data'); // No need for data.message
        case 401:
            throw new Error('Token expired or invalid. Please re-login.');
        case 403:
            throw new Error('Forbidden. You do not have permission to perform this action.');
        case 404:
            throw new Error('Resource not found');
        case 409:
            throw new Error('Conflict: Resource already exists or is in use');
        case 422:
            throw new Error('Token expired or invalid. Please re-login.');
        case 500:
            throw new Error('Internal server error');
        default:
            throw new Error(`Request failed with status ${response.status}`);
    }
}