// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEMO, bootstrapDemoSession } from './demoMode';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/core.css'
import './styles/component.css'
import './styles/auth.css'

if (DEMO) bootstrapDemoSession();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)