// Runs the Worker handler in Node with Turnstile and Brevo mocked: `npm test`
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from './src/index.js';

const env = {
  MAIL_TO: 'info@example.org', MAIL_FROM: 'website@example.org', MAIL_FROM_NAME: 'Website',
  ALLOWED_ORIGINS: 'https://www.wiebke-thiele.de', BREVO_API_KEY: 'test-key', TURNSTILE_SECRET: 'test-secret',
};
const ORIGIN = 'https://www.wiebke-thiele.de';
let calls;
let turnstileOk;
let brevoOk;

beforeEach(() => {
  calls = [];
  turnstileOk = true;
  brevoOk = true;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('turnstile')) return Response.json({ success: turnstileOk });
    return new Response(brevoOk ? '{"messageId":"1"}' : '{"code":"unauthorized"}', { status: brevoOk ? 201 : 401 });
  };
});

const post = (body, origin = ORIGIN) => worker.fetch(new Request('https://forms.example/send', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
}), env);

const contact = { type: 'contact', lang: 'de', firstName: 'Anna', lastName: 'Muster', email: 'anna@example.org', phone: '0151 123', message: 'Hallo <b>Wiebke</b>', token: 'tok', website: '' };
const signup = { type: 'signup', lang: 'en', name: 'Bea', email: 'bea@example.org', phone: '0170 1', dates: ['Women’s Wave: Sun, 25/10/2026, 15.00 – 17.00'], budget: '€16 (reduced)', message: '', token: 'tok', website: '' };

test('contact form is sent to Brevo with reply-to and escaped HTML', async () => {
  const res = await post(contact);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const brevo = calls.find((c) => c.url.includes('brevo'));
  assert.equal(brevo.init.headers['api-key'], 'test-key');
  const mail = JSON.parse(brevo.init.body);
  assert.equal(mail.to[0].email, 'info@example.org');
  assert.equal(mail.replyTo.email, 'anna@example.org');
  assert.equal(mail.subject, 'Neue Nachricht von Anna Muster');
  assert.match(mail.htmlContent, /Hallo &lt;b&gt;Wiebke&lt;\/b&gt;/);
  assert.match(mail.textContent, /Hallo <b>Wiebke<\/b>/);
});

test('wave sign-up lists the chosen dates', async () => {
  const res = await post(signup);
  assert.equal(res.status, 200);
  const mail = JSON.parse(calls.find((c) => c.url.includes('brevo')).init.body);
  assert.equal(mail.subject, 'Neue Anmeldung Wiebkes Waves: Bea');
  assert.match(mail.textContent, /Termine:\nWomen’s Wave: Sun, 25\/10\/2026/);
  assert.match(mail.textContent, /Sprache der Website:\nEnglisch/);
});

test('sign-up without dates is rejected before sending', async () => {
  const res = await post({ ...signup, dates: [] });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'missing:dates');
  assert.equal(calls.length, 0);
});

test('missing field and bad email are rejected', async () => {
  assert.equal((await (await post({ ...contact, phone: '' })).json()).error, 'missing:phone');
  assert.equal((await (await post({ ...contact, email: 'nope' })).json()).error, 'invalid:email');
  assert.equal(calls.length, 0);
});

test('honeypot filled: fake success, nothing sent', async () => {
  const res = await post({ ...contact, website: 'http://spam' });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
});

test('failed Turnstile check blocks sending', async () => {
  turnstileOk = false;
  const res = await post(contact);
  assert.equal(res.status, 403);
  assert.equal(calls.filter((c) => c.url.includes('brevo')).length, 0);
});

test('foreign origin is refused', async () => {
  const res = await post(contact, 'https://evil.example');
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});

test('Brevo error is reported to the page', async () => {
  brevoOk = false;
  const res = await post(contact);
  assert.equal(res.status, 502);
  assert.equal((await res.json()).error, 'send_failed');
});

test('CORS preflight answers allowed origin only', async () => {
  const pre = (o) => worker.fetch(new Request('https://forms.example/send', { method: 'OPTIONS', headers: { Origin: o } }), env);
  assert.equal((await pre(ORIGIN)).status, 204);
  assert.equal((await pre('https://evil.example')).status, 403);
});

test('oversized and broken bodies are rejected', async () => {
  assert.equal((await post({ ...contact, message: 'x'.repeat(6000) })).status, 400);
  const res = await worker.fetch(new Request('https://forms.example/send', { method: 'POST', headers: { Origin: ORIGIN }, body: '{oops' }), env);
  assert.equal(res.status, 400);
});
