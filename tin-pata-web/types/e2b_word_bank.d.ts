declare module 'e2b_word_bank' {
  export type E2BWord = {
    sl: number;
    en: string;
    bn: string;
    pron?: string[] | null;
    bn_syns?: string[] | null;
    en_syns?: string[] | null;
    sents?: string[] | null;
    details?: string | null;
  };

  export function getAllWords(): E2BWord[];
  export function findWordByEnglish(term: string): E2BWord | undefined;
  export function findWordByBangla(term: string): E2BWord | undefined;
  export function findWordsByEnglishStartWith(term: string): E2BWord[];
  export function findWordsByBanglaStartWith(term: string): E2BWord[];
}
