# DevOps and Release Engineering

**App:** Tin Pata v1.4.0 · **Platform:** Android-first Expo RN  
**Audited:** v1.5D (June 2026)

---

## Project Build Model

| Item | Detail |
|------|--------|
| Stack | Expo SDK 54 + React Native + TypeScript |
| Target | Android-first personal APK (sideload) |
| Native workflow | **CNG / Prebuild** — native projects generated from config |
| Source of truth | `app.json` (plugins, package, icon, splash, permissions) |
| `android/` / `ios/` | Generated locally; **not committed** |
| Expo Go | **Not supported** — PDF, notifications, brightness need native modules |
| Dev client | Required — install via `npx expo run:android` or EAS `development` profile |
| EAS | Cloud builds run prebuild on server; see `eas.json` |

Package: `com.readinghabit.tracker` · Scheme: `tinpata`

---

## Local Development Flow

| Command | When to use |
|---------|-------------|
| `npm install` | After clone or when `package.json` changes |
| `npm run typecheck` | Before commit or release; catches TS errors |
| `npx expo start -c` | Day-to-day JS/TS work after dev client installed; `-c` clears Metro cache |
| `adb reverse tcp:8081 tcp:8081` | USB device cannot reach Metro on localhost |
| `npx expo prebuild --clean --platform android` | After `app.json` plugin/icon/package changes; fresh native project |
| `npx expo run:android` | First install or after native config change; builds + installs dev client |
| `npx expo-doctor` | Health check; run before release |

**Typical day:** dev client already installed → `npx expo start -c` only.

**After native change:** prebuild → `run:android` → then Metro for JS.

See also: [CNG_SETUP.md](./CNG_SETUP.md)

---

## Native Rebuild vs Metro Reload

| Change type | Metro reload enough? | Native rebuild needed? |
|-------------|----------------------|-------------------------|
| JS/TS UI screens | ✅ Yes | ❌ No |
| i18n string changes | ✅ Yes | ❌ No |
| SQLite / query logic (JS only) | ✅ Yes | ❌ No |
| `app.json` native config | ❌ No | ✅ Yes — prebuild + run/build |
| New Expo / native package | ❌ No | ✅ Yes — install + prebuild + run |
| Android permissions | ❌ No | ✅ Yes |
| Icon / splash assets | ❌ No | ✅ Yes |
| Package name / bundle ID | ❌ No | ✅ Yes — prebuild + reinstall |
| Config plugin changes | ❌ No | ✅ Yes |

**Rule:** If it touches `app.json` plugins or native modules → rebuild dev client or EAS build.

---

## CNG / Prebuild Rules

- [x] `android/` and `ios/` in `.gitignore` — do not commit
- [x] Same paths in `.easignore` — EAS uploads config, runs prebuild remotely
- [x] Regenerate with `npx expo prebuild --clean --platform android`
- [x] Do **not** hand-edit generated native files unless switching to bare workflow
- [x] `npx expo-doctor` should pass (18/18 as of v1.5D)
- [x] Keep local `android/` after prebuild for `expo run:android`; delete/regenerate on plugin conflicts

**If doctor warns about stale native folders:** remove `android/` and run prebuild again, or ensure folders are gitignored and match `app.json`.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) | Versioning, checklist, EAS production |
| [ROLLBACK_AND_RECOVERY.md](./ROLLBACK_AND_RECOVERY.md) | Git, data, build recovery |
| [ENVIRONMENT_AND_SECRETS.md](./ENVIRONMENT_AND_SECRETS.md) | Secrets policy (v1 + v2) |
| [RELEASE_BUILD_GUIDE.md](./RELEASE_BUILD_GUIDE.md) | Detailed APK steps |
