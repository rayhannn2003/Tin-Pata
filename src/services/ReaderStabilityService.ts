import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import {
  DEFAULT_READER_STABILITY_MODE,
  READER_SETTING_KEYS,
  STABLE_READER_PDF_BEHAVIOR,
  type ReaderStabilityMode,
} from '@/types/reader';

/** Constraints enforced when `reader_stability_mode` is `safe`. */
export const SAFE_READER_CONSTRAINTS = {
  stabilityMode: 'safe' as const,
  /** Scroll mode is chosen at reader open; not toggled on mounted PDF. */
  dynamicScrollMode: false,
  enablePaging: STABLE_READER_PDF_BEHAVIOR.enablePaging,
  fitPolicy: STABLE_READER_PDF_BEHAVIOR.fitPolicy,
  /** Safe focus hides toolbar/action bar only — no scroll-blocking overlay on PDF. */
  focusOverlayBlocksScroll: false,
  dynamicFitMode: false,
  /** Fit/scroll props are frozen per reader session at open — never changed on mounted PDF. */
  sessionFrozenFitPolicy: true,
  sessionFrozenEnablePaging: true,
  postLoadAutoSetPage: false,
  autoResumeViaInitialPageProp: true,
} as const;

let cachedMode: ReaderStabilityMode | null = null;
let ensureSafeModePromise: Promise<ReaderStabilityMode> | null = null;

async function loadSafeMode(): Promise<ReaderStabilityMode> {
  const stored = await SettingsRepository.get(READER_SETTING_KEYS.stabilityMode);
  if (stored === 'safe') {
    cachedMode = stored;
    return stored;
  }
  await SettingsRepository.set(
    READER_SETTING_KEYS.stabilityMode,
    DEFAULT_READER_STABILITY_MODE,
  );
  cachedMode = DEFAULT_READER_STABILITY_MODE;
  return DEFAULT_READER_STABILITY_MODE;
}

export const ReaderStabilityService = {
  isSafeMode(mode: string | null | undefined): mode is ReaderStabilityMode {
    return mode === 'safe';
  },

  /** Returns `safe` and persists the key if missing or invalid. Dedupes concurrent calls. */
  async ensureSafeMode(): Promise<ReaderStabilityMode> {
    if (cachedMode === 'safe') {
      return cachedMode;
    }
    if (!ensureSafeModePromise) {
      ensureSafeModePromise = loadSafeMode().finally(() => {
        ensureSafeModePromise = null;
      });
    }
    return ensureSafeModePromise;
  },

  async getStabilityMode(): Promise<ReaderStabilityMode> {
    return this.ensureSafeMode();
  },
};
