'use client';

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

import type { PdfChapter } from '@/types/summary';

type TextContent = Awaited<ReturnType<PDFPageProxy['getTextContent']>>;
type TextItemLike = { str: string; hasEOL?: boolean };

const pageTextCache = new WeakMap<PDFDocumentProxy, Map<number, Promise<string>>>();

function cacheFor(pdf: PDFDocumentProxy) {
  let cache = pageTextCache.get(pdf);
  if (!cache) {
    cache = new Map();
    pageTextCache.set(pdf, cache);
  }
  return cache;
}

function textFromContent(content: TextContent): string {
  const pieces: string[] = [];
  for (const raw of content.items) {
    if (!('str' in raw) || typeof raw.str !== 'string') continue;
    const item = raw as TextItemLike;
    if (item.str) pieces.push(item.str);
    pieces.push(item.hasEOL ? '\n' : ' ');
  }
  return pieces
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractPdfPageText(
  pdf: PDFDocumentProxy,
  pageNumber: number,
): Promise<string> {
  const cache = cacheFor(pdf);
  const existing = cache.get(pageNumber);
  if (existing) return existing;

  const pending = pdf
    .getPage(pageNumber)
    .then((page) => page.getTextContent())
    .then(textFromContent)
    .catch((error) => {
      cache.delete(pageNumber);
      throw error;
    });
  cache.set(pageNumber, pending);
  return pending;
}

export async function extractPdfRangeText(
  pdf: PDFDocumentProxy,
  pageStart: number,
  pageEnd: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<string> {
  const total = pageEnd - pageStart + 1;
  const pages: string[] = [];

  // Sequential extraction avoids a burst of worker requests on large ranges.
  for (let page = pageStart; page <= pageEnd; page += 1) {
    const text = await extractPdfPageText(pdf, page);
    if (text) pages.push(`--- Page ${page} ---\n${text}`);
    onProgress?.(page - pageStart + 1, total);
  }
  return pages.join('\n\n').trim();
}

async function destinationPage(
  pdf: PDFDocumentProxy,
  destination: string | unknown[] | null | undefined,
): Promise<number | null> {
  let resolved: unknown[] | null = null;
  if (typeof destination === 'string') {
    resolved = await pdf.getDestination(destination);
  } else if (Array.isArray(destination)) {
    resolved = destination;
  }
  const ref = resolved?.[0];
  if (!ref) return null;

  if (typeof ref === 'number') return ref + 1;
  try {
    return (await pdf.getPageIndex(ref as Parameters<PDFDocumentProxy['getPageIndex']>[0])) + 1;
  } catch {
    return null;
  }
}

/** Top-level PDF outline entries become chapter ranges. */
export async function getPdfChapters(pdf: PDFDocumentProxy): Promise<PdfChapter[]> {
  const outline = await pdf.getOutline();
  if (!outline?.length) return [];

  const starts: Array<{ title: string; startPage: number }> = [];
  for (const item of outline) {
    const startPage = await destinationPage(pdf, item.dest);
    const title = item.title?.trim();
    if (startPage && title) starts.push({ title, startPage });
  }

  starts.sort((a, b) => a.startPage - b.startPage);
  return starts.map((chapter, index) => ({
    title: chapter.title,
    startPage: chapter.startPage,
    endPage: Math.max(
      chapter.startPage,
      Math.min(pdf.numPages, (starts[index + 1]?.startPage ?? pdf.numPages + 1) - 1),
    ),
  }));
}
