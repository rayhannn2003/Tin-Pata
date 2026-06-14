# Reader Known Limitations

Tin Pata v1.1.4 — PDF reader constraints and stability notes.

## Black flash on resume

**react-native-pdf** may briefly show a **black flash** while opening a PDF at a saved page. This is a known behavior of the native PDF renderer during initial layout, not a JavaScript remount loop.

What we do to minimize risk:

- Auto-resume uses the native **`page` prop only at first mount** (frozen ref).
- **No post-load automatic `setPage()`** for resume.
- **No dynamic `key`** on the PDF component.
- **No changing** fit mode, scroll mode, or focus overlays in safe mode.

If native crashes return (`PdfFile.getMaxPageWidth()` NPE, app exit on open), restore **manual resume only** (v1.1.2 style): remove the initial `page` prop and rely on the “Last read” fallback banner.

## Auto-resume mechanism

| Method | Used? |
|--------|-------|
| Initial `page` prop at mount | Yes (safe auto-resume) |
| `setPage()` after `onLoadComplete` | No |
| `setPage()` on mount / timer | No |
| User Go to page / bookmark jump | Yes (after load) |

After open, we detect success via `onPageChanged`. If the viewer stays on page 1, a **manual fallback** banner appears after ~1.5s.

## Stability mode (`reader_stability_mode = safe`)

Only **`safe`** is supported in v1.1.x. In safe mode:

- Vertical continuous scroll only
- No focus overlay
- No dynamic fit or scroll direction
- No post-load auto `setPage`
- Auto-resume via initial `page` prop only

Do not re-enable risky reader experiments without a new stability mode and device testing.

## What not to change casually

- Do not pass a **new object identity** to `source={{ uri }}` on every render without `useMemo`.
- Do not wrap the PDF in **conditional render** that unmounts/remounts it.
- Do not update the **`page` prop** reactively after mount.
- Do not add focus/fit/scroll toggles that alter native PDF props at runtime.

See also: [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md), [READER_STABILITY_TEST_CHECKLIST.md](./READER_STABILITY_TEST_CHECKLIST.md), [CNG_SETUP.md](./CNG_SETUP.md).
