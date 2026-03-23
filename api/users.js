import { kv } from '@vercel/kv';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const DEFAULT_USERS = [
  { email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' },
];

export default async function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();

  // GET — load users
  if (req.method === 'GET') {
    try {
      const users = await kv.get('users');
      return res.status(200).json({ users: users || DEFAULT_USERS });
    } catch (e) {
      console.error('users GET:', e.message);
      return res.status(200).json({ users: DEFAULT_USERS });
    }
  }

  // POST — save users
  if (req.method === 'POST') {
    try {
      let { users } = req.body;
      if (!Array.isArray(users)) throw new Error('Expected array');
      // Always keep primary admin
      const hasPrimary = users.some(u => u.email.toLowerCase() === 'rustin.neo@gmail.com');
      if (!hasPrimary) users = [DEFAULT_USERS[0], ...users];
      await kv.set('users', users);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('users POST:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
