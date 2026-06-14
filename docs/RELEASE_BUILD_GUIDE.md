# Tin Pata — Release Build Guide (v1.0)

Personal Android APK for sideloading. **Not** a Play Store publishing guide.

---

## Prerequisites

| Requirement | Check |
|-------------|-------|
| Node.js 18+ | `node -v` |
| npm dependencies | `npm install` |
| EAS CLI | `npm i -g eas-cli` and `eas login` |
| Android SDK | `echo $ANDROID_HOME` → should be `~/Android/Sdk` |
| adb | `adb version` |
| Physical Android device | USB debugging enabled |

### ANDROID_HOME setup (Linux)

Add to `~/.bashrc`:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Then: `source ~/.bashrc`

---

## App identity

| Field | Value |
|-------|-------|
| Name | তিনপাতা (Tin Pata) |
| Package | `com.readinghabit.tracker` |
| Scheme | `tinpata` |
| Icon | `assets/images/updatedIcon.png` |
| Notification icon | `assets/images/notification-icon.png` |

---

## Quality check before build

```bash
cd ~/Desktop/Project/Read_Book
npm run typecheck
```

Fix any TypeScript errors before building.

---

## Development build (daily JS work)

**Expo Go does NOT work** — PDF reader and notifications require native modules.

```bash
npx expo run:android
```

After first install, day-to-day changes:

```bash
npx expo start -c
```

Open **তিনপাতা** from the app drawer (not Expo Go).

### Dev build notes

- Shows Expo dev client UI — normal for development.
- Metro must be running for JS hot reload.
- First Gradle build can take 30–60+ minutes.

---

## Production APK (EAS)

### Profile (`eas.json`)

| Profile | Dev client | Output |
|---------|------------|--------|
| `development` | Yes | APK |
| `preview` | No | APK |
| `production` | No | APK |

### Build command

```bash
eas build --platform android --profile production
```

Download the APK from the EAS dashboard when complete.

### Local production-like build (optional)

```bash
npx expo prebuild --platform android
cd android && ./gradlew app:assembleRelease
```

Release signing requires a keystore (not configured in this personal project by default).

---

## Install APK on phone

```bash
adb install -r path/to/app.apk
```

### Signature mismatch fix

If you see:

```
INSTALL_FAILED_UPDATE_INCOMPATIBLE: signatures do not match
```

Uninstall the old app first:

```bash
adb uninstall com.readinghabit.tracker
adb install -r path/to/app.apk
```

**Warning:** Uninstall removes all on-device reading data unless you exported a JSON backup first.

---

## Production vs dev client

| | Dev build | Production APK |
|---|-----------|----------------|
| Expo dev menu | Yes | No |
| Requires Metro | For hot reload | No (bundled) |
| PDF reader | Yes | Yes |
| Notifications | Yes | Yes |
| Expo Go | No | No |

Test production APK separately — behavior should match dev build without Metro.

---

## Notification rebuild

After changing `expo-notifications` config or native plugins:

```bash
npx expo prebuild --platform android
npx expo run:android
```

Or rebuild via EAS.

---

## Backup before risky operations

Settings → **ডেটা ব্যাকআপ** → Export JSON.

PDF files are **not** in the backup — copy `documentDirectory/pdfs/` separately if needed.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `adb: not found` | Set ANDROID_HOME and PATH |
| `spawn adb ENOENT` | Same as above |
| Gradle lock timeout | `./gradlew --stop` and retry |
| Metro notification stub | Restart with `npx expo start -c` |
| Notifications not working | Use dev/production build, not Expo Go |

---

## Quick command reference

```bash
npm run typecheck
npx expo start -c
npx expo run:android
eas build --platform android --profile production
adb install -r app.apk
adb uninstall com.readinghabit.tracker
```
