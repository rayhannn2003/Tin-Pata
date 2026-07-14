import type {
  DictionaryEntry,
  DictionaryLookupResult,
  DictionaryMode,
} from '@/types/dictionary';

type CacheEntry = { expiresAt: number; result: DictionaryLookupResult };

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function cacheKey(word: string, mode: DictionaryMode) {
  return `${mode}:${word}`;
}

export function getCachedLookup(
  word: string,
  mode: DictionaryMode,
): DictionaryLookupResult | null {
  const hit = memoryCache.get(cacheKey(word, mode));
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(cacheKey(word, mode));
    return null;
  }
  return hit.result;
}

export function setCachedLookup(
  word: string,
  mode: DictionaryMode,
  result: DictionaryLookupResult,
) {
  if (!result.ok) return;
  memoryCache.set(cacheKey(word, mode), {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result,
  });
}

function normalizeWord(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function parseDetails(details: string | null | undefined): string[] {
  if (!details?.trim()) return [];
  return details
    .split(',')
    .map((part) => part.replace(/\([^)]*\)/g, '').trim())
    .filter(Boolean);
}

async function lookupEnglishOnly(word: string): Promise<DictionaryLookupResult> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    { headers: { Accept: 'application/json' }, next: { revalidate: 86400 } },
  );

  if (res.status === 404) {
    return { ok: false, notFound: true, error: `No definition found for “${word}”.` };
  }
  if (!res.ok) {
    return { ok: false, error: `Dictionary service error (${res.status}). Try again.` };
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    return { ok: false, notFound: true, error: `No definition found for “${word}”.` };
  }

  const entries: DictionaryEntry[] = data.map((item) => {
    const raw = item as Record<string, unknown>;
    const phoneticsRaw = Array.isArray(raw.phonetics) ? raw.phonetics : [];
    const meaningsRaw = Array.isArray(raw.meanings) ? raw.meanings : [];
    const phonetics = phoneticsRaw.map((p) => {
      const row = p as Record<string, unknown>;
      return {
        text: typeof row.text === 'string' ? row.text : undefined,
        audio: typeof row.audio === 'string' && row.audio ? row.audio : undefined,
      };
    });
    const meanings = meaningsRaw.map((m) => {
      const row = m as Record<string, unknown>;
      const defs = Array.isArray(row.definitions) ? row.definitions : [];
      return {
        partOfSpeech: typeof row.partOfSpeech === 'string' ? row.partOfSpeech : '',
        definitions: defs.map((d) => {
          const def = d as Record<string, unknown>;
          return {
            definition: typeof def.definition === 'string' ? def.definition : '',
            example: typeof def.example === 'string' ? def.example : undefined,
          };
        }),
      };
    });
    const phonetic =
      typeof raw.phonetic === 'string'
        ? raw.phonetic
        : phonetics.find((p) => p.text)?.text;

    return {
      word: typeof raw.word === 'string' ? raw.word : word,
      phonetic,
      phonetics,
      meanings,
      mode: 'en' as const,
    };
  });

  return { ok: true, entries };
}

async function lookupEnBn(word: string): Promise<DictionaryLookupResult> {
  const { findWordByEnglish } = await import('e2b_word_bank');
  const hit = findWordByEnglish(word);
  const english = await lookupEnglishOnly(word);

  if (!hit && (!english.ok || english.entries.length === 0)) {
    return {
      ok: false,
      notFound: true,
      error: `No English→Bangla entry for “${word}”.`,
    };
  }

  const bangla = hit?.bn?.trim() || undefined;
  const bnMeanings = [
    bangla,
    ...(hit?.bn_syns ?? []),
    ...parseDetails(hit?.details),
  ].filter((v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i);

  const entry: DictionaryEntry = {
    word: hit?.en || (english.ok ? english.entries[0]?.word : word) || word,
    bangla,
    phonetic: hit?.pron?.[0] || (english.ok ? english.entries[0]?.phonetic : undefined),
    phonetics: english.ok ? english.entries[0]?.phonetics ?? [] : [],
    meanings: [
      ...(bnMeanings.length
        ? [
            {
              partOfSpeech: 'বাংলা অর্থ',
              definitions: bnMeanings.map((definition) => ({ definition })),
            },
          ]
        : []),
      ...(english.ok
        ? english.entries.flatMap((e) =>
            e.meanings.map((m) => ({
              partOfSpeech: m.partOfSpeech ? `EN · ${m.partOfSpeech}` : 'EN',
              definitions: m.definitions,
            })),
          )
        : []),
      ...(hit?.sents?.length
        ? [
            {
              partOfSpeech: 'Examples',
              definitions: hit.sents.slice(0, 3).map((s) => ({
                definition: s.replace(/<\/?b>/gi, ''),
              })),
            },
          ]
        : []),
    ],
    mode: 'en-bn',
  };

  if (entry.meanings.length === 0) {
    return {
      ok: false,
      notFound: true,
      error: `No English→Bangla entry for “${word}”.`,
    };
  }

  return { ok: true, entries: [entry] };
}

async function lookupBnEn(word: string): Promise<DictionaryLookupResult> {
  const { findWordByBangla } = await import('e2b_word_bank');
  const hit = findWordByBangla(word);
  if (!hit) {
    return {
      ok: false,
      notFound: true,
      error: `No Bangla→English entry for “${word}”.`,
    };
  }

  const entry: DictionaryEntry = {
    word: hit.bn || word,
    bangla: hit.bn,
    phonetic: Array.isArray(hit.pron) ? hit.pron[0] : undefined,
    phonetics: [],
    meanings: [
      {
        partOfSpeech: 'English',
        definitions: [{ definition: hit.en }],
      },
      ...((hit.en_syns ?? []).length
        ? [
            {
              partOfSpeech: 'EN synonyms',
              definitions: (hit.en_syns ?? []).map((definition) => ({ definition })),
            },
          ]
        : []),
      ...parseDetails(hit.details).map((definition) => ({
        partOfSpeech: 'Detail',
        definitions: [{ definition }],
      })),
    ],
    mode: 'bn-en',
  };

  return { ok: true, entries: [entry] };
}

export async function performDictionaryLookup(
  rawWord: string,
  mode: DictionaryMode,
): Promise<DictionaryLookupResult> {
  const word = normalizeWord(rawWord);
  if (!word) {
    return { ok: false, error: 'Enter a word to look up.' };
  }
  if (!/^[\p{L}\p{N}'’-]+$/u.test(word)) {
    return { ok: false, error: 'Use letters only for dictionary lookup.' };
  }

  const cached = getCachedLookup(word, mode);
  if (cached) {
    return cached.ok ? { ...cached, cached: true } : cached;
  }

  let result: DictionaryLookupResult;
  try {
    if (mode === 'en') {
      result = await lookupEnglishOnly(word);
    } else if (mode === 'bn-en') {
      result = await lookupBnEn(word);
    } else {
      result = await lookupEnBn(word);
    }
  } catch {
    result = {
      ok: false,
      error: 'Could not reach the dictionary. Check your connection and retry.',
    };
  }

  setCachedLookup(word, mode, result);
  return result;
}
