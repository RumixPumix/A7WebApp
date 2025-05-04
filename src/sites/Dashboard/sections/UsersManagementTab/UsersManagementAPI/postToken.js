import config from '../../../../../config/config';
import notification from '../../../../ModularComponents/notification.jsx';
import handleResponse from '../../../utils/handleResponse.js';


export default async function postToken(tokenExpiry, token) {
    try {
        const payload = {
            tokenExpiry,
            token
        };
        const response = await fetch(`${config.baseURL}/api/admin/token`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await handleResponse(response);

        return data;
    } catch (error) {
        console.error(error); 
        //notification(`${error}`, 'error'); 
        return false;
    }
}