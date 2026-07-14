'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { TextLayer, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist';

import type { ReaderCheckpoint } from '@/types/checkpoint';
import { formatDateTime } from '@/utils/date';
import '@/styles/pdf-text-layer.css';

type TextContent = Awaited<ReturnType<PDFPageProxy['getTextContent']>>;

interface PdfPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  textContentCache: Map<number, TextContent | null>;
  checkpoints?: ReaderCheckpoint[];
  checkpointDrawMode?: boolean;
  onRenderedHeight?: (pageNumber: number, height: number) => void;
  onTextAvailability?: (pageNumber: number, hasText: boolean) => void;
  onCheckpointDraw?: (payload: {
    pageNumber: number;
    yRatio: number;
    xStartRatio: number;
    xEndRatio: number;
  }) => void;
  onCheckpointDelete?: (id: string) => void;
}

type DrawState = { x0: number; y0: number; x1: number; y1: number } | null;

function PdfPageInner({
  pdf,
  pageNumber,
  width,
  textContentCache,
  checkpoints = [],
  checkpointDrawMode = false,
  onRenderedHeight,
  onTextAvailability,
  onCheckpointDraw,
  onCheckpointDelete,
}: PdfPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [hasText, setHasText] = useState(true);
  const [pageSize, setPageSize] = useState({ w: width, h: Math.round(width * 1.3) });
  const [draft, setDraft] = useState<DrawState>(null);
  const drawingRef = useRef(false);
  const draftRef = useRef<DrawState>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    let textLayer: TextLayer | null = null;

    async function render() {
      setError(false);
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || !pageRef.current || !canvasRef.current || !textLayerRef.current) {
          return;
        }

        const unscaled = page.getViewport({ scale: 1 });
        const scale = width / unscaled.width;
        const viewport = page.getViewport({ scale });
        const cssWidth = Math.floor(viewport.width);
        const cssHeight = Math.floor(viewport.height);
        setPageSize({ w: cssWidth, h: cssHeight });

        pageRef.current.style.setProperty('--scale-factor', String(viewport.scale));

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) {
          return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const task = page.render({
          canvasContext: context,
          viewport,
        });
        renderTask = task;
        await task.promise;
        if (cancelled) {
          return;
        }
        onRenderedHeight?.(pageNumber, cssHeight);

        let textContent = textContentCache.get(pageNumber);
        if (textContent === undefined) {
          textContent = await page.getTextContent();
          if (cancelled) {
            return;
          }
          const meaningful = textContent.items.some((item) => {
            if (!('str' in item)) return false;
            return typeof item.str === 'string' && item.str.trim().length > 0;
          });
          textContentCache.set(pageNumber, meaningful ? textContent : null);
          textContent = meaningful ? textContent : null;
        }

        const layerHasText = textContent != null;
        setHasText(layerHasText);
        onTextAvailability?.(pageNumber, layerHasText);

        const container = textLayerRef.current;
        container.replaceChildren();
        if (!layerHasText || !textContent) {
          return;
        }

        textLayer = new TextLayer({
          textContentSource: textContent,
          container,
          viewport,
        });
        await textLayer.render();
        if (cancelled) {
          return;
        }

        const endOfContent = document.createElement('div');
        endOfContent.className = 'endOfContent';
        container.append(endOfContent);
      } catch (err) {
        if (!cancelled && (err as { name?: string }).name !== 'RenderingCancelledException') {
          setError(true);
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        // ignore
      }
      try {
        textLayer?.cancel();
      } catch {
        // ignore
      }
    };
  }, [pdf, pageNumber, width, textContentCache, onRenderedHeight, onTextAvailability]);

  useEffect(() => {
    const layer = textLayerRef.current;
    if (!layer || checkpointDrawMode) return;

    function onPointerDown() {
      layer?.classList.add('selecting');
    }

    function onPointerUp() {
      layer?.classList.remove('selecting');
    }

    layer.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    return () => {
      layer.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      layer.classList.remove('selecting');
    };
  }, [hasText, pageNumber, checkpointDrawMode]);

  useEffect(() => {
    if (!checkpointDrawMode) {
      setDraft(null);
      drawingRef.current = false;
    }
  }, [checkpointDrawMode]);

  function localPoint(event: React.PointerEvent) {
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function handleDrawDown(event: React.PointerEvent) {
    if (!checkpointDrawMode) return;
    event.preventDefault();
    const point = localPoint(event);
    if (!point) return;
    drawingRef.current = true;
    setDraft({ x0: point.x, y0: point.y, x1: point.x, y1: point.y });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function handleDrawMove(event: React.PointerEvent) {
    if (!drawingRef.current) return;
    const point = localPoint(event);
    if (!point) return;
    setDraft((prev) => (prev ? { ...prev, x1: point.x, y1: point.y } : prev));
  }

  function handleDrawUp(event: React.PointerEvent) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const point = localPoint(event);
    const current = draftRef.current;
    const finalDraft = current
      ? {
          ...current,
          x1: point?.x ?? current.x1,
          y1: point?.y ?? current.y1,
        }
      : null;
    setDraft(null);
    draftRef.current = null;

    if (!finalDraft || !onCheckpointDraw) return;

    const xStart = Math.min(finalDraft.x0, finalDraft.x1);
    const xEnd = Math.max(finalDraft.x0, finalDraft.x1);
    const yRatio = (finalDraft.y0 + finalDraft.y1) / 2;
    // Require a visible stroke so clicks alone don't create noise.
    if (xEnd - xStart < 0.06) return;

    onCheckpointDraw({
      pageNumber,
      yRatio,
      xStartRatio: xStart,
      xEndRatio: xEnd,
    });
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-surface text-sm text-muted"
        style={{ width, minHeight: width * 1.3 }}
      >
        Failed to render page {pageNumber}
      </div>
    );
  }

  const draftLeft = draft ? Math.min(draft.x0, draft.x1) : 0;
  const draftWidth = draft ? Math.abs(draft.x1 - draft.x0) : 0;
  const draftTop = draft ? (draft.y0 + draft.y1) / 2 : 0;

  return (
    <div
      ref={pageRef}
      className={`pdf-page mx-auto${hasText ? '' : ' pdf-page--no-text'}${
        checkpointDrawMode ? ' pdf-page--checkpoint-draw' : ''
      }`}
      style={{ width: pageSize.w, height: pageSize.h }}
      data-page-number={pageNumber}
    >
      <canvas ref={canvasRef} aria-label={`Page ${pageNumber}`} />
      <div ref={textLayerRef} className="textLayer" />

      {checkpoints.map((cp) => {
        const left = Math.min(cp.xStartRatio, cp.xEndRatio) * 100;
        const widthPct = Math.abs(cp.xEndRatio - cp.xStartRatio) * 100;
        return (
          <div
            key={cp.id}
            className="pdf-checkpoint group"
            style={{
              top: `${cp.yRatio * 100}%`,
              left: `${left}%`,
              width: `${Math.max(widthPct, 8)}%`,
            }}
          >
            <div className="pdf-checkpoint__line" />
            <div className="pdf-checkpoint__label">
              <span>{formatDateTime(cp.createdAt)}</span>
              <button
                type="button"
                className="pdf-checkpoint__delete"
                aria-label="Delete checkpoint"
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckpointDelete?.(cp.id);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      {draft ? (
        <div
          className="pdf-checkpoint pdf-checkpoint--draft"
          style={{
            top: `${draftTop * 100}%`,
            left: `${draftLeft * 100}%`,
            width: `${Math.max(draftWidth * 100, 2)}%`,
          }}
        >
          <div className="pdf-checkpoint__line" />
        </div>
      ) : null}

      {checkpointDrawMode ? (
        <div
          className="pdf-checkpoint-draw-layer"
          onPointerDown={handleDrawDown}
          onPointerMove={handleDrawMove}
          onPointerUp={handleDrawUp}
          onPointerCancel={() => {
            drawingRef.current = false;
            setDraft(null);
          }}
        />
      ) : null}
    </div>
  );
}

export const PdfPage = memo(PdfPageInner);
