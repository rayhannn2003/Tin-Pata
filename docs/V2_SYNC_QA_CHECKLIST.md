# V2 Sync QA Checklist

Manual QA for Tin Pata v2.0E (conflict handling + sync stability).

## Auth & link

- [ ] Local-only mode works without sign-in
- [ ] Sign in / sign out works
- [ ] Link local data assigns user/device ids and enqueues records
- [ ] Sign out does not delete local reading data

## Metadata sync

- [ ] Sync now pushes pending changes
- [ ] Sync now pulls remote changes
- [ ] Pending changes count updates after edit
- [ ] Last sync time updates on success
- [ ] Metadata synced message on clean sync

## Duplicate prevention

- [ ] Sync now twice does not duplicate books
- [ ] Sync now twice does not duplicate sessions
- [ ] Sync now twice does not duplicate notes/bookmarks
- [ ] Sync now twice does not duplicate goals/reflections/settings

## Failed sync & recovery

- [ ] Airplane mode during sync fails safely (no crash)
- [ ] Failed queue item stores `last_error` and increases `retry_count`
- [ ] Failed changes count visible in Settings
- [ ] Retry failed sync re-attempts error items
- [ ] Run sync check reports warnings without crashing
- [ ] Sync repair resets stuck processing / invalid sync status safely
- [ ] Clear synced queue removes completed items only

## Conflicts

- [ ] Note edited on two devices → latest `updated_at` wins
- [ ] Bookmark edited on two devices → latest `updated_at` wins
- [ ] Read backward on second device → latest `current_page_updated_at` wins

## Second device

- [ ] Fresh install → sign in → link → sync pulls books/metadata
- [ ] Book with cloud PDF shows download option
- [ ] Book without cloud PDF shows relink needed

## PDF cloud (manual)

- [ ] PDF backup under 50 MB succeeds
- [ ] PDF above 50 MB rejected with clear message
- [ ] Cloud PDF delete keeps local PDF and reading data
- [ ] Download cloud PDF updates local file only on device
- [ ] Missing PDF relink still works

## Backup / export / import

- [ ] Export backup after sync produces valid file
- [ ] Import backup on linked account does not break sync state

## Automated checks

- [ ] `npm run typecheck` passes
- [ ] `npx expo-doctor` passes

## Copy

- [ ] Settings shows “PDF files sync only if backed up manually.”
- [ ] Settings shows “Local reading still works offline.”
