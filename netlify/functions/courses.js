// netlify/functions/courses.js
const { getStore } = require('@netlify/blobs');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  const store = getStore({
    name: 'courses',
    consistency: 'strong',
    siteID: context.site?.id,
    token: context.token,
  });

  // ── GET ──────────────────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const raw = await store.get('all');
      const courses = raw ? JSON.parse(raw) : null;
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses }),
      };
    } catch (err) {
      console.error('courses GET error:', err.message);
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: null }),
      };
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    try {
      let body;
      try { body = JSON.parse(event.body); } catch(e) { throw new Error('Invalid request body'); }

      const { courses } = body;
      if (!Array.isArray(courses)) throw new Error('Invalid data: expected array');

      await store.set('all', JSON.stringify(courses));

      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, saved: courses.length }),
      };
    } catch (err) {
      console.error('courses POST error:', err.message);
      return {
        statusCode: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return { statusCode: 405, headers: cors, body: 'Method not allowed' };
};
