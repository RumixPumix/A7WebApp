import errorWrapper from '../../../../utils/errorWrapper.js';
import config from "../../../../../../config/config";
import handleResponse from '../../../../utils/handleResponse.js';


export default async function fetchRoles(){
    return errorWrapper(async () => {
        const url = `${config.baseURL}/api/admin/roles`;
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

        return data;
    })
}