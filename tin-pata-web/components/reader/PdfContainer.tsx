'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

import { ExplainSelectionAction } from '@/components/ai/ExplainSelectionAction';
import { PdfPage } from '@/components/reader/PdfPage';
import { AIService } from '@/services/AIService';
import type { ReaderCheckpoint } from '@/types/checkpoint';
import type { ReaderZoomMode } from '@/types/reader';
import { throttle } from '@/utils/debounce';
import {
  selectWordAtPoint,
  selectionPassageInContainer,
  selectionWordInContainer,
  type PdfSelectedPassage,
  type PdfSelectedWord,
} from '@/utils/pdfTextSelection';

type TextContent = Awaited<ReturnType<PDFPageProxy['getTextContent']>>;

interface PdfContainerProps {
  pdf: PDFDocumentProxy;
  pageCount: number;
  initialPage: number;
  zoomMode: ReaderZoomMode;
  zoomScale: number;
  onPageChange: (page: number) => void;
  onZoomScaleResolved?: (scale: number) => void;
  scrollToPageRequest?: number | null;
  onScrollToPageHandled?: () => void;
  /** Lookup a word (drag-select + right-click, or double-click). */
  onWordSelect?: (word: string, pageNumber: number) => void;
  /** When true, right-click closes the dictionary instead of looking up. */
  dictionaryOpen?: boolean;
  onCloseDictionary?: () => void;
  /** When false, double-click still selects the word but does not open dictionary. */
  openOnDoubleClick?: boolean;
  /** Opens the AI explanation panel for a selected passage. */
  onExplainSelection?: (passage: { text: string; pageNumber: number }) => void;
  checkpoints?: ReaderCheckpoint[];
  checkpointDrawMode?: boolean;
  onCheckpointDraw?: (payload: {
    pageNumber: number;
    yRatio: number;
    xStartRatio: number;
    xEndRatio: number;
  }) => void;
  onCheckpointDelete?: (id: string) => void;
}

const PAGE_GAP = 16;
const DEFAULT_ASPECT = 1.294;

export function PdfContainer({
  pdf,
  pageCount,
  initialPage,
  zoomMode,
  zoomScale,
  onPageChange,
  onZoomScaleResolved,
  scrollToPageRequest,
  onScrollToPageHandled,
  onWordSelect,
  dictionaryOpen = false,
  onCloseDictionary,
  openOnDoubleClick = true,
  onExplainSelection,
  checkpoints = [],
  checkpointDrawMode = false,
  onCheckpointDraw,
  onCheckpointDelete,
}: PdfContainerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const lastSelectionRef = useRef<PdfSelectedWord | null>(null);
  const [explainPassage, setExplainPassage] = useState<PdfSelectedPassage | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 720, height: 600 });
  const [basePageSize, setBasePageSize] = useState({ width: 612, height: 792 });
  const heightMapRef = useRef<Map<number, number>>(new Map());
  const textContentCacheRef = useRef<Map<number, TextContent | null>>(new Map());
  const [, bump] = useState(0);
  const [textHint, setTextHint] = useState<'unknown' | 'ok' | 'none'>('unknown');
  const textSeenRef = useRef({ ok: false, none: false });

  useEffect(() => {
    textContentCacheRef.current = new Map();
    textSeenRef.current = { ok: false, none: false };
    setTextHint('unknown');
  }, [pdf]);

  useEffect(() => {
    let cancelled = false;
    void pdf.getPage(1).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1 });
      setBasePageSize({ width: viewport.width, height: viewport.height });
    });
    return () => {
      cancelled = true;
    };
  }, [pdf]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width: Math.max(280, width), height: Math.max(200, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const resolvedScale = useMemo(() => {
    const available = Math.max(240, containerSize.width - 48);
    if (zoomMode === 'fit-width') {
      return available / basePageSize.width;
    }
    if (zoomMode === 'fit-page') {
      const byWidth = available / basePageSize.width;
      const byHeight = (containerSize.height - 48) / basePageSize.height;
      return Math.min(byWidth, byHeight);
    }
    return zoomScale;
  }, [zoomMode, zoomScale, containerSize, basePageSize]);

  useEffect(() => {
    onZoomScaleResolved?.(resolvedScale);
  }, [resolvedScale, onZoomScaleResolved]);

  const pageWidth = Math.floor(basePageSize.width * resolvedScale);
  const estimatedHeight = Math.floor(
    (basePageSize.height / basePageSize.width) * pageWidth || pageWidth * DEFAULT_ASPECT,
  );

  const estimateSize = useCallback(
    (index: number) => heightMapRef.current.get(index + 1) ?? estimatedHeight,
    [estimatedHeight],
  );

  const virtualizer = useVirtualizer({
    count: pageCount,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 2,
    gap: PAGE_GAP,
    paddingStart: 16,
    paddingEnd: 24,
  });

  const onRenderedHeight = useCallback(
    (pageNumber: number, height: number) => {
      const prev = heightMapRef.current.get(pageNumber);
      if (prev === height) return;
      heightMapRef.current.set(pageNumber, height);
      virtualizer.measure();
      bump((n) => n + 1);
    },
    [virtualizer],
  );

  const onTextAvailability = useCallback((pageNumber: number, hasText: boolean) => {
    void pageNumber;
    if (hasText) {
      textSeenRef.current.ok = true;
      setTextHint('ok');
      return;
    }
    textSeenRef.current.none = true;
    if (!textSeenRef.current.ok) {
      setTextHint('none');
    }
  }, []);

  const cacheSelection = useCallback(() => {
    if (!parentRef.current) return;
    lastSelectionRef.current = selectionWordInContainer(parentRef.current);

    if (!onExplainSelection) {
      return;
    }
    // Offer "Explain" only for passage-sized selections; single words go to the dictionary.
    const passage = selectionPassageInContainer(parentRef.current);
    setExplainPassage(passage && AIService.canExplain(passage.text) ? passage : null);
  }, [onExplainSelection]);

  const dismissExplain = useCallback(() => {
    setExplainPassage(null);
  }, []);

  // The chip is anchored to viewport coordinates, so anything that moves the page
  // invalidates it. Dismissing also keeps it out of the way of normal reading.
  useEffect(() => {
    if (!explainPassage) return;
    const el = parentRef.current;
    const clear = () => setExplainPassage(null);
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') clear();
    }
    el?.addEventListener('scroll', clear, { passive: true });
    window.addEventListener('resize', clear);
    document.addEventListener('keydown', onKey);
    return () => {
      el?.removeEventListener('scroll', clear);
      window.removeEventListener('resize', clear);
      document.removeEventListener('keydown', onKey);
    };
  }, [explainPassage]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (dictionaryOpen) {
        onCloseDictionary?.();
        return;
      }
      if (!onWordSelect) {
        return;
      }
      // Prefer live selection; fall back to last drag/double-click (some browsers clear on right-click).
      const live = parentRef.current
        ? selectionWordInContainer(parentRef.current)
        : null;
      const result = live ?? lastSelectionRef.current;
      if (!result) {
        return;
      }
      onWordSelect(result.word, result.pageNumber);
    },
    [dictionaryOpen, onCloseDictionary, onWordSelect],
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!parentRef.current) {
        return;
      }
      // Override native glyph-span selection with a full-word expand.
      event.preventDefault();
      const result = selectWordAtPoint(
        event.clientX,
        event.clientY,
        parentRef.current,
      );
      if (!result) {
        return;
      }
      lastSelectionRef.current = result;
      if (openOnDoubleClick && onWordSelect) {
        onWordSelect(result.word, result.pageNumber);
      }
    },
    [onWordSelect, openOnDoubleClick],
  );

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const report = throttle(() => {
      const items = virtualizer.getVirtualItems();
      if (items.length === 0) return;
      const scrollOffset = el.scrollTop + el.clientHeight / 3;
      let current = items[0]?.index ?? 0;
      for (const item of items) {
        if (item.start <= scrollOffset) {
          current = item.index;
        }
      }
      onPageChange(current + 1);
    }, 120);

    el.addEventListener('scroll', report, { passive: true });
    report();
    return () => el.removeEventListener('scroll', report);
  }, [virtualizer, onPageChange, pageCount]);

  useEffect(() => {
    const target = scrollToPageRequest ?? initialPage;
    if (target < 1 || target > pageCount) return;
    const frame = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(target - 1, { align: 'start' });
      if (scrollToPageRequest != null) {
        onScrollToPageHandled?.();
      }
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToPageRequest, pdf]);

  useEffect(() => {
    heightMapRef.current.clear();
    virtualizer.measure();
  }, [resolvedScale, virtualizer]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {textHint === 'none' ? (
        <p className="shrink-0 border-b border-border bg-surface px-4 py-2 text-center text-xs text-muted">
          No selectable text in this PDF (likely scanned). Use Dictionary (D) and type a word.
        </p>
      ) : null}
      {checkpointDrawMode ? (
        <p className="shrink-0 border-b border-border bg-tint-muted px-4 py-2 text-center text-xs text-tint">
          Checkpoint mode — draw a line across the last line you read. Esc to cancel.
        </p>
      ) : null}
      <div
        ref={parentRef}
        className="h-full min-h-0 flex-1 overflow-y-auto bg-[color-mix(in_srgb,var(--background)_88%,#000_6%)]"
        role="document"
        aria-label="PDF pages"
        onMouseDown={checkpointDrawMode ? undefined : dismissExplain}
        onMouseUp={checkpointDrawMode ? undefined : cacheSelection}
        onKeyUp={checkpointDrawMode ? undefined : cacheSelection}
        onContextMenu={checkpointDrawMode ? undefined : handleContextMenu}
        onDoubleClick={checkpointDrawMode ? undefined : handleDoubleClick}
      >
        <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map((item) => {
            const pageNumber = item.index + 1;
            return (
            <div
              key={item.key}
              data-index={item.index}
              className="absolute left-0 w-full"
              style={{
                // Prefer `top` over `transform` so text selection rectangles stay accurate.
                top: `${item.start}px`,
                height: `${item.size}px`,
              }}
            >
              <PdfPage
                pdf={pdf}
                pageNumber={pageNumber}
                width={pageWidth}
                textContentCache={textContentCacheRef.current}
                checkpoints={checkpoints.filter((cp) => cp.pageNumber === pageNumber)}
                checkpointDrawMode={checkpointDrawMode}
                onRenderedHeight={onRenderedHeight}
                onTextAvailability={onTextAvailability}
                onCheckpointDraw={onCheckpointDraw}
                onCheckpointDelete={onCheckpointDelete}
              />
            </div>
            );
          })}
        </div>
      </div>

      {explainPassage && onExplainSelection && !checkpointDrawMode ? (
        <ExplainSelectionAction
          rect={explainPassage.rect}
          onExplain={() => {
            const { text, pageNumber } = explainPassage;
            setExplainPassage(null);
            onExplainSelection({ text, pageNumber });
          }}
        />
      ) : null}
    </div>
  );
}
