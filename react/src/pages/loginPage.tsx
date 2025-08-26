// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../authService';
import { DEMO, bootstrapDemoSession } from '../demoMode';


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (DEMO) { bootstrapDemoSession(); navigate('/home'); return; }
    try {
      const session = await signIn(email, password);
      console.log('Sign in successful', session);
      if (session && typeof session.IdToken !== 'undefined') {
        sessionStorage.setItem('idToken', session.IdToken);
        if (sessionStorage.getItem('idToken')) {
          window.location.href = '/dev#/home';
        } else {
          console.error('Session token was not set properly.');
          setErrorMessage('Session token was not set properly.');
        }
      } else {
        console.error('SignIn session or IdToken is undefined.');
        setErrorMessage('SignIn session or IdToken is undefined.');
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      setErrorMessage(`Sign in failed: ${String(error)}`);
    }
  };

  const handleSignUp = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    try {
      const result = await signUp(email, password, firstName, lastName);
      navigate('/confirm', { state: { email: email,
        username: result.generatedUsername  } });
    } catch (error) {
      console.error("Sign up failed:", error);
      setErrorMessage(`Sign up failed: ${String(error)}`);
    }
  };

  return (
    <div className="loginForm">
      <h1>Welcome</h1>
      <h4>{isSignUp ? 'Sign up to create an account' : 'Sign in to your account'}</h4>
      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {errorMessage}
        </div>
      )}
      <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
        {isSignUp && (
          <>
            <div>
              <input
                className="inputText"
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
              />
            </div>
            <div>
              <input
                className="inputText"
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
              />
            </div>
          </>
        )}
        <div>
          <input
            className="inputText"
            id="email"
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
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        {isSignUp && (
          <div>
            <input
              className="inputText"
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
          </div>
        )}
        <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
};

export default LoginPage;
