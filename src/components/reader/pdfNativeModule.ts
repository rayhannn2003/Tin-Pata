import type { ComponentType, RefAttributes } from 'react';
import { NativeModules, TurboModuleRegistry } from 'react-native';

import type { PdfRef } from '@/components/reader/types';
import { isExpoGo, isNativePlatform } from '@/utils/runtime';

/** Props passed through to react-native-pdf (not our wrapper props). */
export interface NativePdfPassThroughProps {
  source: { uri: string; cache?: boolean };
  page?: number;
  trustAllCerts?: boolean;
  enablePaging?: boolean;
  spacing?: number;
  fitPolicy?: number;
  style?: object;
  onLoadComplete?: (numberOfPages: number) => void;
  onPageChanged?: (page: number, numberOfPages: number) => void;
  onError?: (error: unknown) => void;
  renderActivityIndicator?: () => React.ReactElement;
}

export type NativePdfComponent = ComponentType<
  NativePdfPassThroughProps & RefAttributes<PdfRef>
>;

let cachedPdfComponent: NativePdfComponent | null | undefined;

function isBlobUtilNativeLinked(): boolean {
  if (NativeModules.ReactNativeBlobUtil != null) {
    return true;
  }
  try {
    return TurboModuleRegistry.get('ReactNativeBlobUtil') != null;
  } catch {
    return false;
  }
}

/** True when this binary includes react-native-pdf / react-native-blob-util native code. */
export function isPdfNativeModuleLinked(): boolean {
  if (!isNativePlatform() || isExpoGo()) {
    return false;
  }
  return isBlobUtilNativeLinked();
}

/**
 * Load react-native-pdf only when native modules are linked.
 * Importing the package at file top-level crashes in Expo Go / non-prebuilt apps.
 */
export function loadNativePdfComponent(): NativePdfComponent | null {
  if (cachedPdfComponent !== undefined) {
    return cachedPdfComponent;
  }

  if (!isPdfNativeModuleLinked()) {
    cachedPdfComponent = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedPdfComponent = require('react-native-pdf').default as NativePdfComponent;
  } catch {
    cachedPdfComponent = null;
  }

  return cachedPdfComponent;
}
