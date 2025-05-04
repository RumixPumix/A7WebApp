import config from "../../../config/config";
import popup from "../../ModularComponents/popup";

// Helper function for handling API responses
const handleApiResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        // Specific error handling for common issues
        if (response.status === 400 && errorData.error === "Invalid token") {
            popup("Registration Failed", "The provided token is invalid or already used.");
        } else if (response.status === 409 && errorData.error === "Username exists") {
            popup("Registration Failed", "Username already exists. Please choose another.");
        } else {
            popup("Error", "Registration failed. Server seems to be down. Please try again later.");
        }
        return false;
    }
    return await response.json();
};

// Main registration function
const sendRegistrationInformation = async (username, password, token) => {
    try {
        const response = await fetch(`${config.baseURL}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password, token }),
        });

        const data = await handleApiResponse(response);

        if (data) {
            // Handle valid response data
            if (data.status === true) {
                popup("Success", data.message || "Registration successful! You can now login.");
                return true; // Successful registration
            } else if (data.status === false) {
                popup(data.title || "Registration Failed", data.message);
                return false;
            } else {
                popup("Error", "Registration failed. Server returned unexpected data.");
                return false;
            }
        }
        return false;
    } catch (error) {
        popup("Error", "An unexpected error occurred. Please try again.");
        return false;
    }
};

export default sendRegistrationInformation;
export { sendRegistrationInformation };
