// netlify/functions/send-code.js
const { getStore } = require('@netlify/blobs');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_USERS = [
  { email: 'rustin.neo@gmail.com', name: 'Rustin', role: 'admin' },
];

async function getUsers(context) {
  try {
    const store = getStore({ name: 'users', consistency: 'strong', siteID: context.site?.id, token: context.token });
    const raw = await store.get('all');
    if (!raw) return DEFAULT_USERS;
    return JSON.parse(raw);
  } catch (e) {
    console.log('getUsers fallback to defaults:', e.message);
    return DEFAULT_USERS;
  }
}

async function storeOtp(email, code, context) {
  const store = getStore({ name: 'otps', consistency: 'strong', siteID: context.site?.id, token: context.token });
  await store.set(`otp:${email}`, JSON.stringify({ code, expires: Date.now() + 10 * 60 * 1000 }));
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method not allowed' };

  try {
    let body;
    try { body = JSON.parse(event.body); } catch(e) { throw new Error('Invalid request body'); }

    const email = (body.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) throw new Error('Invalid email address');

    // Check user exists
    const users = await getUsers(context);
    const user = users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      return {
        statusCode: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'This email is not registered. Please contact your administrator.' }),
      };
    }

    // Generate and store OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await storeOtp(email, code, context);

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Functional Academy <onboarding@resend.dev>',
        to: [email],
        subject: 'Your login code — Functional Academy',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
            <div style="background:#003A7A;width:48px;height:48px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
              <span style="color:#fff;font-size:22px;">🔐</span>
            </div>
            <h1 style="font-size:24px;font-weight:900;color:#003A7A;margin:0 0 8px;">Your login code</h1>
            <p style="font-size:15px;color:#64748B;margin:0 0 32px;">
              Use this code to sign in to <strong>Functional Academy</strong>. It expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:#F8FAFC;border:2px solid #E2E8F0;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
              <span style="font-size:48px;font-weight:900;letter-spacing:12px;color:#003A7A;">${code}</span>
            </div>
            <p style="font-size:13px;color:#94A3B8;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', errText);
      throw new Error('Failed to send email. Please try again.');
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };

  } catch (err) {
    console.error('send-code error:', err.message);
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
