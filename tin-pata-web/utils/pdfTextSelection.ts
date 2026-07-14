import { DictionaryService } from '@/services/DictionaryService';

export type PdfSelectedWord = {
  word: string;
  pageNumber: number;
};

const WORD_CHAR = /[\p{L}\p{N}'’]/u;

export function pageNumberFromNode(node: Node | null): number | null {
  let el: Element | null =
    node instanceof Element ? node : node?.parentElement ?? null;
  while (el) {
    const page = el.getAttribute('data-page-number');
    if (page) {
      const n = Number.parseInt(page, 10);
      return Number.isFinite(n) ? n : null;
    }
    el = el.parentElement;
  }
  return null;
}

function findTextLayer(node: Node | null): HTMLElement | null {
  let el: Element | null =
    node instanceof Element ? node : node?.parentElement ?? null;
  while (el) {
    if (el.classList.contains('textLayer')) {
      return el as HTMLElement;
    }
    el = el.parentElement;
  }
  return null;
}

function caretFromPoint(
  clientX: number,
  clientY: number,
): { node: Node; offset: number } | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
  };

  if (typeof doc.caretRangeFromPoint === 'function') {
    const range = doc.caretRangeFromPoint(clientX, clientY);
    if (range?.startContainer) {
      return { node: range.startContainer, offset: range.startOffset };
    }
  }

  if (typeof doc.caretPositionFromPoint === 'function') {
    const pos = doc.caretPositionFromPoint(clientX, clientY);
    if (pos?.offsetNode) {
      return { node: pos.offsetNode, offset: pos.offset };
    }
  }

  return null;
}

type MappedChar = {
  char: string;
  node: Text;
  offset: number;
};

/**
 * Flatten selectable text-layer characters (PDF.js often puts 1 glyph per span).
 * Soft hyphen + newline joins are treated as continued words.
 */
function mapTextLayerChars(textLayer: HTMLElement): MappedChar[] {
  const mapped: MappedChar[] = [];
  const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains('endOfContent')) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.getAttribute('role') === 'img') {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.textContent) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let previousWasHyphen = false;
  let node = walker.nextNode() as Text | null;
  while (node) {
    const value = node.data;
    for (let i = 0; i < value.length; i += 1) {
      const char = value[i]!;
      // Soft hyphen / end-of-line hyphen: skip and join next letters into one word.
      if (char === '\u00AD' || (char === '-' && i === value.length - 1)) {
        previousWasHyphen = true;
        continue;
      }
      if (previousWasHyphen && /\s/.test(char)) {
        continue;
      }
      previousWasHyphen = false;
      mapped.push({ char, node, offset: i });
    }
    node = walker.nextNode() as Text | null;
  }
  return mapped;
}

function indexAtCaret(mapped: MappedChar[], node: Node, offset: number): number {
  if (node.nodeType !== Node.TEXT_NODE) {
    // Click landed on element — use first text descendant if any.
    const text = node instanceof Element ? node.firstChild : null;
    if (!(text instanceof Text) || mapped.length === 0) {
      return -1;
    }
    return indexAtCaret(mapped, text, 0);
  }

  for (let i = 0; i < mapped.length; i += 1) {
    const item = mapped[i]!;
    if (item.node === node && item.offset === offset) {
      return i;
    }
  }

  // Caret often sits after the clicked glyph (offset = i+1). Prefer the prior char.
  if (offset > 0) {
    for (let i = 0; i < mapped.length; i += 1) {
      const item = mapped[i]!;
      if (item.node === node && item.offset === offset - 1) {
        return i;
      }
    }
  }

  for (let i = 0; i < mapped.length; i += 1) {
    if (mapped[i]!.node === node) {
      return i;
    }
  }
  return -1;
}

function expandWordRange(
  mapped: MappedChar[],
  index: number,
): { start: number; end: number; raw: string } | null {
  if (index < 0 || index >= mapped.length) return null;
  if (!WORD_CHAR.test(mapped[index]!.char)) return null;

  let start = index;
  while (start > 0 && WORD_CHAR.test(mapped[start - 1]!.char)) {
    start -= 1;
  }
  let end = index;
  while (end + 1 < mapped.length && WORD_CHAR.test(mapped[end + 1]!.char)) {
    end += 1;
  }

  const raw = mapped
    .slice(start, end + 1)
    .map((c) => c.char)
    .join('');
  return { start, end, raw };
}

function applyDomSelection(mapped: MappedChar[], start: number, end: number) {
  const from = mapped[start];
  const to = mapped[end];
  if (!from || !to) return;

  const range = document.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset + 1);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Professional PDF double-click: expand across glyph-per-span text layers,
 * highlight the full word, and return a dictionary-ready token.
 */
export function selectWordAtPoint(
  clientX: number,
  clientY: number,
  container: HTMLElement,
): PdfSelectedWord | null {
  const caret = caretFromPoint(clientX, clientY);
  if (!caret || !container.contains(caret.node)) {
    return null;
  }

  const textLayer = findTextLayer(caret.node);
  if (!textLayer || !container.contains(textLayer)) {
    return null;
  }

  const pageNumber = pageNumberFromNode(textLayer);
  if (pageNumber == null) {
    return null;
  }

  const mapped = mapTextLayerChars(textLayer);
  const index = indexAtCaret(mapped, caret.node, caret.offset);
  const expanded = expandWordRange(mapped, index);
  if (!expanded) {
    return null;
  }

  const word = DictionaryService.normalizeWord(expanded.raw);
  if (!word || word.length < 2) {
    return null;
  }

  applyDomSelection(mapped, expanded.start, expanded.end);
  return { word, pageNumber };
}

const HIGHLIGHT_NAME = 'tinpata-dict-word';

function ensureHighlightStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('tinpata-dict-hl-style')) return;
  const style = document.createElement('style');
  style.id = 'tinpata-dict-hl-style';
  // Injected at runtime — Lightning CSS (Tailwind) rejects ::highlight().
  style.textContent = `
    ::highlight(${HIGHLIGHT_NAME}) {
      background-color: color-mix(in srgb, var(--tint) 40%, transparent);
      color: inherit;
    }
  `;
  document.head.appendChild(style);
}

/** Persist the current selection as a CSS Custom Highlight (when supported). */
export function highlightCurrentSelection(): boolean {
  if (typeof window === 'undefined') return false;
  ensureHighlightStyles();
  const HighlightCtor = (
    window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }
  ).Highlight;
  const highlights = (
    CSS as typeof CSS & { highlights?: Map<string, unknown> }
  ).highlights;
  if (!HighlightCtor || !highlights) return false;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const range = sel.getRangeAt(0).cloneRange();
  highlights.set(HIGHLIGHT_NAME, new HighlightCtor(range));
  return true;
}

export function clearWordHighlight() {
  if (typeof window === 'undefined') return;
  const highlights = (
    CSS as typeof CSS & { highlights?: { delete: (name: string) => void } }
  ).highlights;
  highlights?.delete(HIGHLIGHT_NAME);
}

/** First word from the current drag-selection (single page only). */
export function selectionWordInContainer(
  container: HTMLElement,
): PdfSelectedWord | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    return null;
  }
  const raw = sel.toString().trim();
  if (!raw) {
    return null;
  }

  const anchor = sel.anchorNode;
  const focus = sel.focusNode;
  if (!anchor || !container.contains(anchor)) {
    return null;
  }

  const pageA = pageNumberFromNode(anchor);
  const pageB = focus ? pageNumberFromNode(focus) : pageA;
  if (pageA == null || pageB == null || pageA !== pageB) {
    return null;
  }

  const token = raw.split(/\s+/)[0] ?? raw;
  const word = DictionaryService.normalizeWord(token);
  if (!word || word.length < 2) {
    return null;
  }
  return { word, pageNumber: pageA };
}
