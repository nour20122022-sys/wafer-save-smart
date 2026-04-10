export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendNotification(title: string, body: string, icon?: string) {
  if (Notification.permission !== "granted") return;
  new Notification(title, { body, icon: icon || "/placeholder.svg", badge: "/placeholder.svg" });
}

export function scheduleDailyReminder() {
  const now = new Date();
  const target = new Date();
  target.setHours(9, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();

  setTimeout(() => {
    sendNotification("⚡ Wafer - مهمة يومية", "لا تنسى تكمل مهمتك اليومية لتوفير الطاقة!");
    scheduleDailyReminder();
  }, delay);
}

export function checkBracketAlert(currentKwh: number, thresholds: number[]) {
  for (const threshold of thresholds) {
    if (currentKwh >= threshold * 0.9 && currentKwh < threshold) {
      sendNotification(
        "⚠️ تنبيه شريحة!",
        `أنت قريب من الشريحة التالية (${threshold} kWh). حاول تقلل استهلاكك!`
      );
      break;
    }
  }
}
