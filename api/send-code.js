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
    if (!email || !email.includes('@')) throw new Error('Invalid email address');

    // Check user is registered
    const users = await kv.get('users') || DEFAULT_USERS;
    const user = users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      return res.status(403).json({ error: 'This email is not registered. Please contact your administrator.' });
    }

    // Generate 6-digit OTP, expires 10 min
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await kv.setex(`otp:${email}`, 600, code);

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
      const err = await resendRes.text();
      console.error('Resend error:', err);
      throw new Error('Failed to send email. Please try again.');
    }

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error('send-code:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
