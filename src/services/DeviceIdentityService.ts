import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import { generateId } from '@/utils/ids';
import { nowIso } from '@/utils/syncMetadata';

export const DEVICE_ID_SETTING_KEY = 'tin_pata_device_id';

export const DeviceIdentityService = {
  async getOrCreateDeviceId(): Promise<string> {
    const existing = await SettingsRepository.get(DEVICE_ID_SETTING_KEY);
    if (existing?.trim()) {
      return existing.trim();
    }

    const deviceId = await generateId();
    await SettingsRepository.set(DEVICE_ID_SETTING_KEY, deviceId);
    return deviceId;
  },

  async getDeviceId(): Promise<string | null> {
    const value = await SettingsRepository.get(DEVICE_ID_SETTING_KEY);
    return value?.trim() ? value.trim() : null;
  },

  async resetDeviceId(): Promise<string> {
    const deviceId = await generateId();
    await SettingsRepository.set(DEVICE_ID_SETTING_KEY, deviceId);
    return deviceId;
  },

  async getDeviceIdentity(): Promise<{ deviceId: string; createdAt: string } | null> {
    const deviceId = await this.getDeviceId();
    if (!deviceId) {
      return null;
    }

    const meta = await SettingsRepository.get(DEVICE_ID_SETTING_KEY);
    if (!meta) {
      return null;
    }

    const all = await SettingsRepository.getAll();
    const row = all.find((setting) => setting.key === DEVICE_ID_SETTING_KEY);
    return {
      deviceId,
      createdAt: row?.updatedAt ?? nowIso(),
    };
  },
};
