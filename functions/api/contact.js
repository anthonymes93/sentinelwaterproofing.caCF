const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.CONTACT_FROM_EMAIL || !env.CONTACT_TO_EMAIL) {
    return json({ error: 'Contact form is not configured yet.' }, 503);
  }
  if (Number(request.headers.get('content-length') || 0) > 12000) return json({ error: 'Request too large.' }, 413);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const phone = String(data.phone || '').trim();
  const message = String(data.message || '').trim();
  const token = String(data.turnstileToken || '');
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || phone.length > 50 || !message || message.length > 5000 || !token) {
    return json({ error: 'Please complete the required fields and verification.' }, 400);
  }
  const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get('CF-Connecting-IP') || undefined })
  });
  if (!verification.ok) return json({ error: 'Verification is temporarily unavailable.' }, 502);
  const verdict = await verification.json();
  if (!verdict.success) return json({ error: 'Verification failed. Please try again.' }, 403);
  const html = '<h2>New Sentinel Waterproofing inquiry</h2>' +
    '<p><strong>Name:</strong> ' + escapeHtml(name) + '</p>' +
    '<p><strong>Email:</strong> ' + escapeHtml(email) + '</p>' +
    '<p><strong>Phone:</strong> ' + escapeHtml(phone || 'Not provided') + '</p>' +
    '<p><strong>Message:</strong></p><p style="white-space:pre-wrap">' + escapeHtml(message) + '</p>';
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: 'Sentinel Waterproofing — New contact inquiry',
      html
    })
  });
  if (!sent.ok) {
    console.error('Resend failed', sent.status, (await sent.text()).slice(0, 500));
    return json({ error: 'Could not send your message. Please try again later.' }, 502);
  }
  return json({ ok: true });
}
