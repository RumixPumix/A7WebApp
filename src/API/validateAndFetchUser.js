// apiComm/checkLogin.js
import config from '../config/config';

export default async function validateAndFetchUser() {
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    const is_admin = localStorage.getItem('is_admin');

    // If any localStorage item is missing, clear and redirect
    if (!token || !username || !is_admin) {
        localStorage.clear();
        //window.location.href = '/login'; INSTEAD IF THE FUNCTION RETURNS FALSE THEN REDIRECT
        return false;
    }

    try {
        const response = await fetch(`${config.baseURL}/api/dashboard/check_token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            localStorage.clear();
            //window.location.href = '/login';
            return false;
        }

        const data = await response.json();
        if (!data.status) {
            localStorage.clear();
            //window.location.href = '/login';
            return false;
        }

        // Everything is good, return user info
        return { token, username, is_admin };

    } catch (error) {
        localStorage.clear();
        //window.location.href = '/login';
        return false;
    }
}
