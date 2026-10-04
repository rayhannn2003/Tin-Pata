import type { SummaryRequest, SummaryResult } from '@/types/summary';

export const SummaryService = {
  async summarize(request: SummaryRequest): Promise<SummaryResult> {
    try {
      const response = await fetch('/api/summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
      });
      const result = (await response.json()) as SummaryResult;
      if (result && typeof result === 'object' && 'ok' in result) return result;
      return { ok: false, code: 'PROVIDER', error: 'Invalid summary response.' };
    } catch {
      return {
        ok: false,
        code: 'PROVIDER',
        error: 'Could not reach the summary service. Check your connection.',
      };
    }
  },

  formatAsNote(options: {
    summary: string;
    pageStart: number;
    pageEnd: number;
    language: 'en' | 'bn';
  }) {
    const pages =
      options.pageStart === options.pageEnd
        ? `Page ${options.pageStart}`
        : `Pages ${options.pageStart}–${options.pageEnd}`;
    const title = options.language === 'bn' ? 'AI সারাংশ' : 'AI Summary';
    return `${title} — ${pages}\n\n${options.summary}`;
  },
};
