# Quiet Reader — Brand Assets

Replace these files to customize the app icon and splash screen. **Do not commit proprietary artwork unless you own the rights.**

## App identity

| Setting | Value |
|---------|--------|
| App name | **Quiet Reader** |
| Android package | `com.readinghabit.tracker` |
| URL scheme | `quietreader` |
| Brand colors | Soft green `#5B8A72`, warm background `#F8F7F4`, dark `#1C1C1E` |

## Asset paths and recommended sizes

### Main icon
- **Path:** `assets/images/icon.png`
- **Size:** 1024×1024 px
- **Style:** Minimal book/page/moon motif, calm green or warm neutral

### Android adaptive icon
- **Foreground:** `assets/images/android-icon-foreground.png` — 1024×1024 px, safe zone ~66% center
- **Background:** `assets/images/android-icon-background.png` — 1024×1024 px (or use solid `#F8F7F4` in app.json)
- **Monochrome:** `assets/images/android-icon-monochrome.png` — optional, for themed icons

Configured in `app.json`:
```json
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#F8F7F4",
    "foregroundImage": "./assets/images/android-icon-foreground.png",
    "backgroundImage": "./assets/images/android-icon-background.png"
  }
}
```

### Splash screen
- **Path:** `assets/images/splash-icon.png`
- **Size:** ~200–400 px wide centered logo; background `#F8F7F4` (light) / `#1C1C1E` (dark)
- Configured via `expo-splash-screen` plugin in `app.json`

### Web favicon
- **Path:** `assets/images/favicon.png`
- **Size:** 48×48 px or larger

### Notification icon (Android)
- **Path:** `assets/images/icon.png` (referenced by `expo-notifications` plugin)
- **Note:** Should be white silhouette on transparent for best Android results; replace with a dedicated mono icon if needed.

## After replacing assets

1. Clear Metro cache: `npx expo start -c`
2. Rebuild native app (required for icon/splash on device):
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```
   Or EAS: `eas build --platform android --profile production`

## Design guidance

- Keep icons simple and readable at small sizes
- Avoid text in the icon
- Use soft greens and warm neutrals — no harsh reds or guilt-based imagery
- Match the in-app calm palette in `src/constants/theme.ts`
