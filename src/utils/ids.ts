import * as Crypto from 'expo-crypto';

export async function generateId(): Promise<string> {
  return Crypto.randomUUID();
}
