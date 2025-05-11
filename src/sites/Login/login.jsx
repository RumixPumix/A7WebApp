import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import popup from "../ModularComponents/popup";
import sendLoginInformation from "./loginAPI/loginPOST";
import sendRegistrationInformation from "./loginAPI/registerPOST";
import "./loginPage.css";
import validateAndFetchUser from "../../API/validateAndFetchUser";

function InputField({ type, placeholder, value, onChange, disabled, icon, name }) {
    return (
        <div className="input-group">
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                autoComplete="off"
                name={name}
            />
            <span className="input-icon">{icon}</span>
        </div>
    );
}

function LoginPage({ setUserInfo }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("login");
    const [formData, setFormData] = useState({ username: "", password: "", token: "" });
    const [loading, setLoading] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { username, password, token } = formData;
        const isRegistering = activeTab === "register";

        if (activeTab === "register" && !agreeToTerms) {
            popup("Error", "You must agree to the Terms of Service and Privacy Policy to register.");
            return;
        }

        if (!username.trim() || !password.trim() || (isRegistering && !token.trim())) {
            popup("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            let success = false;
            if (activeTab === "login") {
                success = await sendLoginInformation(username, password);
                if (success) {
                    const user = await validateAndFetchUser(); // fetch fresh user data
                    if (user) setUserInfo(user);               // update App.js state
                    navigate("/dashboard");
                }
            } else {
                success = await sendRegistrationInformation(username, password, token);
                if (success) {
                    popup("Success", "Registration successful. You can now log in.");
                    setFormData({ username: "", password: "", token: "" });
                    setActiveTab("login");
                }
            }
        } catch (error) {
            popup("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-tabs">
                    {["login", "register"].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                            disabled={loading}
                        >
                            {tab === "login" ? "Login" : "Register"}
                        </button>
                    ))}
                </div>

                <div className="auth-content">
                    <h2>{activeTab === "login" ? "Welcome Back" : "Create Account"}</h2>
                    <p>
                        {activeTab === "login"
                            ? "Sign in to access your dashboard"
                            : "Enter your registration token to create an account"}
                    </p>

                    <form onSubmit={handleSubmit}>
                        <InputField
                            type="text"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={loading}
                            icon="👤"
                            name="username"
                        />
                        <InputField
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            icon="🔒"
                            name="password"
                        />
                        {activeTab === "register" && (
                            <InputField
                                type="text"
                                placeholder="Registration Token"
                                value={formData.token}
                                onChange={handleChange}
                                disabled={loading}
                                icon="🔑"
                                name="token"
                            />
                        )}
                        <button type="submit" disabled={loading} className="primary-btn">
                            {loading ? <div className="spinner"></div> : activeTab === "login" ? "Login" : "Register"}
                        </button>
                    </form>
                </div>

                <div className="auth-footer">
                    {activeTab === "register" && (
                        <div className="terms-agreement">
                            <label className="terms-checkbox">
                                <input
                                    type="checkbox"
                                    checked={agreeToTerms}
                                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                                    disabled={loading}
                                />
                                <span className="checkmark"></span>
                                <span className="terms-text">
                                    I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                                </span>
                            </label>
                        </div>
                    )}
                    
                    <p className="footer-text">Need help? <a href="/support" className="footer-link">Contact Support</a></p>
                    <p className="footer-text">
                        {activeTab === "login" ? "Don't have an account? " : "Already have an account? "}
                        <button
                            className="switch-btn"
                            onClick={() => {
                                setActiveTab(activeTab === "login" ? "register" : "login");
                                setAgreeToTerms(false);
                            }}
                            disabled={loading}
                        >
                            {activeTab === "login" ? "Register" : "Login"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
