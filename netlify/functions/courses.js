const OWNER = 'owysswerkin';
const REPO  = 'Instructional';
const FILE  = 'courses.json';
const API   = 'https://api.github.com';

const headers = () => ({
  'Authorization': `token ${process.env.COURSES_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  'User-Agent': 'NextLabs-Academy',
});

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  // ── GET: read courses.json from GitHub ──────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${FILE}`, {
        headers: headers(),
      });

      if (res.status === 404) {
        // File doesn't exist yet — return empty
        return {
          statusCode: 200,
          headers: { ...cors, 'Content-Type': 'application/json' },
          body: JSON.stringify({ courses: null, sha: null }),
        };
      }

      if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);

      const data = await res.json();
      const courses = JSON.parse(
        Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8')
      );

      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses, sha: data.sha }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: cors,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── POST: write courses.json to GitHub ───────────────────────────────────
  if (event.httpMethod === 'POST') {
    try {
      const { courses, sha } = JSON.parse(event.body);
      const content = Buffer.from(JSON.stringify(courses, null, 2)).toString('base64');

      const body = {
        message: `Update courses ${new Date().toISOString()}`,
        content,
        ...(sha ? { sha } : {}),
      };

      const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${FILE}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`GitHub PUT failed: ${res.status} — ${errData.message}`);
      }

      const data = await res.json();
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: data.content.sha }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: cors,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return { statusCode: 405, headers: cors, body: 'Method not allowed' };
};
