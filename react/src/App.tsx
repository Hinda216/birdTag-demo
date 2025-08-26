// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/loginPage';
import HomePage from './pages/homePage';
import ConfirmUserPage from './pages/confirmUserPage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import TagsPage from './pages/TagsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/layout';
import './styles/core.css';
import './styles/component.css';
import './styles/auth.css';
import { DEMO } from './demoMode'

const App = () => {
  const isAuthenticated = () => {
    if (DEMO) return true;
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
  };

  // Protected routing components
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? (
      <Layout>{children}</Layout>
    ) : (
      <HashRouter>
        <Navigate replace to="/login" />
      </HashRouter>
    );
  };

  // Public routing components (for landing pages, etc.)
  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? (
      <HashRouter>
        <Navigate replace to="/home" />
      </HashRouter>
    ) : (
      <>{children}</>
    );
  };

  return (
    <HashRouter>
      <Routes>
        {/* Root path redirection */}
        <Route
          path="/"
          element={<Navigate replace to={isAuthenticated() ? "/home" : "/login"} />}
        />

        {/* Public routes accessible to unauthenticated users */}
        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route
          path="/confirm"
          element={<PublicRoute><ConfirmUserPage /></PublicRoute>}
        />

        {/* Protected routes require authentication */}
        <Route
          path="/home"
          element={<ProtectedRoute><HomePage /></ProtectedRoute>}
        />
        <Route
          path="/upload"
          element={<ProtectedRoute><UploadPage /></ProtectedRoute>}
        />
        <Route
          path="/search"
          element={<ProtectedRoute><SearchPage /></ProtectedRoute>}
        />
        <Route
          path="/results"
          element={<ProtectedRoute><ResultsPage /></ProtectedRoute>}
        />
        <Route
          path="/tags"
          element={<ProtectedRoute><TagsPage /></ProtectedRoute>}
        />
        <Route
          path="/notifications"
          element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />

        {/* 404 Page not found 404 Page not found */}
        <Route
          path="*"
          element={<Navigate replace to={isAuthenticated() ? "/home" : "/login"} />}
        />
      </Routes>
    </HashRouter>
  );
};

export default App;