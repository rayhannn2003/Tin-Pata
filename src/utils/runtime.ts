import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** True when running inside the Expo Go app (no custom native modules). */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function isNativePlatform(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

/** Quick check: not Expo Go / web. For full native module check use isPdfNativeModuleLinked(). */
export function isPdfReaderSupported(): boolean {
  return isNativePlatform() && !isExpoGo();
}
