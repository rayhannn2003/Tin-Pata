import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import { DEFAULT_READER_PREFERENCES } from '@/types/reader';

type BrightnessModule = typeof import('expo-brightness');

let savedBrightness: number | null = null;
let didApplyOverride = false;

/** `undefined` = unchecked, `null` = unavailable, otherwise cached JS module. */
let brightnessModuleCache: BrightnessModule | null | undefined;
let nativeModuleLinked: boolean | undefined;

export function clampReaderBrightness(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_READER_PREFERENCES.brightnessValue;
  }
  return Math.min(1, Math.max(0, value));
}

function isNativeModuleLinked(): boolean {
  if (nativeModuleLinked !== undefined) {
    return nativeModuleLinked;
  }

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    nativeModuleLinked = false;
    return false;
  }

  nativeModuleLinked = requireOptionalNativeModule('ExpoBrightness') !== null;
  return nativeModuleLinked;
}

async function loadBrightnessModule(): Promise<BrightnessModule | null> {
  if (brightnessModuleCache !== undefined) {
    return brightnessModuleCache;
  }

  if (!isNativeModuleLinked()) {
    brightnessModuleCache = null;
    return null;
  }

  try {
    const module = await import('expo-brightness');
    brightnessModuleCache = module;
    return module;
  } catch {
    brightnessModuleCache = null;
    nativeModuleLinked = false;
    return null;
  }
}

export const ReaderBrightnessService = {
  /** Platform may support brightness; native module may still be missing until dev build is rebuilt. */
  isPlatformSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  },

  /** True when ExpoBrightness is linked in the current native build. Does not load expo-brightness JS. */
  async isAvailable(): Promise<boolean> {
    return isNativeModuleLinked();
  },

  async requestAccess(): Promise<boolean> {
    const Brightness = await loadBrightnessModule();
    if (!Brightness) {
      return false;
    }

    if (Platform.OS === 'ios') {
      const current = await Brightness.getPermissionsAsync();
      if (current.granted) {
        return true;
      }
      const requested = await Brightness.requestPermissionsAsync();
      return requested.granted;
    }
    return true;
  },

  async applyReaderBrightness(value: number): Promise<{ ok: boolean; errorKey?: string }> {
    const Brightness = await loadBrightnessModule();
    if (!Brightness) {
      return { ok: false, errorKey: 'reader.brightnessUnavailable' };
    }

    try {
      const hasAccess = await this.requestAccess();
      if (!hasAccess) {
        return { ok: false, errorKey: 'reader.brightnessPermissionDenied' };
      }

      if (!didApplyOverride) {
        savedBrightness = await Brightness.getBrightnessAsync();
        didApplyOverride = true;
      }

      await Brightness.setBrightnessAsync(clampReaderBrightness(value));
      return { ok: true };
    } catch {
      return { ok: false, errorKey: 'reader.brightnessApplyFailed' };
    }
  },

  async restoreReaderBrightness(): Promise<{ ok: boolean; errorKey?: string }> {
    if (!didApplyOverride) {
      return { ok: true };
    }

    const Brightness = await loadBrightnessModule();
    if (!Brightness) {
      savedBrightness = null;
      didApplyOverride = false;
      return { ok: true };
    }

    try {
      await Brightness.restoreSystemBrightnessAsync();
      savedBrightness = null;
      didApplyOverride = false;
      return { ok: true };
    } catch {
      try {
        if (savedBrightness !== null) {
          await Brightness.setBrightnessAsync(savedBrightness);
        }
        savedBrightness = null;
        didApplyOverride = false;
        return { ok: true };
      } catch {
        savedBrightness = null;
        didApplyOverride = false;
        return { ok: false, errorKey: 'reader.brightnessRestoreFailed' };
      }
    }
  },
};
