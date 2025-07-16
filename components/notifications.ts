import * as Notifications from 'expo-notifications';

// Set notification handler to show notifications in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNightlyNotifications() {
  // Cancel any existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule 10:00 PM notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Reminder',
      body: 'This is your 10:00 PM notification!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 22,
      minute: 0,
    },
  });

  // Schedule 10:30 PM notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Reminder',
      body: 'This is your 10:30 PM notification!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 22,
      minute: 30,
    },
  });
}

// Optional: export a setup function for clarity
export function setupNotificationHandler() {
  // Already set at import time, but can be called for clarity
} 