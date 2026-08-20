import { NextResponse } from 'next/server';
import site from '@/data/site.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sends a project enquiry to Seemol's inbox.
 *
 * Delivery uses Resend's REST API directly — no SDK dependency to keep in sync.
 * If RESEND_API_KEY isn't configured the route reports `configured: false` and
 * the client falls back to opening the visitor's mail app, so the form is never
 * a dead end.
 */

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>';
const TO = process.env.CONTACT_TO_EMAIL || site.profile.email;

// Very small in-memory limiter. Enough to blunt casual spam; it resets on cold
// start, which is fine for a portfolio contact form.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot: real people never fill a hidden field.
  if (clean(payload.company, 100)) {
    return NextResponse.json({ ok: true, delivered: true });
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 200);
  const subject = clean(payload.subject, 180);
  const message = clean(payload.message, 6000);

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'Enter your name.';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (subject.length < 3) errors.subject = 'Enter a subject.';
  if (message.length < 20) errors.message = 'Add a bit more detail — at least 20 characters.';

  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many messages sent. Try again in an hour, or email directly.' },
      { status: 429 },
    );
  }

  if (!KEY) {
    // Not an error — the client will open the visitor's mail app instead.
    return NextResponse.json({ ok: true, configured: false, delivered: false });
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#14121f">
      <h2 style="margin:0 0 4px;font-size:18px">New enquiry from wpseemol.site</h2>
      <p style="margin:0 0 18px;color:#5c5578;font-size:13px">${esc(subject)}</p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 14px 4px 0;color:#5c5578">Name</td><td><strong>${esc(name)}</strong></td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#5c5578">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      </table>
      <hr style="margin:18px 0;border:none;border-top:1px solid #e6e3f0" />
      <p style="white-space:pre-wrap;font-size:14px;margin:0">${esc(message)}</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `[Portfolio] ${subject}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Resend rejected the message:', res.status, detail);
      return NextResponse.json(
        { ok: false, error: "Couldn't send that. Email me directly and it'll get through." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, configured: true, delivered: true });
  } catch (err) {
    console.error('Contact route failed:', err);
    return NextResponse.json(
      { ok: false, error: "Couldn't send that. Email me directly and it'll get through." },
      { status: 502 },
    );
  }
}
