/**
 * BLE is not available on web. Use a phone/tablet with a development build for heart rate.
 */
import type { HeartRateSample } from './types';

export const HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
export const HEART_RATE_MEASUREMENT_UUID = '00002a37-0000-1000-8000-00805f9b34fb';

export interface BleHrDevice {
  id: string;
  name: string | null;
}

export interface BleHrCallbacks {
  onBpm: (bpm: number) => void;
  onDisconnect?: () => void;
}

export function isBleAvailable(): boolean {
  return false;
}

export async function getBleState(): Promise<null> {
  return Promise.resolve(null);
}

export async function scanForDevices(
  _onDevice: (device: BleHrDevice) => void,
  _options?: { timeoutMs?: number }
): Promise<void> {
  throw new Error('Heart rate monitors are not available on web. Use the app on a phone.');
}

export async function connectAndSubscribe(
  _deviceId: string,
  _callbacks: BleHrCallbacks
): Promise<{ disconnect: () => Promise<void> }> {
  throw new Error('Heart rate monitors are not available on web. Use the app on a phone.');
}

export function averageBpm(samples: HeartRateSample[]): number | null {
  if (samples.length === 0) return null;
  const sum = samples.reduce((s, x) => s + x.bpm, 0);
  return Math.round(sum / samples.length);
}
