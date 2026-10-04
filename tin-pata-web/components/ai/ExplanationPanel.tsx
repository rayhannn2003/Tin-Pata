'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';

import { AIPrivacyNote } from '@/components/ai/AIPrivacyNote';
import { ExplanationModeSelector } from '@/components/ai/ExplanationModeSelector';
import { SentenceBreakdown } from '@/components/ai/SentenceBreakdown';
import { VocabularyList } from '@/components/ai/VocabularyList';
import { Button } from '@/components/ui/Button';
import { AIService } from '@/services/AIService';
import type { AIExplainResult, AIRequestState, ExplanationMode } from '@/types/ai';
import { ROUTES } from '@/utils/constants';

interface ExplanationPanelProps {
  open: boolean;
  /** Normalized passage text. Changing it restarts the panel. */
  selectedText: string;
  pageNumber: number;
  bookId?: string;
  bookTitle?: string;
  defaultMode: ExplanationMode;
  /** Fired when the reader picks a different mode, so it can become the new default. */
  onModeChange?: (mode: ExplanationMode) => void;
  onClose: () => void;
}

const PREVIEW_CHARS = 220;

export function ExplanationPanel(props: ExplanationPanelProps) {
  if (!props.open || !props.selectedText.trim()) {
    return null;
  }

  // Remounting per selection resets mode, result, and in-flight request together.
  return <ExplanationPanelInner key={props.selectedText} {...props} />;
}

function ExplanationPanelInner({
  selectedText,
  pageNumber,
  bookId,
  bookTitle,
  defaultMode,
  onModeChange,
  onClose,
}: ExplanationPanelProps) {
  const titleId = useId();
  const [request, setRequest] = useState({ mode: defaultMode, attempt: 0 });
  const [result, setResult] = useState<{ key: string; value: AIExplainResult } | null>(
    null,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { mode } = request;
  const requestKey = `${request.mode}:${request.attempt}`;

  // Derived rather than stored: a result belongs to exactly one request key, so anything
  // else is still in flight. Late responses from an abandoned request can never land.
  const state: AIRequestState =
    result?.key !== requestKey
      ? { status: 'loading' }
      : result.value.ok
        ? { status: 'success', response: result.value.response }
        : { status: 'error', code: result.value.code, message: result.value.message };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void AIService.explainText({
      text: selectedText,
      mode: request.mode,
      bookId,
      bookTitle,
      pageNumber,
      signal: controller.signal,
    }).then((value) => {
      if (active) {
        setResult({ key: requestKey, value });
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, selectedText]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const loading = state.status === 'loading';
  const copied = copiedKey === requestKey;

  function regenerate() {
    setRequest((prev) => ({ ...prev, attempt: prev.attempt + 1 }));
  }

  function handleModeChange(next: ExplanationMode) {
    setRequest({ mode: next, attempt: 0 });
    onModeChange?.(next);
  }

  async function handleCopy() {
    if (state.status !== 'success') return;
    try {
      await navigator.clipboard.writeText(
        AIService.formatAsPlainText(state.response, { bookTitle, pageNumber }),
      );
      setCopiedKey(requestKey);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setCopiedKey(null);
    }
  }

  const preview =
    selectedText.length > PREVIEW_CHARS
      ? `${selectedText.slice(0, PREVIEW_CHARS).trimEnd()}…`
      : selectedText;

  return (
    <aside
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-[65] flex max-h-[80vh] flex-col border border-border bg-surface shadow-lg rounded-t-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(28rem,100vw)] sm:rounded-none sm:rounded-l-xl"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            <span aria-hidden>✨</span> Tin Pata AI
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Page {pageNumber} · {selectedText.length.toLocaleString()} characters selected
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-tint-muted hover:text-foreground"
        >
          Close
        </button>
      </header>

      <div className="border-b border-border px-4 py-3">
        <blockquote className="max-h-24 overflow-y-auto border-l-2 border-border pl-3 text-sm italic text-muted">
          “{preview}”
        </blockquote>
        <div className="mt-3">
          <ExplanationModeSelector
            mode={mode}
            disabled={loading}
            onChange={handleModeChange}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <p className="flex items-center gap-2 text-sm text-muted">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-tint"
                aria-hidden
              />
              Explaining…
            </p>
            <div className="h-4 w-2/3 animate-pulse rounded bg-border/70" />
            <div className="h-20 animate-pulse rounded-lg bg-border/50" />
            <div className="h-16 animate-pulse rounded-lg bg-border/50" />
          </div>
        ) : null}

        {state.status === 'error' ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-red-600">{state.message}</p>
            {state.code === 'unauthorized' ? (
              <Link
                href={ROUTES.signIn}
                className="inline-flex text-sm font-medium text-tint hover:underline"
              >
                Go to sign in
              </Link>
            ) : (
              <Button variant="secondary" className="text-xs" onClick={regenerate}>
                Try again
              </Button>
            )}
          </div>
        ) : null}

        {state.status === 'success' ? (
          <div className="space-y-5">
            <section className="rounded-lg bg-tint-muted px-3 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-tint">
                Main idea
              </h3>
              <p className="mt-1 text-sm text-foreground">{state.response.mainIdea}</p>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tint">
                Explanation
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {state.response.explanation}
              </p>
            </section>

            {state.response.simpleEnglish ? (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tint">
                  In simpler words
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {state.response.simpleEnglish}
                </p>
              </section>
            ) : null}

            {state.response.banglaExplanation ? (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tint">
                  বাংলা
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {state.response.banglaExplanation}
                </p>
              </section>
            ) : null}

            <VocabularyList items={state.response.vocabulary} />
            <SentenceBreakdown items={state.response.sentenceBreakdown ?? []} />
          </div>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        <Button
          variant="secondary"
          className="text-xs"
          disabled={state.status !== 'success'}
          onClick={() => void handleCopy()}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button
          variant="ghost"
          className="text-xs"
          disabled={loading}
          onClick={regenerate}
        >
          Regenerate
        </Button>
        <div className="ml-auto">
          <Button variant="ghost" className="text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
        <AIPrivacyNote className="w-full" />
      </footer>
    </aside>
  );
}
