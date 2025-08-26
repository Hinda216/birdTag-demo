// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmSignUp } from '../authService';
import { DEMO } from '../demoMode';

const ConfirmUserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line
  const [email, setEmail] = useState(location.state?.email || '');
  const [username] = useState(location.state?.username || '');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (DEMO) {
    alert("Account confirmed (demo). Sign in on next page.");
    navigate('/login');
    return;
  }
    try {
      await confirmSignUp(username, confirmationCode);
      alert("Account confirmed successfully!\nSign in on next page.");
      navigate('/login');
    } catch (error) {
      setErrorMessage(`Failed to confirm account: ${String(error)}`);
    }
  };

return (
  <div className="loginForm">
    <h2>Confirm Account</h2>
    {errorMessage && (
      <div style={{ color: 'red', marginBottom: '10px' }}>
        {errorMessage}
      </div>
    )}
    <form onSubmit={handleSubmit}>
      <div>
        <input
          className="inputText"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
      </div>
      <div>
        <input
          className="inputText"
          type="text"
          value={confirmationCode}
          onChange={(e) => setConfirmationCode(e.target.value)}
          placeholder="Confirmation Code"
          required />
      </div>
      <button type="submit">Confirm Account</button>
    </form>
  </div>
);

};

export default ConfirmUserPage;
