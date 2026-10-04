'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import { Button } from '@/components/ui/Button';
import { extractPdfRangeText, getPdfChapters } from '@/lib/pdf/summaryText';
import { SummaryService } from '@/services/SummaryService';
import type {
  PdfChapter,
  SummaryLanguage,
  SummaryLength,
  SummaryQuota,
  SummaryScope,
} from '@/types/summary';

interface AiSummaryDialogProps {
  open: boolean;
  pdf: PDFDocumentProxy;
  bookId: string;
  currentPage: number;
  pageCount: number;
  onClose: () => void;
  onSaveAsNote: (text: string, targetPage: number) => void;
}

export function AiSummaryDialog(props: AiSummaryDialogProps) {
  if (!props.open) return null;
  return <AiSummaryDialogInner key={`${props.bookId}:${props.currentPage}`} {...props} />;
}

function AiSummaryDialogInner({
  pdf,
  bookId,
  currentPage,
  pageCount,
  onClose,
  onSaveAsNote,
}: Omit<AiSummaryDialogProps, 'open'>) {
  const titleId = useId();
  const [scope, setScope] = useState<SummaryScope>('current');
  const [pageStart, setPageStart] = useState(currentPage);
  const [pageEnd, setPageEnd] = useState(Math.min(pageCount, currentPage + 9));
  const [chapters, setChapters] = useState<PdfChapter[]>([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [language, setLanguage] = useState<SummaryLanguage>('en');
  const [length, setLength] = useState<SummaryLength>('short');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [cached, setCached] = useState(false);
  const [model, setModel] = useState('');
  const [quota, setQuota] = useState<SummaryQuota | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPdfChapters(pdf)
      .then((rows) => {
        if (cancelled) return;
        setChapters(rows);
        const containing = rows.findIndex(
          (row) => currentPage >= row.startPage && currentPage <= row.endPage,
        );
        if (containing >= 0) setChapterIndex(containing);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pdf, currentPage]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const selectedRange = useMemo(() => {
    if (scope === 'current') return { start: currentPage, end: currentPage };
    if (scope === 'chapter') {
      const chapter = chapters[chapterIndex];
      return chapter
        ? { start: chapter.startPage, end: chapter.endPage }
        : { start: currentPage, end: currentPage };
    }
    return {
      start: Math.min(pageStart, pageEnd),
      end: Math.max(pageStart, pageEnd),
    };
  }, [scope, currentPage, chapters, chapterIndex, pageStart, pageEnd]);

  const rangeSize = selectedRange.end - selectedRange.start + 1;
  const rangeInvalid =
    selectedRange.start < 1 ||
    selectedRange.end > pageCount ||
    rangeSize < 1 ||
    rangeSize > 30;

  async function generate() {
    if (rangeInvalid) {
      setError('Choose 1–30 valid pages.');
      return;
    }
    setBusy(true);
    setError(null);
    setSummary('');
    setCached(false);
    setProgress(`Extracting page ${selectedRange.start}…`);

    try {
      const text = await extractPdfRangeText(
        pdf,
        selectedRange.start,
        selectedRange.end,
        (completed, total) => setProgress(`Extracting text ${completed}/${total}…`),
      );
      if (text.length < 40) {
        setError('No selectable text found. Scanned PDFs require OCR.');
        return;
      }

      setProgress('Gemini is writing the summary…');
      const result = await SummaryService.summarize({
        bookId,
        pageStart: selectedRange.start,
        pageEnd: selectedRange.end,
        language,
        length,
        text,
      });
      if (!result.ok) {
        setError(result.error);
        if (result.quota) setQuota(result.quota);
        return;
      }
      setSummary(result.summary);
      setCached(result.cached);
      setModel(result.model);
      setQuota(result.quota);
    } catch {
      setError('Could not extract or summarize this page range.');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close AI summary"
        disabled={busy}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-xl border border-border bg-surface shadow-lg sm:rounded-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              AI Summary
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Selectable PDF text is sent to Google Gemini.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted hover:bg-tint-muted"
          >
            Close
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 border-b border-border px-5 py-4">
            <fieldset>
              <legend className="text-xs font-medium text-muted">Pages</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    { value: 'current' as const, label: `Current (${currentPage})` },
                    { value: 'range' as const, label: 'Page range' },
                    { value: 'chapter' as const, label: 'Chapter' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.value === 'chapter' && chapters.length === 0}
                    aria-pressed={scope === option.value}
                    onClick={() => setScope(option.value)}
                    className={`rounded-md px-3 py-2 text-sm disabled:opacity-40 ${
                      scope === option.value
                        ? 'bg-tint text-white'
                        : 'border border-border hover:bg-tint-muted'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {scope === 'range' ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-muted">
                  From page
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={pageStart}
                    onChange={(event) => setPageStart(Number(event.target.value))}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs font-medium text-muted">
                  To page
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={pageEnd}
                    onChange={(event) => setPageEnd(Number(event.target.value))}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
              </div>
            ) : null}

            {scope === 'chapter' && chapters.length > 0 ? (
              <label className="block text-xs font-medium text-muted">
                Chapter
                <select
                  value={chapterIndex}
                  onChange={(event) => setChapterIndex(Number(event.target.value))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {chapters.map((chapter, index) => (
                    <option key={`${chapter.startPage}:${chapter.title}`} value={index}>
                      {chapter.title} · pages {chapter.startPage}–{chapter.endPage}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className="text-xs font-medium text-muted">Output language</legend>
                <div className="mt-2 flex gap-2">
                  {(
                    [
                      { value: 'en' as const, label: 'English' },
                      { value: 'bn' as const, label: 'বাংলা' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={language === option.value}
                      onClick={() => setLanguage(option.value)}
                      className={`rounded-md px-3 py-2 text-sm ${
                        language === option.value
                          ? 'bg-tint text-white'
                          : 'border border-border hover:bg-tint-muted'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-xs font-medium text-muted">Length</legend>
                <div className="mt-2 flex gap-2">
                  {(['short', 'detailed'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={length === value}
                      onClick={() => setLength(value)}
                      className={`rounded-md px-3 py-2 text-sm capitalize ${
                        length === value
                          ? 'bg-tint text-white'
                          : 'border border-border hover:bg-tint-muted'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${rangeInvalid ? 'text-red-600' : 'text-muted'}`}>
                Pages {selectedRange.start}–{selectedRange.end} · {rangeSize} page
                {rangeSize === 1 ? '' : 's'} · maximum 30
              </p>
              <Button disabled={busy || rangeInvalid} onClick={() => void generate()}>
                {busy ? 'Generating…' : summary ? 'Regenerate' : 'Generate summary'}
              </Button>
            </div>
          </div>

          <div className="px-5 py-4">
            {busy ? (
              <div className="space-y-3" aria-live="polite">
                <p className="text-sm text-tint">{progress}</p>
                <div className="h-20 animate-pulse rounded-lg bg-border/50" />
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            {!busy && !error && !summary ? (
              <p className="text-sm text-muted">
                Choose pages, language, and detail level. Cached summaries do not use daily quota.
              </p>
            ) : null}

            {summary ? (
              <article>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    {cached ? 'Cached summary' : model}
                    {quota ? ` · ${quota.remaining}/${quota.limit} free requests left today` : ''}
                  </p>
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() =>
                      onSaveAsNote(
                        SummaryService.formatAsNote({
                          summary,
                          pageStart: selectedRange.start,
                          pageEnd: selectedRange.end,
                          language,
                        }),
                        selectedRange.start,
                      )
                    }
                  >
                    Save summary as note
                  </Button>
                </div>
                <div className="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm leading-6 text-foreground">
                  {summary}
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
