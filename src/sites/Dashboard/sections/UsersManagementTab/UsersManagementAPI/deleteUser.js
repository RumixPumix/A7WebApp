import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';

export default async function deleteUser(userId) {
    try{
        const response = await fetch(`${config.baseURL}/api/admin/user/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
        });

        const data = await handleResponse(response);

        return data;
    } catch (error) {
        console.error(error); // Log the error for debugging
        //notification(`${error}`, 'error'); // Use your notification system here
        return false;
    }
}