// netlify/functions/send-code.js
// Generates a 6-digit OTP, stores it in Netlify Blobs, sends via Resend

const { getStore } = require('@netlify/blobs');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method not allowed' };

  try {
    const { email } = JSON.parse(event.body);
    if (!email || !email.includes('@')) throw new Error('Invalid email');

    const normalEmail = email.toLowerCase().trim();

    // ── Check user is registered ────────────────────────────────────────────
    const userStore = getStore({ name: 'users', consistency: 'strong' });
    const users = await userStore.get('all', { type: 'json' }).catch(() => null) || getDefaultUsers();
    const user = users.find(u => u.email.toLowerCase() === normalEmail);
    if (!user) {
      return {
        statusCode: 403,
        headers: cors,
        body: JSON.stringify({ error: 'Email not registered. Please contact your administrator.' }),
      };
    }

    // ── Generate 6-digit code, expires in 10 minutes ────────────────────────
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 10 * 60 * 1000;

    const otpStore = getStore({ name: 'otps', consistency: 'strong' });
    await otpStore.setJSON(`otp:${normalEmail}`, { code, expires });

    // ── Send email via Resend ───────────────────────────────────────────────
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Functional Academy <onboarding@resend.dev>',
        to: [normalEmail],
        subject: 'Your login code — Functional Academy',
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fff;">
            <div style="background: #003A7A; width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
              <span style="color: #fff; font-size: 22px;">🔐</span>
            </div>
            <h1 style="font-size: 24px; font-weight: 900; color: #003A7A; margin: 0 0 8px;">Your login code</h1>
            <p style="font-size: 15px; color: #64748B; margin: 0 0 32px;">Use this code to sign in to Functional Academy. It expires in <strong>10 minutes</strong>.</p>
            <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
              <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #003A7A;">${code}</span>
            </div>
            <p style="font-size: 13px; color: #94A3B8;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Resend error: ${err.message}`);
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('send-code error:', err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function getDefaultUsers() {
  return [
    { email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' },
  ];
}
