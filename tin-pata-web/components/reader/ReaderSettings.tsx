'use client';

import { useEffect, useId } from 'react';

import type { DictionaryMode, DictionaryPreferences } from '@/types/dictionary';
import type { ReaderZoomMode } from '@/types/reader';

interface ReaderSettingsProps {
  open: boolean;
  theme: 'light' | 'dark' | 'system';
  zoomMode: ReaderZoomMode;
  leftOpen: boolean;
  rightOpen: boolean;
  dictionaryPrefs: DictionaryPreferences;
  onClose: () => void;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onDictionaryPrefChange: <K extends keyof DictionaryPreferences>(
    key: K,
    value: DictionaryPreferences[K],
  ) => void;
}

export function ReaderSettings({
  open,
  theme,
  zoomMode,
  leftOpen,
  rightOpen,
  dictionaryPrefs,
  onClose,
  onThemeChange,
  onToggleLeft,
  onToggleRight,
  onDictionaryPrefChange,
}: ReaderSettingsProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close settings" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-base font-semibold text-foreground">
          Reader settings
        </h2>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-muted">Theme</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['light', 'dark', 'system'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                onClick={() => onThemeChange(value)}
                className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                  theme === value ? 'bg-tint text-white' : 'border border-border hover:bg-tint-muted'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 space-y-2 text-sm">
          <p className="text-xs font-medium text-muted">Layout</p>
          <label className="flex items-center justify-between gap-3">
            <span>Bookmarks sidebar</span>
            <input type="checkbox" checked={leftOpen} onChange={onToggleLeft} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Notes sidebar</span>
            <input type="checkbox" checked={rightOpen} onChange={onToggleRight} />
          </label>
          <p className="text-xs text-muted">Current zoom mode: {zoomMode}</p>
        </div>

        <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
          <p className="text-xs font-medium text-muted">Dictionary</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'en-bn' as DictionaryMode, label: 'EN → Bangla' },
                { value: 'en' as DictionaryMode, label: 'English' },
                { value: 'bn-en' as DictionaryMode, label: 'Bangla → EN' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={dictionaryPrefs.mode === option.value}
                onClick={() => onDictionaryPrefChange('mode', option.value)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  dictionaryPrefs.mode === option.value
                    ? 'bg-tint text-white'
                    : 'border border-border hover:bg-tint-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between gap-3">
            <span>Open on double-click</span>
            <input
              type="checkbox"
              checked={dictionaryPrefs.openOnDoubleClick}
              onChange={(e) => onDictionaryPrefChange('openOnDoubleClick', e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Highlight word on page</span>
            <input
              type="checkbox"
              checked={dictionaryPrefs.highlightOnPage}
              onChange={(e) => onDictionaryPrefChange('highlightOnPage', e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Save recent lookups</span>
            <input
              type="checkbox"
              checked={dictionaryPrefs.saveRecent}
              onChange={(e) => onDictionaryPrefChange('saveRecent', e.target.checked)}
            />
          </label>
        </div>

        <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
          Shortcuts: ←/→ page · B bookmark · N note · D dictionary · C checkpoint · double-click
          word · select + right-click · F fullscreen · H focus · Esc
        </p>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-tint px-3 py-2 text-sm font-medium text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
