// Shared Upstash helper — no npm packages needed, just fetch
const URL   = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

export async function dbGet(key) {
  const r = await fetch(`${URL}/get/${encodeURIComponent(key)}`, { headers });
  const j = await r.json();
  if (j.result === null || j.result === undefined) return null;
  try { return JSON.parse(j.result); } catch { return j.result; }
}

export async function dbSet(key, value) {
  const r = await fetch(`${URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST', headers,
    body: JSON.stringify(JSON.stringify(value)),
  });
  return r.ok;
}

export async function dbSetex(key, ttlSeconds, value) {
  const r = await fetch(`${URL}/setex/${encodeURIComponent(key)}/${ttlSeconds}`, {
    method: 'POST', headers,
    body: JSON.stringify(String(value)),
  });
  return r.ok;
}

export async function dbDel(key) {
  await fetch(`${URL}/del/${encodeURIComponent(key)}`, { method: 'POST', headers });
}
