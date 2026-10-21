// Receives the contact and Wave sign-up forms and sends them as email via Brevo.
// Secrets (never in the repo): BREVO_API_KEY, TURNSTILE_SECRET  →  `npx wrangler secret put NAME`
// Settings: MAIL_TO, MAIL_FROM, MAIL_FROM_NAME, ALLOWED_ORIGINS in wrangler.toml

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_BODY = 20_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = {
  contact: { firstName: 80, lastName: 80, email: 200, phone: 50, message: 5000 },
  signup: { name: 120, email: 200, phone: 50, message: 3000, budget: 80 },
};
const REQUIRED = {
  contact: ['firstName', 'lastName', 'email', 'phone', 'message'],
  signup: ['name', 'email', 'phone'],
};
const LABELS = {
  firstName: 'Vorname', lastName: 'Nachname', name: 'Name', email: 'E-Mail', phone: 'Telefon',
  message: 'Nachricht', budget: 'Kosten', dates: 'Termine', lang: 'Sprache der Website',
};

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : null;
}

const json = (body, status, cors) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Returns the cleaned fields, or an error code
export function clean(input) {
  const type = input?.type;
  if (!LIMITS[type]) return { error: 'invalid_type' };
  const out = { type, lang: input.lang === 'en' ? 'en' : 'de' };
  for (const [key, max] of Object.entries(LIMITS[type])) {
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if (value.length > max) return { error: `too_long:${key}` };
    out[key] = value;
  }
  for (const key of REQUIRED[type]) if (!out[key]) return { error: `missing:${key}` };
  if (!EMAIL.test(out.email)) return { error: 'invalid:email' };
  if (type === 'signup') {
    const dates = Array.isArray(input.dates) ? input.dates.filter((d) => typeof d === 'string' && d.length <= 200).slice(0, 20) : [];
    if (!dates.length) return { error: 'missing:dates' };
    out.dates = dates;
  }
  return { data: out };
}

export function buildEmail(data) {
  const fields = data.type === 'contact'
    ? ['firstName', 'lastName', 'email', 'phone', 'message', 'lang']
    : ['name', 'email', 'phone', 'dates', 'budget', 'message', 'lang'];
  const value = (k) => (k === 'dates' ? data.dates.join('\n') : k === 'lang' ? (data.lang === 'en' ? 'Englisch' : 'Deutsch') : data[k]) || '–';
  const who = data.type === 'contact' ? `${data.firstName} ${data.lastName}` : data.name;
  const subject = data.type === 'contact' ? `Neue Nachricht von ${who}` : `Neue Anmeldung Wiebkes Waves: ${who}`;
  const text = fields.map((k) => `${LABELS[k]}:\n${value(k)}`).join('\n\n');
  const rows = fields
    .map((k) => `<tr><th align="left" valign="top" style="padding:6px 16px 6px 0">${LABELS[k]}</th><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value(k))}</td></tr>`)
    .join('');
  const html = `<p>${escapeHtml(subject)} (über wiebke-thiele.de)</p><table style="font-family:sans-serif;font-size:15px">${rows}</table><p style="color:#777">Auf „Antworten“ klicken, um direkt an ${escapeHtml(data.email)} zu schreiben.</p>`;
  return { subject, text, html, replyTo: { email: data.email, name: who } };
}

async function verifyTurnstile(token, ip, env) {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch(TURNSTILE_URL, { method: 'POST', body: form });
  const out = await res.json().catch(() => ({}));
  return out.success === true;
}

async function sendBrevo(mail, env) {
  const res = await fetch(env.BREVO_API_URL || BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM, name: env.MAIL_FROM_NAME || 'Website' },
      to: [{ email: env.MAIL_TO }],
      replyTo: mail.replyTo,
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html,
    }),
  });
  return res.ok;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
    if (new URL(request.url).pathname !== '/send') return json({ ok: false, error: 'not_found' }, 404, cors || {});
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors || {});
    if (!cors) return json({ ok: false, error: 'origin' }, 403, {});

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413, cors);
    let input;
    try { input = JSON.parse(raw); } catch { return json({ ok: false, error: 'invalid_json' }, 400, cors); }

    // Honeypot filled in: pretend success so bots learn nothing
    if (input.website) return json({ ok: true }, 200, cors);

    const { data, error } = clean(input);
    if (error) return json({ ok: false, error }, 400, cors);

    if (!(await verifyTurnstile(input.token, request.headers.get('CF-Connecting-IP'), env)))
      return json({ ok: false, error: 'captcha' }, 403, cors);

    if (!(await sendBrevo(buildEmail(data), env))) return json({ ok: false, error: 'send_failed' }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};
