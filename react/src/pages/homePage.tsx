// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../styles/pagesCSS/HomePage.css';
import { DEMO, bootstrapDemoSession } from '../demoMode';


/*eslint-disable*/
function parseJwt (token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

interface UserInfo {
  given_name?: string;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(()=>{ if (DEMO) bootstrapDemoSession(); },[]);
  
  useEffect(() => {
    if (!sessionStorage.getItem('idToken') || !sessionStorage.getItem('accessToken')) {
      navigate('/login');
    } else {
      try {
        const idToken = parseJwt(sessionStorage.idToken.toString());
        const accessToken = parseJwt(sessionStorage.accessToken.toString());
        setUserInfo({ given_name: idToken.given_name });
        
        // Console logs for development (as in original)
        console.log("Amazon Cognito ID token encoded: " + sessionStorage.idToken.toString());
        console.log("Amazon Cognito ID token decoded: ", idToken);
        console.log("Amazon Cognito access token encoded: " + sessionStorage.accessToken.toString());
        console.log("Amazon Cognito access token decoded: ", accessToken);
        console.log("Amazon Cognito refresh token: ", sessionStorage.refreshToken);
        console.log("Amazon Cognito example application. Not for use in production applications.");
        
      } catch (error) {
        console.error('Error parsing tokens:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="home-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Welcome Header */}
      <div className="welcome-header fade-in">
        <div className="welcome-content">
          <h1 className="welcome-title">
            🐦 Welcome to BirdTag
          </h1>
          <p className="welcome-subtitle">
            Your AI-Powered Bird Media Management System
          </p>
          <div className="user-greeting">
            👋 {getGreeting()}, {userInfo.given_name || 'User'}!
          </div>
          <p className="welcome-description">
            Use the navigation menu above to access all BirdTag features. 
            Get started by uploading your bird media files!
          </p>
        </div>
      </div>

      {/* Status massage and notification */}
      <div className="system-status fade-in">
        <div className="status-content">
          <h2>🔐 System Ready</h2>
          <p className="status-description">
            You are successfully authenticated and ready to use all BirdTag features.
            Use the buttons below to start interacting with the system.
          </p>
          
          {/* keep original actions*/}
          <div className="original-actions">
            <button className="action-btn" onClick={() => navigate('/upload')}>
              📤 Upload Media
            </button>
            <button className="action-btn" onClick={() => navigate('/search')}>
              🔍 Search Media
            </button>
            <button className="action-btn" onClick={() => navigate('/tags')}>
              🏷️ Manage Tags
            </button>
          </div>

          <div className="logout-section">
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;