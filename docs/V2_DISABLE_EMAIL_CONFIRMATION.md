# Disable Supabase Email Confirmation (required for Tin Pata)

Tin Pata sign-up should **sign you in immediately** with no confirmation email. That behavior is controlled in **Supabase Dashboard**, not in the app.

## Step 1 — Turn off confirmation emails

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Tin Pata project
3. Go to **Authentication** → **Providers** → **Email**
4. Turn **OFF** the toggle **Confirm email**
5. Click **Save**

After this, new sign-ups receive a session immediately and no confirmation email is sent.

## Step 2 — Fix accounts created while confirmation was ON

If you already signed up and got a confirmation email, that user is **unconfirmed**. Sign-in and sign-up will fail until you fix it.

**Option A — Delete test user and sign up again (easiest for dev)**

In Supabase SQL Editor:

```sql
-- Replace with your test email
delete from auth.users where email = 'you@example.com';
```

Then sign up again in the app (after Step 1 is done).

**Option B — Manually confirm existing user**

```sql
update auth.users
set email_confirmed_at = now(),
    confirmed_at = now()
where email = 'you@example.com';
```

Then use **Sign in** in Settings with the same password.

## Step 3 — Verify in the app

1. Settings → **Sign up** with a **new email**
2. You should return to Settings **signed in** (no email, no error)
3. Supabase → **Authentication** → **Users** → user shows **confirmed**
4. Supabase → **Table Editor** → `profiles` → row exists (from trigger)

## If sign-up still fails

The app now shows a specific message if confirmation is still enabled:

> Supabase is still sending confirmation emails…

If you see another message, it is usually:

| Message | Fix |
|---------|-----|
| Email already registered | Use **Sign in** instead |
| Invalid email or password | Check email format / password (min 6 chars) |
| Could not reach server | Check internet / Supabase URL in `.env` |

## Notes

- The mobile app **cannot** disable confirmation emails; only the Supabase project setting can.
- Keep **Confirm email OFF** for dev and for Tin Pata v2 mobile sync testing.
- For production you may re-enable confirmation later when adding a website — not required for current mobile testing.
