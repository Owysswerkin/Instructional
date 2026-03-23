// netlify/functions/users.js
// CRUD for user management — admin only operations handled client-side by role check

const { getStore } = require('@netlify/blobs');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const DEFAULT_USERS = [
  { email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' },
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  const store = getStore({ name: 'users', consistency: 'strong' });

  // ── GET: fetch all users ─────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const users = await store.get('all', { type: 'json' }).catch(() => null) || DEFAULT_USERS;
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  // ── POST: save all users ─────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    try {
      const { users } = JSON.parse(event.body);
      if (!Array.isArray(users)) throw new Error('Invalid data');

      // Always ensure rustin.neo@gmail.com stays as admin
      const hasRustin = users.some(u => u.email.toLowerCase() === 'rustin.neo@gmail.com');
      if (!hasRustin) users.unshift({ email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' });

      await store.setJSON('all', users);
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers: cors, body: 'Method not allowed' };
};
