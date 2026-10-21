const CONFIG = JSON.parse(document.getElementById('site-config').textContent);
const T = CONFIG.text;
const LANG = CONFIG.lang;

document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu
const toggle = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');
const closeMenu = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = T.menu; };
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? T.close : T.menu;
});
nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });

// Treatment tabs (home pages only)
const tabs = [...document.querySelectorAll('.tab')];
const panelIds = tabs.map(t => t.getAttribute('aria-controls'));
function selectTab(id, focus) {
  tabs.forEach(t => {
    const on = t.getAttribute('aria-controls') === id;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
  });
  panelIds.forEach(p => { document.getElementById(p).hidden = p !== id; });
}
if (tabs.length) {
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t.getAttribute('aria-controls')));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) selectTab(panelIds[(i + d + tabs.length) % tabs.length], true);
    });
  });
  // Links to a treatment open its tab, then scroll to the section
  document.querySelectorAll('a[href*="#"]').forEach(a => {
    const id = a.hash.slice(1);
    if (!panelIds.includes(id) || a.pathname !== location.pathname) return;
    a.addEventListener('click', e => {
      e.preventDefault();
      selectTab(id);
      document.getElementById('angebote').scrollIntoView();
    });
  });
  const start = location.hash.slice(1);
  selectTab(panelIds.includes(start) ? start : panelIds[0]);
}

// Wave dates: past dates hide themselves
const waveList = document.getElementById('wave-list');
if (waveList) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const fmt = new Intl.DateTimeFormat(T.locale, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  waveList.innerHTML = CONFIG.waves.map((w, wi) => {
    const upcoming = w.dates.filter(d => new Date(d.date + 'T00:00') >= today);
    const chips = upcoming.length
      ? upcoming.map((d, di) => {
          const id = `wave-${wi}-${di}`;
          const label = `${fmt.format(new Date(d.date + 'T00:00'))}`;
          return `<div class="date"><input type="checkbox" id="${id}" name="dates" value="${esc(`${w.title[LANG]}: ${label}, ${d.time}${T.timeSuffix}`)}">
            <label for="${id}"><strong>${esc(label)}</strong><small>${esc(d.time + T.timeSuffix)}</small></label></div>`;
        }).join('')
      : `<p class="no-dates">${esc(T.noDates)}</p>`;
    return `<fieldset class="wave"><legend><strong>${esc(w.title[LANG])}</strong><span>${esc(w.info[LANG])}</span></legend><div class="dates">${chips}</div></fieldset>`;
  }).join('');
  document.getElementById('budget-options').innerHTML = CONFIG.budget.map((b, i) =>
    `<span><input type="radio" id="budget-${i}" name="budget" value="${esc(b[LANG])}"${i === 0 ? ' checked' : ''}><label for="budget-${i}">${esc(b[LANG])}</label></span>`
  ).join('');
}

// Spam protection: Cloudflare Turnstile loads only once someone starts filling in a form
let turnstileReady;
function loadTurnstile() {
  turnstileReady ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return turnstileReady;
}
async function ensureCaptcha(form) {
  if (form.dataset.widget) return form.dataset.widget;
  const turnstile = await loadTurnstile();
  form.dataset.widget = turnstile.render(form.querySelector('[data-captcha]'), { sitekey: CONFIG.sitekey, language: LANG });
  return form.dataset.widget;
}

function setStatus(form, state, text) {
  const el = form.querySelector('[data-status]');
  el.hidden = !text;
  el.dataset.state = state;
  el.textContent = text || '';
}

function validate(form) {
  let ok = true;
  form.querySelectorAll('input[required], textarea[required]').forEach(f => {
    const valid = f.checkValidity() && f.value.trim() !== '';
    f.setAttribute('aria-invalid', String(!valid));
    if (!valid) ok = false;
  });
  if (form.dataset.form === 'signup' && !form.querySelector('input[name="dates"]:checked')) ok = false;
  form.querySelector('[data-error]').hidden = ok;
  if (!ok) form.querySelector('[aria-invalid="true"]')?.focus();
  return ok;
}

function payload(form) {
  const data = new FormData(form);
  const body = { type: form.dataset.form, lang: LANG, website: data.get('website') || '' };
  for (const [key, value] of data) {
    if (key === 'website' || key === 'cf-turnstile-response') continue;
    if (key === 'dates') (body.dates ??= []).push(value);
    else body[key] = String(value).trim();
  }
  return body;
}

document.querySelectorAll('form[data-form]').forEach(form => {
  if (CONFIG.endpoint) form.addEventListener('focusin', () => ensureCaptcha(form).catch(() => {}), { once: true });
  const button = form.querySelector('button[type="submit"]');
  const done = document.getElementById(form.dataset.form === 'signup' ? 'wave-done' : 'form-done');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus(form, '', '');
    if (!validate(form)) return;
    if (!CONFIG.endpoint) { setStatus(form, 'error', T.offline); return; }

    button.disabled = true;
    setStatus(form, 'sending', T.sending);
    let widget;
    try {
      widget = await ensureCaptcha(form);
      const body = payload(form);
      body.token = window.turnstile.getResponse(widget) || '';
      const res = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || res.status);
      form.hidden = true;
      done.hidden = false;
    } catch {
      setStatus(form, 'error', T.failed);
      if (widget) window.turnstile.reset(widget);
    } finally {
      button.disabled = false;
    }
  });
});
