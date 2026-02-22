import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import {
  requestNotificationPermission,
  showTimerNotification,
  dismissTimerNotification,
  TIMER_CATEGORY_ID,
} from "./timerNotification";
import { saveRun } from "./db";
import { pathDistanceKm, getCurrentSplitPace } from "./pathDistance";
import * as BleHr from "./ble-hr";
import type { PathPoint, HeartRateSample } from "./types";

const HR_DEVICE_KEY = "@o25u25/hrDeviceId";
const HR_DEVICE_NAME_KEY = "@o25u25/hrDeviceName";
const NOTIF_DEDUPE_MS = 800;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

type TimerContextValue = {
  seconds: number;
  isRunning: boolean;
  playPause: () => void;
  stop: () => void;
  formattedTime: string;
  runPath: PathPoint[];
  distanceKm: number;
  currentSplitPaceMinPerKm: number | null;
  avgPaceMinPerKm: number | null;
  currentBpm: number | null;
  avgBpm: number | null;
  heartRateSamples: HeartRateSample[];
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [runPath, setRunPath] = useState<PathPoint[]>([]);
  const [heartRateSamples, setHeartRateSamples] = useState<HeartRateSample[]>([]);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const runStartTimeRef = useRef<number | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const hrDisconnectRef = useRef<(() => Promise<void>) | null>(null);
  const playPauseRef = useRef<() => void>(() => {});
  const stopRef = useRef<() => void>(() => {});
  const lastNotifResponseRef = useRef<{ key: string; time: number } | null>(null);

  const clearLocationSub = useCallback(() => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  }, []);

  const playPause = useCallback(async () => {
    const willStart = !isRunning;
    if (willStart && Platform.OS !== "web") {
      await requestNotificationPermission();
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsRunning((r) => !r);
        return;
      }
      if (runPath.length === 0) {
        runStartTimeRef.current = Date.now();
        setHeartRateSamples([]);
        setCurrentBpm(null);
        if (hrDisconnectRef.current) {
          await hrDisconnectRef.current();
          hrDisconnectRef.current = null;
        }
        if (BleHr.isBleAvailable()) {
          try {
            const deviceId = await AsyncStorage.getItem(HR_DEVICE_KEY);
            if (deviceId) {
              const { disconnect } = await BleHr.connectAndSubscribe(
                deviceId,
                {
                  onBpm: (bpm) => {
                    const ts = Date.now();
                    setCurrentBpm(bpm);
                    setHeartRateSamples((prev) => [...prev, { timestamp: ts, bpm }]);
                  },
                }
              );
              hrDisconnectRef.current = disconnect;
            }
          } catch {
            // ignore HR connection errors
          }
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        setRunPath([
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            timestamp: loc.timestamp,
          },
        ]);
      }
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (loc) => {
          setRunPath((prev) => {
            const last = prev[prev.length - 1];
            if (
              last &&
              last.latitude === loc.coords.latitude &&
              last.longitude === loc.coords.longitude
            )
              return prev;
            return [
              ...prev,
              {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                timestamp: loc.timestamp,
              },
            ];
          });
        }
      );
      locationSubRef.current = sub;
    } else if (!willStart) {
      clearLocationSub();
      if (hrDisconnectRef.current) {
        await hrDisconnectRef.current();
        hrDisconnectRef.current = null;
      }
    }
    setIsRunning((r) => !r);
  }, [isRunning, runPath.length, clearLocationSub]);

  const stop = useCallback(async () => {
    clearLocationSub();
    if (hrDisconnectRef.current) {
      await hrDisconnectRef.current();
      hrDisconnectRef.current = null;
    }
    const startTime = runStartTimeRef.current;
    const path = runPath;
    const durationSecs = seconds;
    const samples = heartRateSamples;
    setIsRunning(false);
    setSeconds(0);
    setRunPath([]);
    setHeartRateSamples([]);
    setCurrentBpm(null);
    runStartTimeRef.current = null;

    if (Platform.OS !== "web" && path.length > 0 && startTime != null) {
      const endTime = Date.now();
      const distanceKm = pathDistanceKm(path);
      const paceMinPerKm =
        distanceKm > 0 ? (durationSecs / 60) / distanceKm : 0;
      const avgHeartRate = BleHr.averageBpm(samples);
      try {
        await saveRun({
          startTime,
          endTime,
          distanceKm,
          durationSeconds: durationSecs,
          paceMinPerKm,
          avgHeartRate: avgHeartRate ?? null,
          path,
          heartRateSamples: samples,
        });
      } catch (_) {}
    }
  }, [runPath, seconds, heartRateSamples, clearLocationSub]);

  playPauseRef.current = playPause;
  stopRef.current = stop;

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Notification: show when timer has time (running or paused), dismiss only when stopped
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (seconds > 0) {
      const label = isRunning ? formatTime(seconds) : `${formatTime(seconds)} (paused)`;
      showTimerNotification(label).catch(() => {});
    } else {
      dismissTimerNotification().catch(() => {});
    }
  }, [isRunning, seconds]);

  // Listen for notification action buttons (play/pause, stop). Use same playPause/stop as in-app so state stays in sync; dedupe so one tap isn't handled twice (listener + getLastNotificationResponseAsync).
  useEffect(() => {
    if (Platform.OS === "web") return;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const categoryId = response.notification.request.content.categoryIdentifier;
      if (categoryId !== TIMER_CATEGORY_ID) return;

      const dedupeKey = `${response.notification.request.identifier ?? ""}-${response.actionIdentifier}`;
      const now = Date.now();
      const last = lastNotifResponseRef.current;
      if (last?.key === dedupeKey && now - last.time < NOTIF_DEDUPE_MS) return;
      lastNotifResponseRef.current = { key: dedupeKey, time: now };

      const action = response.actionIdentifier;
      if (action === "playPause") {
        playPauseRef.current();
      } else if (action === "stop") {
        stopRef.current();
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleResponse
    );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    return () => sub.remove();
  }, []);

  const distanceKm = pathDistanceKm(runPath);
  const currentSplitPaceMinPerKm = getCurrentSplitPace(runPath);
  const avgPaceMinPerKm =
    distanceKm > 0 ? (seconds / 60) / distanceKm : null;
  const avgBpm = BleHr.averageBpm(heartRateSamples);

  return (
    <TimerContext.Provider
      value={{
        seconds,
        isRunning,
        playPause,
        stop,
        formattedTime: formatTime(seconds),
        runPath,
        distanceKm,
        currentSplitPaceMinPerKm,
        avgPaceMinPerKm,
        currentBpm,
        avgBpm,
        heartRateSamples,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
