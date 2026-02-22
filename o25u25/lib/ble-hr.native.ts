/**
 * BLE Heart Rate (GATT): Service 0x180D, Characteristic 0x2A37.
 * Requires native BLE (development build); will no-op in Expo Go.
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

let BleManager: typeof import('react-native-ble-plx').BleManager | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  BleManager = require('react-native-ble-plx').BleManager;
} catch {
  // Expo Go or BLE not available
}

let managerInstance: InstanceType<typeof import('react-native-ble-plx').BleManager> | null = null;
let managerFailed = false;

function getManager(): InstanceType<typeof import('react-native-ble-plx').BleManager> | null {
  if (!BleManager || managerFailed) return null;
  if (!managerInstance) {
    try {
      managerInstance = new BleManager();
    } catch {
      // Expo Go or native BLE module not linked (createClient is null)
      managerFailed = true;
      return null;
    }
  }
  return managerInstance;
}

export function isBleAvailable(): boolean {
  return getManager() !== null;
}

/** Scan for BLE devices. Returns when scan is stopped. */
export async function scanForDevices(
  onDevice: (device: BleHrDevice) => void,
  options?: { timeoutMs?: number }
): Promise<void> {
  const manager = getManager();
  if (!manager) throw new Error('BLE not available (use a development build)');
  const timeoutMs = options?.timeoutMs ?? 10000;
  // Scan all devices; many HR monitors don't advertise 0x180D, we discover on connect
  await manager.startDeviceScan(
    null,
    { allowDuplicates: false },
    (err, device) => {
      if (err) return;
      if (device)
        onDevice({
          id: device.id,
          name: device.name ?? null,
        });
    }
  );
  await new Promise((resolve) => setTimeout(resolve, timeoutMs));
  manager.stopDeviceScan();
}

/** Connect to device, discover HR service, subscribe to HR measurement. Callbacks receive BPM. */
export async function connectAndSubscribe(
  deviceId: string,
  callbacks: BleHrCallbacks
): Promise<{ disconnect: () => Promise<void> }> {
  const manager = getManager();
  if (!manager) throw new Error('BLE not available (use a development build)');
  const device = await manager.connectToDevice(deviceId);
  await device.discoverAllServicesAndCharacteristics();
  const chars = await device.characteristicsForService(HEART_RATE_SERVICE_UUID);
  const hrChar = chars.find((c) => c.uuid.toLowerCase() === HEART_RATE_MEASUREMENT_UUID.toLowerCase());
  if (!hrChar) throw new Error('Heart rate characteristic not found');
  const subscription = device.monitorCharacteristicForService(
    HEART_RATE_SERVICE_UUID,
    HEART_RATE_MEASUREMENT_UUID,
    (err, characteristic) => {
      if (err) return;
      if (characteristic?.value) {
        const bpm = parseHeartRateMeasurement(characteristic.value);
        if (bpm !== null) callbacks.onBpm(bpm);
      }
    }
  );
  device.onDisconnected((err) => {
    if (err) return;
    callbacks.onDisconnect?.();
  });
  return {
    disconnect: async () => {
      subscription.remove();
      try {
        await device.cancelConnection();
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Parse GATT Heart Rate Measurement value (first byte = flags; bit 0 => 16-bit HR).
 * https://www.bluetooth.com/specifications/specs/heart-rate-service-1-0/
 */
function parseHeartRateMeasurement(base64Value: string): number | null {
  try {
    const buf = decodeBase64(base64Value);
    if (buf.length < 2) return null;
    const flags = buf[0];
    const heartRateValueFormat = flags & 0x01;
    let bpm: number;
    if (heartRateValueFormat === 0) {
      bpm = buf[1];
    } else {
      if (buf.length < 3) return null;
      bpm = buf[1] | (buf[2] << 8);
    }
    return bpm >= 0 && bpm <= 255 ? bpm : null;
  } catch {
    return null;
  }
}

function decodeBase64(base64: string): number[] {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    return Array.from(binary, (c) => c.charCodeAt(0));
  }
  // React Native: Buffer or base64 decode
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let len = base64.length;
  let placeHolders = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const arr = new Array((len * 3) / 4 - placeHolders);
  let L = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[base64.charCodeAt(i)];
    const b = lookup[base64.charCodeAt(i + 1)];
    const c = lookup[base64.charCodeAt(i + 2)];
    const d = lookup[base64.charCodeAt(i + 3)];
    arr[L++] = (a << 2) | (b >> 4);
    arr[L++] = ((b & 15) << 4) | (c >> 2);
    arr[L++] = ((c & 3) << 6) | d;
  }
  return Array.from(arr.slice(0, L));
}

/** Compute average BPM from samples. */
export function averageBpm(samples: HeartRateSample[]): number | null {
  if (samples.length === 0) return null;
  const sum = samples.reduce((s, x) => s + x.bpm, 0);
  return Math.round(sum / samples.length);
}
