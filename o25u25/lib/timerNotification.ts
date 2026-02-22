import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const TIMER_CHANNEL_ID = "timer";
const TIMER_NOTIFICATION_ID = "timer-active";
const TIMER_CATEGORY_ID = "timer-controls";

let channelSetup = false;
let categorySetup = false;

async function ensureChannel() {
  if (channelSetup) return;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
      name: "Timer",
      importance: Notifications.AndroidImportance.LOW,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    channelSetup = true;
  }
}

async function ensureCategory() {
  if (categorySetup) return;
  if (Platform.OS === "web") return;
  await Notifications.setNotificationCategoryAsync(TIMER_CATEGORY_ID, [
    { identifier: "playPause", buttonTitle: "Play/Pause" },
    {
      identifier: "stop",
      buttonTitle: "Stop",
      options: { isDestructive: true },
    },
  ]);
  categorySetup = true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function showTimerNotification(timeText: string): Promise<void> {
  if (Platform.OS === "web") return;
  await ensureChannel();
  await ensureCategory();
  const trigger =
    Platform.OS === "android" ? { channelId: TIMER_CHANNEL_ID } : null;
  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_NOTIFICATION_ID,
    content: {
      title: "Timer",
      body: timeText,
      categoryIdentifier: TIMER_CATEGORY_ID,
    },
    trigger,
  });
}

export { TIMER_CATEGORY_ID };

export async function dismissTimerNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);
  } catch {
    // Ignore if notification wasn't shown
  }
}
