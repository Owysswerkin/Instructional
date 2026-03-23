// netlify/functions/verify-code.js
// Verifies OTP, returns user profile if valid

const { getStore } = require('@netlify/blobs');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method not allowed' };

  try {
    const { email, code } = JSON.parse(event.body);
    const normalEmail = email.toLowerCase().trim();

    // ── Fetch stored OTP ────────────────────────────────────────────────────
    const otpStore = getStore({ name: 'otps', consistency: 'strong' });
    const stored = await otpStore.get(`otp:${normalEmail}`, { type: 'json' }).catch(() => null);

    if (!stored) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'No code found. Please request a new one.' }) };
    }
    if (Date.now() > stored.expires) {
      await otpStore.delete(`otp:${normalEmail}`);
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Code expired. Please request a new one.' }) };
    }
    if (stored.code !== code.trim()) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Incorrect code. Please try again.' }) };
    }

    // ── Code valid — delete it (one-time use) ───────────────────────────────
    await otpStore.delete(`otp:${normalEmail}`);

    // ── Return user profile ─────────────────────────────────────────────────
    const userStore = getStore({ name: 'users', consistency: 'strong' });
    const users = await userStore.get('all', { type: 'json' }).catch(() => null) || getDefaultUsers();
    const user = users.find(u => u.email.toLowerCase() === normalEmail);

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ user }),
    };
  } catch (err) {
    console.error('verify-code error:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};

function getDefaultUsers() {
  return [
    { email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' },
  ];
}
