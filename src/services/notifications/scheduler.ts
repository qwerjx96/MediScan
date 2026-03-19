import * as Notifications from 'expo-notifications';
import type { Medication, FrequencyType } from '../../types';
import { FREQUENCY_LABELS } from '../../constants/frequencies';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

interface TimeComponents {
  hour: number;
  minute: number;
}

function parseTime(hhmm: string): TimeComponents {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: h ?? 8, minute: m ?? 0 };
}

export async function scheduleNotificationsForMedication(
  med: Medication
): Promise<string[]> {
  if (med.frequency === 'as_needed') return [];

  const ids: string[] = [];

  for (const timeStr of med.times) {
    const { hour, minute } = parseTime(timeStr);

    const trigger: Notifications.NotificationTriggerInput =
      med.frequency === 'weekly'
        ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 2, hour, minute }
        : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${med.brandName ?? med.inn}`,
        body: `${med.dosage} · ${FREQUENCY_LABELS[med.frequency]}`,
        data: { medicationId: med.id },
      },
      trigger,
    });

    ids.push(id);
  }

  return ids;
}

export async function cancelNotificationsForMedication(
  notificationIds: string[]
): Promise<void> {
  await Promise.all(
    notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
}
