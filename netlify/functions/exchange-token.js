/**
 * Netlify serverless function: OAuth token exchange
 * Keeps MONDAY_CLIENT_SECRET secure on the server side.
 * Uses Node.js 18+ native fetch (no node-fetch needed).
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { code, redirectUri } = JSON.parse(event.body);

    if (!code || !redirectUri) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing code or redirectUri' }) };
    }

    const response = await fetch('https://auth.monday.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.VITE_MONDAY_CLIENT_ID,
        client_secret: process.env.MONDAY_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: 'Token exchange failed', details: text }) };
    }

    const data = await response.json();

    if (!data.access_token) {
      return { statusCode: 500, body: JSON.stringify({ error: 'No access token in response' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ access_token: data.access_token }) };
  } catch (err) {
    console.error('Token exchange error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', message: err.message }) };
  }
};
