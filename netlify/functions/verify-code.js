// netlify/functions/verify-code.js
const { getStore } = require('@netlify/blobs');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_USERS = [
  { email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' },
];

async function getUsers(context) {
  try {
    const store = getStore({ name: 'users', consistency: 'strong', siteID: context.site?.id, token: context.token });
    const raw = await store.get('all');
    if (!raw) return DEFAULT_USERS;
    return JSON.parse(raw);
  } catch (e) {
    console.log('getUsers fallback:', e.message);
    return DEFAULT_USERS;
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method not allowed' };

  try {
    let body;
    try { body = JSON.parse(event.body); } catch(e) { throw new Error('Invalid request body'); }

    const email = (body.email || '').toLowerCase().trim();
    const code  = (body.code  || '').trim();

    if (!email || !code) throw new Error('Email and code are required');

    // Fetch stored OTP
    const otpStore = getStore({ name: 'otps', consistency: 'strong', siteID: context.site?.id, token: context.token });

    let stored;
    try {
      const raw = await otpStore.get(`otp:${email}`);
      if (!raw) {
        return {
          statusCode: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'No code found. Please request a new one.' }),
        };
      }
      stored = JSON.parse(raw);
    } catch(e) {
      return {
        statusCode: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No code found. Please request a new one.' }),
      };
    }

    // Check expiry
    if (Date.now() > stored.expires) {
      await otpStore.delete(`otp:${email}`).catch(() => {});
      return {
        statusCode: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Code has expired. Please request a new one.' }),
      };
    }

    // Check code matches
    if (stored.code !== code) {
      return {
        statusCode: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Incorrect code. Please try again.' }),
      };
    }

    // Valid — delete OTP (one-time use)
    await otpStore.delete(`otp:${email}`).catch(() => {});

    // Return user profile
    const users = await getUsers(context);
    const user = users.find(u => u.email.toLowerCase() === email);

    if (!user) {
      return {
        statusCode: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    };

  } catch (err) {
    console.error('verify-code error:', err.message);
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
