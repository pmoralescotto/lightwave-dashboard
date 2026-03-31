export const OAUTH_CONFIG = {
  AUTHORIZATION_URL: 'https://auth.monday.com/oauth2/authorize',
  TOKEN_URL: 'https://auth.monday.com/oauth2/token',
  CLIENT_ID: import.meta.env.VITE_MONDAY_CLIENT_ID || '',
  REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI || window.location.origin + '/oauth/callback',
  SCOPES: ['boards:read', 'users:read', 'account:read'].join(' '),
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'monday_access_token',
    USER_INFO: 'monday_user_info',
    ACCOUNT_ID: 'monday_account_id',
  },
};

export const isOAuthConfigured = () => !!(OAUTH_CONFIG.CLIENT_ID && OAUTH_CONFIG.REDIRECT_URI);
