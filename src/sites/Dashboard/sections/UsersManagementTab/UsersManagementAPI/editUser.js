import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export default async function editUser(userId, userData) {
    return errorWrapper(async () => {
        const response = await fetch(`${config.baseURL}/api/admin/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(userData),
        });

        const data = await handleResponse(response);
    
        return data;
    });
}