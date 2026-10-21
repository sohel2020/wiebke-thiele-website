# wiebke-thiele.de

Website of Gesundheitspraxis Wiebke Thiele. Static site built with [Eleventy](https://www.11ty.dev/)
from YAML, hosted on GitHub Pages. Forms are sent by a Cloudflare Worker through Brevo.

```
Wiebke edits content/*.yml ──commit──▶ GitHub Action: validate → build → GitHub Pages
Visitor sends form ──▶ Cloudflare Worker (Turnstile + checks) ──▶ Brevo API ──▶ info@wiebke-thiele.de
```

Editing guide for Wiebke (German): [docs/BEARBEITEN.md](docs/BEARBEITEN.md)

## Contact form: what is missing and how to turn it on

**What the Worker does.** The Cloudflare Worker in `worker/` sits between the website and email:
it receives the form, checks it (allowed website, hidden spam field, Turnstile, field lengths),
and sends it via Brevo to info@wiebke-thiele.de. "Reply" goes straight to the visitor.
The Brevo key lives only in Cloudflare, never on the website or in this repo.

**Why the form does not send yet.** `form_endpoint` in `content/site.yml` is empty, because the Worker
is not deployed and Brevo is not set up. Until then the forms ask visitors to call or email.

**To turn it on:**

1. **Brevo** (brevo.com, free): create account, add domain `wiebke-thiele.de` and its DNS records,
   create an API key.
2. **Cloudflare** (free): create account → Turnstile → add site with domains `wiebke-thiele.de`,
   `www.wiebke-thiele.de` and `sohel2020.github.io`. Note the site key and the secret key.
3. **Allow the test address**: in `worker/wrangler.toml` add `https://sohel2020.github.io` to `ALLOWED_ORIGINS`.
4. **Deploy the Worker** (paste secrets only into these prompts):
   ```sh
   cd worker
   npm install
   npx wrangler login
   npx wrangler secret put BREVO_API_KEY
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler deploy          # prints https://wiebke-forms.<sub>.workers.dev
   ```
5. **Connect the site**: in `content/site.yml` set
   `form_endpoint: https://wiebke-forms.<sub>.workers.dev/send` and `turnstile_sitekey: <site key>`, then commit.
6. **Test**: send one message through each form and check the inbox.

Details for every step follow below.

## Structure

| Path | What |
|---|---|
| `content/de.yml`, `content/en.yml` | All texts. Same structure, checked by `scripts/validate.mjs` |
| `content/waves.yml` | 5Rhythms dates. Past dates are hidden in the browser, no rebuild needed |
| `content/site.yml` | Address, phones, email, form endpoint, Turnstile site key, treatment colours |
| `content/legal/*.md` | Impressum and Datenschutz (German only) |
| `src/_includes/` | Nunjucks layout and sections. One template renders `/` (de) and `/en/` |
| `src/assets/` | CSS, JS, self-hosted fonts, images |
| `worker/` | Cloudflare Worker for the forms, with tests |
| `.pages.yml` | Pages CMS form editor for `waves.yml` |

## Local development

```sh
npm install
npm start          # http://localhost:8080, rebuilds on change
npm run build      # validate + build into _site/
npm run validate   # content check only

cd worker && npm install && npm test
```

Node 22 or newer.

## First deployment

### 1. GitHub

1. Create a GitHub account for Wiebke (2FA on) and a **public** repository, e.g. `wiebke-thiele-website`.
   Free GitHub Pages needs a public repo. Everything in it is public on the website anyway.
2. Push this project to `main`.
3. Repo → Settings → Pages → Source: **GitHub Actions**.
4. Repo → Settings → Collaborators: add yourself.
5. The "Website veröffentlichen" action runs. The site is live at `https://<account>.github.io/<repo>/`.

### 2. Forms: Brevo + Turnstile + Worker

**Brevo** (EU email API, free tier 300 emails/day)
1. Create an account, sign the data processing agreement (AVV/DPA) in the account settings.
2. Senders & Domains → add domain `wiebke-thiele.de` → add the shown SPF/DKIM/DMARC DNS records.
3. Add sender `website@wiebke-thiele.de`.
4. SMTP & API → API keys → create a key. Copy it once, it goes only into the Worker (step below).

**Cloudflare Turnstile** (spam protection, free)
1. Cloudflare dashboard → Turnstile → add site, domains `wiebke-thiele.de`, `www.wiebke-thiele.de`
   (and `<account>.github.io` while testing). Mode: Managed.
2. Put the **site key** (public) into `content/site.yml` → `turnstile_sitekey`.
3. Keep the **secret key** for the Worker.

**Worker**
```sh
cd worker
npm install
npx wrangler login
npx wrangler secret put BREVO_API_KEY       # paste the Brevo key
npx wrangler secret put TURNSTILE_SECRET    # paste the Turnstile secret
npx wrangler deploy                         # prints https://wiebke-forms.<sub>.workers.dev
```
Then set `form_endpoint: https://wiebke-forms.<sub>.workers.dev/send` in `content/site.yml`
and check `ALLOWED_ORIGINS` in `worker/wrangler.toml`.

Optional automatic Worker deploys: add repo secrets `CLOUDFLARE_API_TOKEN`
(template "Edit Cloudflare Workers") and `CLOUDFLARE_ACCOUNT_ID`. The "Formular-Worker" action
tests and deploys on changes under `worker/`.

### Where credentials live

| Credential | Stored in | Never in |
|---|---|---|
| Brevo API key | Cloudflare Worker secret `BREVO_API_KEY` | repo, YAML, browser JS |
| Turnstile secret | Cloudflare Worker secret `TURNSTILE_SECRET` | repo |
| Turnstile site key | `content/site.yml` (public by design) | – |
| Cloudflare API token | GitHub → Settings → Secrets → Actions | committed files |
| Account logins | Wiebke's password manager, 2FA everywhere | email, chat |

The browser only knows the Worker URL. The Worker checks origin, honeypot, Turnstile and field
lengths before it calls Brevo. Replies go straight to the visitor (`replyTo`).
Local Worker secrets for `wrangler dev` go into `worker/.dev.vars` (git-ignored).

### 3. Domain

1. Repo → Settings → Pages → Custom domain: `www.wiebke-thiele.de`, then "Enforce HTTPS".
2. DNS at the registrar:
   - `www` CNAME → `<account>.github.io`
   - apex `wiebke-thiele.de` A → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - AAAA → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
3. **Keep the existing MX records**, otherwise the info@ mailbox stops receiving email.
4. Check where the domain is registered before cancelling Squarespace. Cancel only after the new site is live.

### 4. Before going live (content owner)

- **Datenschutz** must be updated by Wiebke (generator or lawyer): hosting on GitHub Pages,
  Cloudflare (Worker, Turnstile), Brevo, Google Maps; remove the Squarespace sections.
  Fonts are self-hosted now, so the Google Fonts section can go.
- **Impressum**: TMG/RStV references are outdated (now § 5 DDG, § 18 MStV); add Heilpraktikerin details.
- Read the English texts once with a native speaker.
- Send one test message through each form.
