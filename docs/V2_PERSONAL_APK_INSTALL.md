# Personal preview APK (v2)

Standalone Android APK for daily use — no laptop / Metro required.

## Supabase env on EAS (required for sign-in)

Local `.env` is **not** used by EAS builds. Use the **publishable key** (`sb_publishable_...`), not the legacy anon JWT.

Supabase Dashboard → **Project Settings** → **API Keys** → **Publishable key**.

```bash
cd ~/Desktop/Project/Read_Book

eas env:update \
  --variable-name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://YOUR_PROJECT.supabase.co" \
  --visibility secret \
  --environment preview --environment production --environment development \
  --non-interactive

eas env:update \
  --variable-name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
  --value "sb_publishable_..." \
  --visibility secret \
  --environment preview --environment production --environment development \
  --non-interactive
```

If `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` does not exist yet:

```bash
eas env:create \
  --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
  --value "sb_publishable_..." \
  --visibility secret \
  --environment preview --environment production --environment development \
  --non-interactive
```

**Do not** use placeholder text like `YOUR_ANON_KEY`. The app accepts legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY` as fallback only.

## Local `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Restart Metro after changing `.env`: `npx expo start -c`

## Build preview APK

`eas.json` links the `preview` profile to the `preview` environment.

```bash
npm run typecheck
eas build --platform android --profile preview
```

Download APK from the EAS build page when finished.

## Install

```bash
adb install -r ~/Downloads/your-build.apk
```

If signature mismatch:

```bash
adb uninstall com.readinghabit.tracker
adb install -r ~/Downloads/your-build.apk
```

Export JSON backup before uninstall — local data is removed.

## "Invalid API key" on sign-in

The APK was built with a missing or wrong key (often a placeholder from an old EAS secret).

Fix:

1. Set `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on EAS (commands above).
2. **Build a new APK** — old APK cannot be fixed without reinstalling.
3. Install the new APK.

## Verify key locally (optional)

```bash
export $(grep -v '^#' .env | xargs)
curl -s "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health" \
  -H "apikey: ${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"
```

Should return GoTrue health JSON, not `"Invalid API key"`.

## Supabase auth

Turn **OFF** Confirm email: Authentication → Providers → Email.

See `docs/V2_DISABLE_EMAIL_CONFIRMATION.md`.
