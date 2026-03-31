import { useState, useEffect } from 'react';
import { OAUTH_CONFIG, isOAuthConfigured } from '../config/oauth';
import { getAccessToken, storeAccessToken, clearAccessToken, validateToken, getUserInfo } from '../utils/tokenManager';

export const useOAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const isValid = await validateToken(token);
          if (isValid) {
            setIsAuthenticated(true);
            setUserInfo(getUserInfo());
          } else {
            clearAccessToken();
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = () => {
    if (!isOAuthConfigured()) {
      setError('OAuth is not configured. Check environment variables.');
      return;
    }
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.CLIENT_ID,
      redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
      scope: OAUTH_CONFIG.SCOPES,
      response_type: 'code',
    });
    window.location.href = `${OAUTH_CONFIG.AUTHORIZATION_URL}?${params.toString()}`;
  };

  const handleCallback = async (code) => {
    if (!code) return false;
    try {
      setLoading(true);
      setError(null);

      // Exchange code via Netlify serverless function (keeps CLIENT_SECRET server-side)
      const response = await fetch('/.netlify/functions/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: OAUTH_CONFIG.REDIRECT_URI }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.access_token) throw new Error('No access token in response');

      storeAccessToken(data.access_token);
      const isValid = await validateToken(data.access_token);

      if (isValid) {
        setIsAuthenticated(true);
        setUserInfo(getUserInfo());
        return true;
      } else {
        throw new Error('Token validation failed');
      }
    } catch (err) {
      console.error('OAuth callback failed:', err);
      setError(err.message || 'Authentication failed');
      clearAccessToken();
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAccessToken();
    setIsAuthenticated(false);
    setUserInfo(null);
    window.location.href = '/';
  };

  return { isAuthenticated, loading, error, userInfo, login, logout, handleCallback };
};
