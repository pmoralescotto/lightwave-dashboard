/**
 * Netlify function: Monday.com API proxy
 * Keeps the API token secure on the server — no login required for viewers.
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API token not configured' }) };
  }

  try {
    const { query, variables } = JSON.parse(event.body);

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Monday API proxy error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
