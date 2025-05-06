import React, { useState, useEffect } from 'react';
import './index.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import validateAndFetchUser from './API/validateAndFetchUser';
import LoginBoard from './sites/Login/login';
import Dashboard from './sites/Dashboard/dashboard';
import Loading from './sites/ModularComponents/spinner';

function App() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    console.debug("App component rendered");
    useEffect(() => {
        async function checkUser() {
            const user = await validateAndFetchUser();
            if (user) {
                setUserInfo(user);
            }
            setLoading(false);
        }
        checkUser();
    }, []);

    if (loading) {
        return (
            <div>
                <Loading />
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route 
                    path="/" 
                    element={<Navigate to={userInfo ? "/dashboard" : "/login"} replace />} 
                />
                <Route 
                    path="/login" 
                    element={userInfo ? <Navigate to="/dashboard" replace /> : <LoginBoard setUserInfo={setUserInfo} />} 
                />
                <Route 
                    path="/dashboard" 
                    element={userInfo ? <Dashboard userInfo={userInfo} /> : <Navigate to="/login" replace />} 
                />
            </Routes>
        </Router>
    );
}

export default App;
