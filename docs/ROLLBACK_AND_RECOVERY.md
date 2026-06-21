# Rollback and Recovery

How to undo bad code, recover user data, and fix broken builds.

---

## Git Rollback

| Goal | Command |
|------|---------|
| View history | `git log --oneline` |
| Undo one commit (safe) | `git revert <commit>` |
| Inspect old release | `git checkout vX.Y.Z` (detached HEAD) |
| Hotfix from tag | `git checkout -b hotfix/vX.Y.Z-fix vX.Y.Z` |

**After hotfix:** merge to `main`, bump patch version, new tag.

**Avoid** `git reset --hard` on shared branches unless you understand data loss.

### Return to latest main

```bash
git checkout main
```

---

## App Data Recovery

| Situation | Action |
|-----------|--------|
| Before risky update | **Export JSON backup** from Settings |
| After bad import | Restore from backup file; use merge or replace carefully |
| PDFs missing after restore | Expected — JSON has no PDF bytes; use **Relink PDF** |
| Accidental reset | **Not recoverable** without backup |

**Rules**

- JSON backup = metadata only (sessions, notes, bookmarks, settings)
- Copy PDF files separately or relink per book
- Never use **Reset all data** or **Replace import** without a fresh backup
- Test import on a copy before replace on daily driver

Guide: [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md)

---

## Build Recovery

| Symptom | Fix |
|---------|-----|
| Stale Metro bundle | `npx expo start -c` |
| Native plugin mismatch | `npx expo prebuild --clean --platform android` |
| Gradle weird errors | `cd android && ./gradlew clean` then `npx expo run:android` |
| App won't connect to Metro | `adb reverse tcp:8081 tcp:8081` |
| Wrong/old native code | Delete `android/`, prebuild again |
| Install signature conflict | Uninstall old APK: `adb uninstall com.readinghabit.tracker` |

```bash
npx expo start -c
npx expo prebuild --clean --platform android
npx expo run:android
```

Gradle clean **only works after** prebuild creates `android/`:

```bash
cd android && ./gradlew clean && cd ..
```

---

## Release rollback

1. Install previous APK from EAS build history or local backup.
2. User data on device is unchanged (SQLite local) unless app migration broke DB — restore JSON backup if needed.
3. Fix forward on `main` with patch release.

---

## When to export backup

- Before app version upgrade
- Before replace-import or reset
- Before OS reset or new phone
- Monthly habit (Settings backup health card)
