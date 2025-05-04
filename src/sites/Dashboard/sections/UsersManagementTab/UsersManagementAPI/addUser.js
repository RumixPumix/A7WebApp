import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';

export default async function addUser(userData) {
    try {
        const response = await fetch(`${config.baseURL}/api/admin/user`, {        
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(userData),
            });

        const data = await handleResponse(response);

        return data;
    } catch (error) {
        console.error(error);
        //notification(`${error}`, 'error'); // Use your notification system here
        return false;
    }
}