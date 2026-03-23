// netlify/functions/users.js
const { getStore } = require('@netlify/blobs');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const DEFAULT_USERS = [
  { email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' },
];

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  const store = getStore({
    name: 'users',
    consistency: 'strong',
    siteID: context.site?.id,
    token: context.token,
  });

  // ── GET ──────────────────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const raw = await store.get('all');
      const users = raw ? JSON.parse(raw) : DEFAULT_USERS;
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      };
    } catch (err) {
      console.error('users GET error:', err.message);
      // On any error return defaults so UI never breaks
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: DEFAULT_USERS }),
      };
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    try {
      let body;
      try { body = JSON.parse(event.body); } catch(e) { throw new Error('Invalid request body'); }

      let { users } = body;
      if (!Array.isArray(users)) throw new Error('Invalid data: expected array');

      // Always keep primary admin
      const hasPrimary = users.some(u => u.email.toLowerCase() === 'rustin.neo@gmail.com');
      if (!hasPrimary) users = [DEFAULT_USERS[0], ...users];

      await store.set('all', JSON.stringify(users));

      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    } catch (err) {
      console.error('users POST error:', err.message);
      return {
        statusCode: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return { statusCode: 405, headers: cors, body: 'Method not allowed' };
};
