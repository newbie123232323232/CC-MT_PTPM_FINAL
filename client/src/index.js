import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';
import { AuthContextProvider } from './authContext/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { NotificationStreamProvider } from './contexts/NotificationStreamContext';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function AppTree() {
  const tree = (
    <AuthContextProvider>
      <ProfileProvider>
        <NotificationStreamProvider>
          <App />
        </NotificationStreamProvider>
      </ProfileProvider>
    </AuthContextProvider>
  );
  if (!googleClientId) return tree;
  return (
    <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppTree />
  </React.StrictMode>
);

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      `${process.env.PUBLIC_URL || ''}/sw.js`
    );
  });
}
