import config from "../../../config/config";
import popup from "../../ModularComponents/popup";

const handleApiResponse = async (response) => {
    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        popup("Error", "Unexpected server response. Try again later.");
        return false;
    }

    if (!response.ok) {
        if (response.status === 401 && data?.error === "Invalid credentials") {
            popup("Login Failed", "Invalid username or password.");
        } else {
            popup("Error", "Login failed. Server issue, please try later.");
        }
        return false;
    }

    return data;
};

const storeUserData = (data) => {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("username", data.user.username);
    localStorage.setItem("is_admin", data.user.is_admin);
    localStorage.setItem("user_id", data.user.id);
};

const sendLoginInformation = async (username, password) => {
    try {
        const response = await fetch(`${config.baseURL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await handleApiResponse(response);

        if (!data) return false;

        if (data.status === true && data.access_token) {
            storeUserData(data);
            return true;
        } else if (data.status === false) {
            popup(data.title || "Login Failed", data.message || "Unknown error.");
            return false;
        } else {
            popup("Error", "Login failed. Server returned unexpected data.");
            return false;
        }
    } catch (error) {
        popup("Error", "A network error occurred. Please try again.");
        return false;
    }
};

export default sendLoginInformation;
export { sendLoginInformation };
