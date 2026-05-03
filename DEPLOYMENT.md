# Deployment Guide — Shared Hosting (Frontend) + Railway (API)

## Architecture

```
Browser → Shared Hosting (Apache)   → serves React SPA (static files)
        → Railway (Node.js)          → Express API  (/api/*)
        → Supabase (PostgreSQL)      → database
        → Clerk                      → authentication (proxied through Railway)
```

---

## Step 1 — Deploy the API to Railway

### 1a. Create the Railway project

1. Go to [railway.app](https://railway.app) and create a new project.
2. Choose **"Deploy from GitHub repo"** and connect this repository.
3. Railway will detect `railway.json` at the root and use it automatically.

### 1b. Set environment variables in Railway

In your Railway service → **Variables**, add:

| Variable | Value |
|---|---|
| `PORT` | `3000` (Railway sets this automatically — you can skip it) |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Supabase connection string (from Supabase → Settings → Database) |
| `CLERK_PUBLISHABLE_KEY` | From Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | From Clerk Dashboard → API Keys |
| `SESSION_SECRET` | Any long random string (e.g. 64 random chars) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `ALLOWED_ORIGINS` | The full URL of your shared hosting site, e.g. `https://synorlab.yourdomain.com` |

### 1c. Note your Railway URL

After first deploy, Railway gives you a URL like:
```
https://synorlab-api-production.up.railway.app
```
Keep this — you'll need it for the frontend environment variables.

---

## Step 2 — Build the Frontend

### 2a. Set environment variables for the build

Create a file called `.env.production` in `artifacts/synorlab/` (do **not** commit this):

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
VITE_API_URL=https://synorlab-api-production.up.railway.app
VITE_CLERK_PROXY_URL=https://synorlab-api-production.up.railway.app/api/__clerk
```

> `VITE_API_URL` — points to your Railway backend.
> `VITE_CLERK_PROXY_URL` — lets Clerk proxy its requests through Railway (required for custom domains).

### 2b. Run the production build

From the project root:

```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/synorlab run build
```

This outputs static files to `artifacts/synorlab/dist/public/`.

---

## Step 3 — Upload to Shared Hosting

1. Open your cPanel **File Manager** (or use FTP/SFTP).
2. Navigate to your `public_html` folder (or a subdomain folder if you're using one).
3. Upload **all contents** of `artifacts/synorlab/dist/public/` into that folder.
   - This includes `index.html`, the `assets/` folder, and `.htaccess`.
4. The `.htaccess` file is already included in the build (from `public/.htaccess`).
   Make sure your host has `mod_rewrite` enabled — it's on by default on most cPanel hosts.

### Verify the upload worked

Visit your domain. You should see the Synorlab landing page. Try navigating to `/features` — if it loads without a 404, the `.htaccess` SPA routing is working.

---

## Step 4 — Configure Clerk for your domain

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com).
2. In your application → **Domains**, add your production domain (e.g. `synorlab.yourdomain.com`).
3. Clerk will ask you to verify domain ownership via a DNS TXT record — follow the instructions.
4. Once verified, Clerk issues a production publishable key (`pk_live_...`).
   Update `VITE_CLERK_PUBLISHABLE_KEY` with this live key and rebuild the frontend.

---

## Environment Variable Reference

### Frontend (`artifacts/synorlab/.env.production`)

| Variable | Required | Description |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key (live) |
| `VITE_API_URL` | ✅ | Railway backend base URL |
| `VITE_CLERK_PROXY_URL` | ✅ | Railway Clerk proxy URL (`<VITE_API_URL>/api/__clerk`) |
| `VITE_SUPABASE_URL` | ❌ | Only if using Supabase client-side mode |
| `VITE_SUPABASE_ANON_KEY` | ❌ | Only if using Supabase client-side mode |

### Backend (Railway Variables)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Auto | Set by Railway automatically |
| `NODE_ENV` | ✅ | Set to `production` |
| `DATABASE_URL` | ✅ | Supabase PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key (live) |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `SESSION_SECRET` | ✅ | Random secret for sessions |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for AI interviews |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated list of allowed frontend origins |

---

## Rebuild & Redeploy After Changes

**Frontend changes:**
```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/synorlab run build
```
Then re-upload `artifacts/synorlab/dist/public/` to your host.

**Backend changes:**
Railway redeploys automatically on every `git push` to your connected branch.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| All routes return 404 (except `/`) | `.htaccess` not uploaded or `mod_rewrite` disabled on host |
| API calls fail (CORS error) | Add your hosting domain to `ALLOWED_ORIGINS` in Railway |
| Sign in fails | Check `VITE_CLERK_PROXY_URL` points to Railway and Clerk domain is verified |
| White screen / JS errors | Check browser console; ensure `VITE_API_URL` is set correctly in build |
| Railway build fails | Check that `pnpm-lock.yaml` is committed and up to date |
