# Adflo Estimator — Deployment Guide
## Supabase + Vercel · ~20 minutes

---

## Step 1 — Create a Supabase Project

1. Go to **https://supabase.com** and sign in (or create a free account)
2. Click **New project**
3. Choose a name (e.g. `adflo-estimator`) and a strong database password → **Create new project**
4. Wait ~2 minutes for provisioning

---

## Step 2 — Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase-schema.sql` from this project folder
4. Copy the entire contents and paste into the SQL editor
5. Click **Run** (or Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" — that means it worked.

✅ This creates all 6 tables, RLS policies, triggers, and seeds all 37 questions.

---

## Step 3 — Enable Google OAuth

1. In Supabase dashboard → **Authentication** → **Providers**
2. Find **Google** and toggle it on
3. You need a Google OAuth Client ID and Secret:
   - Go to **https://console.cloud.google.com**
   - Create a new project (or use an existing one)
   - Enable the **Google+ API** (APIs & Services → Enable APIs)
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Under "Authorized redirect URIs", add:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
     (Replace `your-project-ref` with your actual Supabase project reference)
   - Copy the **Client ID** and **Client Secret**
4. Paste both into Supabase → Authentication → Providers → Google
5. Click **Save**

---

## Step 4 — Get Your Supabase API Keys

1. In Supabase dashboard → **Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 5 — Deploy to Vercel

### Option A: GitHub (recommended)

1. Push this project to a GitHub repository:
   ```bash
   cd adflo-estimator
   git init
   git add .
   git commit -m "Initial commit"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/adflo-estimator.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** and sign in
3. Click **Add New Project** → **Import Git Repository** → select your repo
4. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
   ```
5. Click **Deploy**
6. Wait ~2 minutes → your app is live at `https://your-project-name.vercel.app`

### Option B: Vercel CLI

```bash
npm i -g vercel
cd adflo-estimator
cp .env.local.example .env.local
# Edit .env.local with your Supabase values
vercel
# Follow prompts, then:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

---

## Step 6 — Update Google OAuth Redirect URI

After Vercel gives you your live URL, update the authorized redirect URI in Google Cloud Console:

1. Go back to Google Cloud Console → Credentials → your OAuth client
2. Add your Vercel URL to Authorized redirect URIs:
   ```
   https://your-project-name.vercel.app/auth/callback
   ```
3. Also update the Supabase redirect allowlist:
   - Supabase → Authentication → URL Configuration
   - Add `https://your-project-name.vercel.app/**` to **Redirect URLs**

---

## Step 7 — Create Your First Team User

After deployment:

1. Visit `https://your-app.vercel.app`
2. Sign in with Google (this creates your profile automatically with `role = 'sales'`)
3. Manually promote yourself to `team` in Supabase:
   - Supabase → **Table Editor** → `profiles` table
   - Find your row and change `role` from `sales` to `team` (or `admin`)
4. Refresh the app — you'll now see all team features

### Promoting future team members
Run this SQL in the Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'team' WHERE email = 'teammate@company.com';
```

---

## Step 8 — Test the Full Flow

1. **Create a session**: Log in → click "+ New Session" → enter a client name
2. **Copy share link**: In the session, click "🔗 Share Link"
3. **Test client flow**: Open the link in an incognito window — you should see the clean questionnaire with no team details
4. **Submit**: Answer all questions and click Submit
5. **View results**: Back in the dashboard, the session status should update to "Submitted"
6. **Generate SRD**: Click "📄 SRD" tab → fill in any missing fields → "⬇ Export SRD (.docx)"

---

## Optional: Custom Domain

In Vercel → your project → **Settings** → **Domains** → add your custom domain.

---

## Troubleshooting

**"Invalid login" after Google OAuth**
- Make sure the redirect URI in Google Console exactly matches your Supabase project URL
- Check that Supabase has the Vercel URL in its allowlist

**"RLS policy violation" errors**
- Make sure you ran the full schema SQL — all policies must be in place
- Check that your user's role in the `profiles` table is correct

**Sessions not saving**
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct in Vercel environment variables
- Check Supabase → Logs → API for errors

**Share link questionnaire not updating**
- The public PATCH on sessions via share_token requires an additional RLS policy.
  Run this in the SQL Editor:
  ```sql
  CREATE POLICY "sessions: anonymous update by token"
    ON public.sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);
  ```
  Note: This is permissive for the token route. In production, consider using a
  Supabase Edge Function to handle anonymous updates with server-side token validation.

---

## Architecture Summary

```
Browser
  ├── /auth/login          Google OAuth + Magic Link
  ├── /dashboard           Session list (Sales: own, Team: all)
  ├── /dashboard/sessions/[id]   Full estimator (Questionnaire, Levers, History, SRD, Logic)
  ├── /dashboard/history   All completed projects + variance analysis
  └── /q/[token]           Public client questionnaire (no login)

API Routes
  ├── /api/sessions        List + Create
  ├── /api/sessions/[id]   Get + Update + Delete
  ├── /api/sessions/token/[token]  Public update via share token
  ├── /api/history         List + Create + Delete
  ├── /api/logic           Get + Update global settings
  └── /api/questions/[id]  Update question weight

Database (Supabase Postgres)
  ├── profiles             User roles (admin, team, sales)
  ├── sessions             Estimation sessions with answers + levers
  ├── history              Completed project actuals for learning
  ├── questions            37 questions with weights (editable)
  ├── logic_settings       Global base hours, multipliers, tiers
  └── learned_weight_overrides  Manual weight overrides
```
