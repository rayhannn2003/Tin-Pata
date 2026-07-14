import type {
  DictionaryEntry,
  DictionaryLookupResult,
  DictionaryMode,
  DictionaryRecentItem,
} from '@/types/dictionary';
import { DICTIONARY_NOTE_TEMPLATE } from '@/types/dictionary';
import { storage } from '@/utils/storage';

const OFFLINE_CACHE_KEY = 'tinpata.dict.offline.v1';
const RECENT_KEY = 'tinpata.dict.recent.v1';
const MAX_OFFLINE = 200;
const MAX_RECENT = 30;

function normalizeWord(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function readOfflineCache(): Record<string, DictionaryEntry[]> {
  try {
    const raw = storage.get(OFFLINE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, DictionaryEntry[]>) : {};
  } catch {
    return {};
  }
}

function writeOfflineCache(map: Record<string, DictionaryEntry[]>) {
  const keys = Object.keys(map);
  if (keys.length > MAX_OFFLINE) {
    for (const key of keys.slice(0, keys.length - MAX_OFFLINE)) {
      delete map[key];
    }
  }
  storage.set(OFFLINE_CACHE_KEY, JSON.stringify(map));
}

function offlineKey(word: string, mode: DictionaryMode) {
  return `${mode}:${word}`;
}

function readRecent(): DictionaryRecentItem[] {
  try {
    const raw = storage.get(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DictionaryRecentItem[]) : [];
  } catch {
    return [];
  }
}

function writeRecent(items: DictionaryRecentItem[]) {
  storage.set(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
}

export const DictionaryService = {
  normalizeWord,

  getRecent(): DictionaryRecentItem[] {
    return readRecent();
  },

  clearRecent() {
    storage.remove(RECENT_KEY);
  },

  pushRecent(entry: DictionaryEntry, save: boolean) {
    if (!save) return;
    const preview =
      entry.bangla ||
      entry.meanings[0]?.definitions[0]?.definition ||
      entry.word;
    const next: DictionaryRecentItem = {
      word: entry.word,
      mode: entry.mode,
      bangla: entry.bangla,
      preview: preview.slice(0, 80),
      lookedUpAt: new Date().toISOString(),
    };
    const rest = readRecent().filter(
      (item) => !(item.word.toLowerCase() === next.word.toLowerCase() && item.mode === next.mode),
    );
    writeRecent([next, ...rest]);
  },

  async lookup(
    rawWord: string,
    mode: DictionaryMode = 'en-bn',
    options?: { saveRecent?: boolean },
  ): Promise<DictionaryLookupResult> {
    const word = normalizeWord(rawWord);
    if (!word) {
      return { ok: false, error: 'Enter a word to look up.' };
    }

    const cache = readOfflineCache();
    const cached = cache[offlineKey(word, mode)];
    if (cached?.length) {
      if (options?.saveRecent !== false) {
        this.pushRecent(cached[0]!, true);
      }
      return { ok: true, entries: cached, cached: true };
    }

    try {
      const res = await fetch(
        `/api/dictionary?word=${encodeURIComponent(word)}&mode=${encodeURIComponent(mode)}`,
        { method: 'GET', headers: { Accept: 'application/json' } },
      );
      const data = (await res.json()) as DictionaryLookupResult;

      if (data.ok) {
        cache[offlineKey(word, mode)] = data.entries;
        writeOfflineCache(cache);
        if (options?.saveRecent !== false) {
          this.pushRecent(data.entries[0]!, true);
        }
      }
      return data;
    } catch {
      return {
        ok: false,
        error: 'Could not reach the dictionary. Check your connection and retry.',
      };
    }
  },

  formatAsNote(entry: DictionaryEntry, pageNumber: number, template = DICTIONARY_NOTE_TEMPLATE) {
    const meaningLines: string[] = [];
    for (const meaning of entry.meanings.slice(0, 4)) {
      meaningLines.push(`[${meaning.partOfSpeech || 'sense'}]`);
      for (const def of meaning.definitions.slice(0, 3)) {
        meaningLines.push(`• ${def.definition}`);
        if (def.example) {
          meaningLines.push(`  e.g. ${def.example}`);
        }
      }
      meaningLines.push('');
    }

    return template
      .replaceAll('{{word}}', entry.word)
      .replaceAll('{{bangla}}', entry.bangla ? ` — ${entry.bangla}` : '')
      .replaceAll('{{phonetic}}', entry.phonetic ? `${entry.phonetic}\n` : '')
      .replaceAll('{{page}}', String(pageNumber))
      .replaceAll('{{meanings}}', meaningLines.join('\n').trim())
      .trim();
  },
};
