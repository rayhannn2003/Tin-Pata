'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DictionaryService } from '@/services/DictionaryService';
import type {
  DictionaryEntry,
  DictionaryMode,
  DictionaryPreferences,
  DictionaryRecentItem,
} from '@/types/dictionary';
import { DEFAULT_DICTIONARY_PREFERENCES } from '@/types/dictionary';
import { clearWordHighlight } from '@/utils/pdfTextSelection';

interface DictionaryPanelProps {
  open: boolean;
  pageNumber: number;
  initialWord?: string;
  preferences?: DictionaryPreferences;
  onClose: () => void;
  onAddToNote: (noteText: string) => void;
}

const MODE_LABEL: Record<DictionaryMode, string> = {
  en: 'English',
  'en-bn': 'EN → বাংলা',
  'bn-en': 'বাংলা → EN',
};

export function DictionaryPanel({
  open,
  pageNumber,
  initialWord = '',
  preferences = DEFAULT_DICTIONARY_PREFERENCES,
  onClose,
  onAddToNote,
}: DictionaryPanelProps) {
  if (!open) {
    return null;
  }

  const safeWord = typeof initialWord === 'string' ? initialWord : '';

  return (
    <DictionaryPanelInner
      key={`${preferences.mode}:${safeWord || 'dict'}`}
      pageNumber={pageNumber}
      initialWord={safeWord}
      preferences={preferences}
      onClose={onClose}
      onAddToNote={onAddToNote}
    />
  );
}

function DictionaryPanelInner({
  pageNumber,
  initialWord,
  preferences,
  onClose,
  onAddToNote,
}: {
  pageNumber: number;
  initialWord: string;
  preferences: DictionaryPreferences;
  onClose: () => void;
  onAddToNote: (noteText: string) => void;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(() => String(initialWord ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState<DictionaryRecentItem[]>(() =>
    DictionaryService.getRecent(),
  );

  useEffect(() => {
    if (!String(initialWord ?? '').trim()) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [initialWord]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearWordHighlight();
        onClose();
      }
    }
    function onContextMenu(event: MouseEvent) {
      event.preventDefault();
      clearWordHighlight();
      onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('contextmenu', onContextMenu);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [onClose]);

  useEffect(() => {
    const seed = String(initialWord ?? '').trim();
    if (seed) {
      void runLookup(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runLookup(raw: unknown) {
    const text = typeof raw === 'string' ? raw : String(query ?? '');
    setLoading(true);
    setError(null);
    setEntries([]);
    setCopied(false);
    setFromCache(false);
    const result = await DictionaryService.lookup(text, preferences.mode, {
      saveRecent: preferences.saveRecent,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setRecent(DictionaryService.getRecent());
      return;
    }
    setEntries(result.entries);
    setFromCache(Boolean(result.cached));
    setQuery(result.entries[0]?.word || text);
    setRecent(DictionaryService.getRecent());
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void runLookup(query);
  }

  function handleClose() {
    clearWordHighlight();
    onClose();
  }

  async function copyDefinition(entry: DictionaryEntry) {
    const text = DictionaryService.formatAsNote(entry, pageNumber);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  const queryText = typeof query === 'string' ? query : '';

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dictionary"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-xl border border-border bg-surface shadow-lg sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              Dictionary
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {MODE_LABEL[preferences.mode]} · page {pageNumber}
              {fromCache ? ' · cached' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md px-2 py-1 text-sm text-muted hover:bg-tint-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-b border-border px-5 py-3">
          <div className="min-w-0 flex-1">
            <Input
              ref={inputRef}
              label="Word"
              value={queryText}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                preferences.mode === 'bn-en' ? 'বাংলা শব্দ লিখুন…' : 'Type an English word…'
              }
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading || !queryText.trim()}>
              {loading ? '…' : 'Look up'}
            </Button>
          </div>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Looking up word">
              <div className="h-4 w-1/3 animate-pulse rounded bg-border/70" />
              <div className="h-16 animate-pulse rounded-lg bg-border/50" />
              <div className="h-16 animate-pulse rounded-lg bg-border/50" />
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {!loading && !error && entries.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Double-click a word, or select + right-click. Change language in Settings.
              </p>
              {preferences.saveRecent && recent.length > 0 ? (
                <section>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Recent
                    </h3>
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-foreground"
                      onClick={() => {
                        DictionaryService.clearRecent();
                        setRecent([]);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {recent.slice(0, 8).map((item) => (
                      <li key={`${item.mode}:${item.word}:${item.lookedUpAt}`}>
                        <button
                          type="button"
                          className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-tint-muted"
                          onClick={() => {
                            setQuery(item.word);
                            void runLookup(item.word);
                          }}
                        >
                          <span className="font-medium text-foreground">{item.word}</span>
                          <span className="truncate text-xs text-muted">{item.preview}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}

          {entries.map((entry, index) => (
            <article
              key={`${entry.word}-${index}`}
              className={index > 0 ? 'mt-6 border-t border-border pt-6' : ''}
            >
              <header className="mb-3">
                <h3 className="text-base font-semibold text-foreground">
                  {entry.word}
                  {entry.bangla ? (
                    <span className="ml-2 font-normal text-tint">{entry.bangla}</span>
                  ) : null}
                </h3>
                {entry.phonetic ? (
                  <p className="mt-0.5 text-sm text-muted">{entry.phonetic}</p>
                ) : null}
              </header>

              <div className="mb-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs"
                  onClick={() =>
                    onAddToNote(DictionaryService.formatAsNote(entry, pageNumber))
                  }
                >
                  Save as note
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => void copyDefinition(entry)}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {entry.meanings.map((meaning, mi) => (
                <section key={`${meaning.partOfSpeech}-${mi}`} className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tint">
                    {meaning.partOfSpeech || 'Meaning'}
                  </h4>
                  <ol className="list-decimal space-y-3 pl-4 text-sm text-foreground">
                    {meaning.definitions.slice(0, 6).map((def, di) => (
                      <li key={di}>
                        <p>{def.definition}</p>
                        {def.example ? (
                          <p className="mt-1 text-muted italic">“{def.example}”</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
