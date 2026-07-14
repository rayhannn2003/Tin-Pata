export type DictionaryMode = 'en' | 'en-bn' | 'bn-en';

export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryEntry {
  word: string;
  /** Primary Bangla gloss when available. */
  bangla?: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  sourceUrls?: string[];
  mode: DictionaryMode;
}

export type DictionaryLookupResult =
  | { ok: true; entries: DictionaryEntry[]; cached?: boolean }
  | { ok: false; error: string; notFound?: boolean };

export interface DictionaryRecentItem {
  word: string;
  mode: DictionaryMode;
  bangla?: string;
  preview: string;
  lookedUpAt: string;
}

export interface DictionaryPreferences {
  mode: DictionaryMode;
  openOnDoubleClick: boolean;
  highlightOnPage: boolean;
  saveRecent: boolean;
}

export const DEFAULT_DICTIONARY_PREFERENCES: DictionaryPreferences = {
  mode: 'en-bn',
  openOnDoubleClick: true,
  highlightOnPage: true,
  saveRecent: true,
};

export const DICTIONARY_SETTING_KEYS = {
  mode: 'web_dictionary_mode',
  openOnDoubleClick: 'web_dictionary_open_on_dblclick',
  highlightOnPage: 'web_dictionary_highlight_on_page',
  saveRecent: 'web_dictionary_save_recent',
} as const;

/** Note body template. Placeholders: {{word}} {{bangla}} {{phonetic}} {{page}} {{meanings}} */
export const DICTIONARY_NOTE_TEMPLATE = `{{word}}{{bangla}}
{{phonetic}}Page {{page}}

{{meanings}}`;
