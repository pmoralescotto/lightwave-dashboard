import { OAUTH_CONFIG } from '../config/oauth';

export const storeAccessToken = (token) => {
  if (!token) return;
  localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
};

export const getAccessToken = () => {
  try {
    return localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
};

export const clearAccessToken = () => {
  localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO);
  localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.ACCOUNT_ID);
};

export const storeUserInfo = (userInfo) => {
  localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
};

export const getUserInfo = () => {
  try {
    const data = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!getAccessToken();

export const validateToken = async (token) => {
  if (!token) return false;
  try {
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ query: 'query { me { id name email } }' }),
    });
    const result = await response.json();
    if (result.data?.me) {
      storeUserInfo(result.data.me);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
