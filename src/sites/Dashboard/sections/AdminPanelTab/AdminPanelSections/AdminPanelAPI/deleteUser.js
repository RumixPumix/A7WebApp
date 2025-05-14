import config from '../../../../../../config/config.js';
import handleResponse from '../../../../utils/handleResponse.js';
import errorWrapper from '../../../../utils/errorWrapper.js';

export default async function deleteUser(userId) {
    return errorWrapper(async () => {
        const response = await fetch(`${config.baseURL}/api/admin/user/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
        });

        const data = await handleResponse(response);

        return data;
    });
}