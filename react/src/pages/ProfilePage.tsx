// pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pagesCSS/ProfilePage.css';
import { DEMO, bootstrapDemoSession } from '../demoMode';

interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  sub: string; // Cognito user ID
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // JWT token parse function
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return null;
    }
  };

  useEffect(() => { if (DEMO) bootstrapDemoSession(); }, []);

  useEffect(() => {
    const loadUserInfo = () => {
      try {
        const idToken = sessionStorage.getItem('idToken');
        if (idToken) {
          const tokenData = parseJwt(idToken);
          if (tokenData) {
            setUserInfo({
              email: tokenData.email || 'No email available',
              firstName: tokenData.given_name || 'Unknown',
              lastName: tokenData.family_name || 'User',
              sub: tokenData.sub || 'Unknown ID'
            });
          } else {
            throw new Error('Invalid token');
          }
        } else {
          throw new Error('No token found');
        }
      } catch (error) {
        console.error('Error loading user info:', error);
        // if can't get token, reload to login page
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [navigate]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      sessionStorage.clear();
      navigate('/login');
    }
  };

  const handleRefreshInfo = () => {
    setLoading(true);
    // reload user message
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="page-container">
        <div className="error-message">
          <h3>Unable to load profile</h3>
          <p>Please try logging in again.</p>
          <button onClick={() => navigate('/login')} className="retry-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page head */}
      <div className="profile-header">
        <h1>👤 User Profile</h1>
        <p>View your account information and authentication status for the BirdTag system.</p>
      </div>

      {/* account information card */}
      <div className="user-info-section">
        <h2>📋 Account Information</h2>
        <div className="user-card">
          <div className="user-avatar">
            <div className="avatar-placeholder">
              {userInfo.firstName.charAt(0)}{userInfo.lastName.charAt(0)}
            </div>
          </div>
          
          <div className="user-details">
            <div className="user-name">
              <h3>{userInfo.firstName} {userInfo.lastName}</h3>
              <span className="user-status">
                <span className="status-indicator active"></span>
                Active User
              </span>
            </div>
            
            <div className="user-info-grid">
              <div className="info-item">
                <strong>Email Address:</strong>
                <span>{userInfo.email}</span>
              </div>
              <div className="info-item">
                <strong>First Name:</strong>
                <span>{userInfo.firstName}</span>
              </div>
              <div className="info-item">
                <strong>Last Name:</strong>
                <span>{userInfo.lastName}</span>
              </div>
              <div className="info-item">
                <strong>User ID:</strong>
                <span className="user-id">{userInfo.sub}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Status */}
      <div className="auth-status-section">
        <h2>🔐 Authentication Status</h2>
        <p>Your current session and authentication token status with AWS Cognito.</p>
        
        <div className="auth-tokens">
          <div className="token-item">
            <div className="token-header">
              <span className="token-name">Access Token</span>
              <span className={`token-status ${sessionStorage.getItem('idToken') ? 'valid' : 'invalid'}`}>
                {sessionStorage.getItem('idToken') ? '✅ Valid' : '❌ Missing'}
              </span>
            </div>
            <p className="token-description">
              Used for API access to upload files, search, and manage data.
            </p>
          </div>

          <div className="token-item">
            <div className="token-header">
              <span className="token-name">ID Token</span>
              <span className={`token-status ${sessionStorage.getItem('idToken') ? 'valid' : 'invalid'}`}>
                {sessionStorage.getItem('idToken') ? '✅ Valid' : '❌ Missing'}
              </span>
            </div>
            <p className="token-description">
              Contains your user identity information from AWS Cognito.
            </p>
          </div>

          <div className="token-item">
            <div className="token-header">
              <span className="token-name">Refresh Token</span>
              <span className={`token-status ${sessionStorage.getItem('refreshToken') ? 'valid' : 'invalid'}`}>
                {sessionStorage.getItem('refreshToken') ? '✅ Valid' : '❌ Missing'}
              </span>
            </div>
            <p className="token-description">
              Used to automatically refresh your session when needed.
            </p>
          </div>
        </div>
      </div>

      {/* system use notification */}
      <div className="usage-tips-section">
        <h2>💡 Getting Started with BirdTag</h2>
        <p className="tips-intro">
          Use the navigation menu above to access these features. Here's what each page does:
        </p>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">📤</span>
            <h4>Upload</h4>
            <p>Upload images, videos, and audio files containing bird content for automatic AI tagging.</p>
            <div className="nav-hint">Click "Upload" in the menu</div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔍</span>
            <h4>Search & Manage</h4>
            <p>Find your bird media files using tags, species, URLs, or file uploads, then manage them with bulk operations directly from the search results. View thumbnails, select multiple files, and delete, download, or copy URLs in one click.</p>
            <div className="nav-hint">Click "Search & Manage" in the menu</div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🏷️</span>
            <h4>Tags</h4>
            <p>Add or remove manual tags to supplement AI-detected bird species in your files.</p>
            <div className="nav-hint">Click "Tags" in the menu</div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔔</span>
            <h4>Notifications</h4>
            <p>Set up email alerts when new files containing your favorite bird species are uploaded.</p>
            <div className="nav-hint">Click "Notifications" in the menu</div>
          </div>
        </div>
      </div>

      {/* account action */}
      <div className="account-actions-section">
        <h2>⚙️ Account Actions</h2>
        <div className="action-buttons">
          <button 
            onClick={handleRefreshInfo}
            className="action-btn refresh-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh Information
              </>
            )}
          </button>
          
          <button 
            onClick={handleLogout}
            className="action-btn logout-btn"
          >
            🚪 Logout
          </button>
        </div>
        
        <div className="action-note">
          <p>
            <strong>Note:</strong> Account information is managed through AWS Cognito. 
            Use the navigation menu above to access all BirdTag features.
          </p>
        </div>
      </div>

      {/* system information */}
      <div className="system-info-section">
        <h2>ℹ️ System Information</h2>
        <div className="system-details">
          <div className="system-item">
            <strong>Authentication:</strong>
            <span>AWS Cognito User Pool</span>
          </div>
          <div className="system-item">
            <strong>Storage:</strong>
            <span>AWS S3 with automatic thumbnails</span>
          </div>
          <div className="system-item">
            <strong>AI Tagging:</strong>
            <span>Automatic bird species detection</span>
          </div>
          <div className="system-item">
            <strong>Notifications:</strong>
            <span>AWS SNS email alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;