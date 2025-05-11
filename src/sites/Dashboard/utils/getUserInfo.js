export default function getUserInfo() {
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
        window.location.reload();
        return false;
    }

    const is_admin = ["admin", "superadmin", "moderator"].includes(role?.toLowerCase());

    return { token, user_id, username, role, is_admin, permissions, email, is_email_verified };
}