import { kv } from '@vercel/kv';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_USERS = [
  { email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' },
];

export default async function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const email = (req.body?.email || '').toLowerCase().trim();
    const code  = (req.body?.code  || '').trim();
    if (!email || !code) throw new Error('Email and code required');

    // Get stored OTP
    const stored = await kv.get(`otp:${email}`);
    if (!stored) {
      return res.status(400).json({ error: 'No code found. Please request a new one.' });
    }

    // Check match (kv.setex stores as string)
    if (String(stored) !== String(code)) {
      return res.status(400).json({ error: 'Incorrect code. Please try again.' });
    }

    // Valid — delete immediately (one-time use)
    await kv.del(`otp:${email}`);

    // Return user profile
    const users = await kv.get('users') || DEFAULT_USERS;
    const user = users.find(u => u.email.toLowerCase() === email);
    if (!user) return res.status(403).json({ error: 'User not found.' });

    return res.status(200).json({ user });

  } catch (e) {
    console.error('verify-code:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
