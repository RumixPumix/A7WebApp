import config from '../../../../../config/config.js';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';


export default async function postToken(tokenExpiry, token) {
    return errorWrapper(async () => {
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
    });
}