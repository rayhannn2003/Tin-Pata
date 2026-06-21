# Release Process

Solo-dev release flow for Tin Pata. Personal APK — not Play Store publishing.

---

## Versioning

| Location | Field | Example |
|----------|-------|---------|
| `package.json` | `"version"` | `"1.4.0"` |
| `app.json` | `expo.version` | `"1.4.0"` |
| Docs | `docs/VERSION_HISTORY.md` | Release notes |
| Git | tag | `v1.4.0` |

**Keep `package.json` and `app.json` in sync** before every release.

### Semantic versioning

| Bump | When |
|------|------|
| **Patch** (1.4.0 → 1.4.1) | Bugfix, stability, docs-only milestone tag optional |
| **Minor** (1.4.0 → 1.5.0) | New features, backup/schema additions |
| **Major** (1.x → 2.0) | Cloud sync, auth, architecture break |

Commit message example: `release: v1.4.0 — backup and data safety`  
Tag: `git tag -a v1.4.0 -m "v1.4.0 backup and data safety"`

---

## Release Branch Flow

```txt
main     = stable release (installable APK tag)
staging  = active testing before merge
feature/* = optional short-lived work
```

```bash
git checkout staging
npm run typecheck
npx expo-doctor
# manual QA (see checklist below)
git add .
git commit -m "release: prepare vX.Y.Z"
git checkout main
git merge staging
git tag vX.Y.Z
# optional: git push origin main --tags
```

For small solo fixes, committing directly to `main` is OK if checklist passes.

---

## Pre-release Checklist

**Automated**

- [ ] `npm run typecheck` passes
- [ ] `npx expo-doctor` passes (or documented known exception)
- [ ] `package.json` + `app.json` version bumped
- [ ] `docs/VERSION_HISTORY.md` updated

**Manual QA**

- [ ] Export backup JSON from Settings
- [ ] Import backup — preview, merge, and replace (on test device)
- [ ] Reader opens valid PDF; page save on exit
- [ ] Missing PDF badge + relink flow
- [ ] Session finish + stats update
- [ ] Notes and bookmarks create/search/open page
- [ ] Language switch EN ↔ BN
- [ ] Theme switch (system/light/dark)

**Build**

- [ ] EAS production command verified (or local release build tested once)
- [ ] APK installs on physical device
- [ ] App opens without Metro (production build)

See also: [V1_4_RELEASE_CHECKLIST.md](./V1_4_RELEASE_CHECKLIST.md), [READER_STABILITY_TEST_CHECKLIST.md](./READER_STABILITY_TEST_CHECKLIST.md)

---

## Production APK Build

**Real release (sideload / share):**

```bash
eas build --platform android --profile production
```

**Internal test APK (no dev client UI):**

```bash
eas build --platform android --profile preview
```

**Dev client (Metro debugging):**

```bash
eas build --platform android --profile development
```

| Profile | Use |
|---------|-----|
| `production` | Final APK for personal use |
| `preview` | QA APK; internal distribution |
| `development` | Dev client + native modules |

Requirements: `eas login`, EAS project linked in `app.json` → `extra.eas.projectId`.

Download APK from EAS dashboard when build completes. Install via `adb install` or file transfer.

**Note:** `eas.json` uses `appVersionSource: "remote"` — confirm version in EAS if remote versioning is enabled.
