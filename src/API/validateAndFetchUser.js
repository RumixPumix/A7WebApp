// apiComm/checkLogin.js
import config from '../config/config';

export default async function validateAndFetchUser() {
    const token = localStorage.getItem("access_token");
    const user_id = localStorage.getItem("user_id");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const permissions = localStorage.getItem("permissions");
    const email = localStorage.getItem("email");
    const is_email_verified = localStorage.getItem("is_email_verified");

    // If any localStorage item is missing, clear and redirect
    if (!token || !username || !user_id || !role || !permissions || !email) {
        localStorage.clear();
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
            return false;
        }

        const data = await response.json();
        if (!data.status) {
            localStorage.clear();
            return false;
        }

        // Everything is good, return user info
        return { token, user_id, username, role, permissions, email, is_email_verified };

    } catch (error) {
        localStorage.clear();
        //window.location.href = '/login';
        return false;
    }
}
