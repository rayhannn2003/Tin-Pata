# CNG / Prebuild Setup

Tin Pata uses **Continuous Native Generation (CNG)**. Native `android/` and `ios/` folders are **generated** from `app.json` — they are not the source of truth and should not be committed.

## Requirements

- **Expo Go is not supported** (PDF reader needs a dev client).
- **Development build required** for local PDF testing.
- **`app.json`** is the source of truth for: icon, scheme, plugins, Android package, splash, notifications.

## Local development

After cloning or when native config changes:

```bash
npm install
npx expo prebuild --clean --platform android
npx expo run:android
```

Day-to-day JS/TS changes only need Metro:

```bash
npx expo start
# USB: adb reverse tcp:8081 tcp:8081
```

## EAS Build

EAS runs prebuild on the server. `android/` and `ios/` are listed in `.easignore` so uploaded tarballs do not include stale native folders.

## Git

`android/` and `ios/` are in `.gitignore`. If they were previously committed, untrack them once:

```bash
git rm -r --cached android ios
```

Keep generated folders locally after `prebuild` for `expo run:android`, but do not commit them unless you intentionally switch to a bare workflow.

## Verify

```bash
npx expo-doctor
```

Should pass the “app config fields synced with prebuild” check when `android/` and `ios/` are not present in the project root (or not conflicting with `app.json` plugins).

## Clean rebuild (after plugin or SDK changes)

```bash
npx expo prebuild --clean --platform android
npx expo run:android
```
