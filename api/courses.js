import { kv } from '@vercel/kv';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async function handler(req, res) {
  // CORS
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();

  // GET — load courses
  if (req.method === 'GET') {
    try {
      const courses = await kv.get('courses');
      return res.status(200).json({ courses: courses || null });
    } catch (e) {
      console.error('courses GET:', e.message);
      return res.status(200).json({ courses: null });
    }
  }

  // POST — save courses
  if (req.method === 'POST') {
    try {
      const { courses } = req.body;
      if (!Array.isArray(courses)) throw new Error('Expected array');
      await kv.set('courses', courses);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('courses POST:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
