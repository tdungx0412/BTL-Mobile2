// src/services/notificationService.ts
import { API_URL } from "@/constants/config";
import { User } from "@/src/stores/useAuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Cấu hình hiển thị thông báo khi app đang mở (Foreground)
if (Platform.OS !== "web") {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn("⚠️ [NOTIFICATIONS] Không thể khởi tạo NotificationHandler:", err);
  }
}


/**
 * Khởi tạo quyền thông báo và kênh âm thanh rung (Android Channel)
 */
export async function initNotifications(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("ℹ️ [NOTIFICATIONS] Người dùng chưa cấp quyền thông báo");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("service-reminders", {
        name: "Nhắc Lịch Hẹn Dịch Vụ",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: "#D97706",
        sound: "default",
      });
    }

    return true;
  } catch (err) {
    console.error("❌ [NOTIFICATIONS] Lỗi khởi tạo thông báo:", err);
    return false;
  }
}

/**
 * Lên lịch thông báo cục bộ ngay khi khách đặt dịch vụ thành công
 */
export async function scheduleBookingReminder(booking: {
  id?: number;
  service_name?: string;
  customer_name?: string;
  appointment_date?: string | Date;
  booking_code?: string;
}) {
  if (Platform.OS === "web") return;

  try {
    await initNotifications();

    const apptDate = booking.appointment_date ? new Date(booking.appointment_date) : new Date();
    const now = new Date();

    // Đặt giờ thông báo vào 08:30 sáng của ngày hẹn
    const scheduledTime = new Date(apptDate);
    scheduledTime.setHours(8, 30, 0, 0);

    const isToday =
      apptDate.getFullYear() === now.getFullYear() &&
      apptDate.getMonth() === now.getMonth() &&
      apptDate.getDate() === now.getDate();

    if (isToday) {
      // Nếu lịch hẹn là hôm nay: bắn thông báo sau 2 giây
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📅 Hôm nay bạn có lịch hẹn dịch vụ!",
          body: `Lịch hẹn "${booking.service_name || "Dịch vụ thủ công"}" (${booking.booking_code || ""}) được xếp lịch vào hôm nay. Đừng quên ghé Eiko Shop nhé!`,
          data: { bookingId: booking.id, type: "service_reminder" },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
      console.log(`✅ [NOTIFICATIONS] Đã lên lịch thông báo ngay hôm nay cho booking #${booking.id}`);
    } else if (scheduledTime.getTime() > now.getTime()) {
      // Lên lịch vào đúng sáng ngày hẹn
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📅 Tới ngày hẹn dịch vụ của bạn!",
          body: `Hôm nay bạn có lịch hẹn dịch vụ "${booking.service_name || "Dịch vụ handmade"}". Eiko rất hân hạnh được phục vụ bạn!`,
          data: { bookingId: booking.id, type: "service_reminder" },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledTime,
        },
      });
      console.log(`✅ [NOTIFICATIONS] Đã hẹn giờ thông báo tới ngày ${scheduledTime.toLocaleDateString("vi-VN")}`);
    }
  } catch (err) {
    console.error("❌ [NOTIFICATIONS] Lỗi lên lịch nhắc hẹn:", err);
  }
}

/**
 * Kiểm tra các lịch hẹn dịch vụ TỚI NGÀY HÔM NAY từ máy chủ và gửi thông báo về máy
 */
export async function checkAndNotifyDueBookings(user: User | null): Promise<any[]> {
  try {
    const isGranted = await initNotifications();
    const isAdmin = user?.role === "admin";
    const userId = user?.id || user?.user_id;

    let url = `${API_URL}/service-bookings/today-reminders?role=${user?.role || "customer"}`;
    if (userId) {
      url += `&userId=${userId}`;
    }

    // Nếu là khách vãng lai, kiểm tra theo ids đã lưu trong AsyncStorage
    if (!userId && !isAdmin) {
      const raw = await AsyncStorage.getItem("@eiko_recent_service_booking_ids");
      const ids = raw ? JSON.parse(raw) : [];
      if (ids.length > 0) {
        url += `&ids=${ids.join(",")}`;
      } else {
        return [];
      }
    }

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const bookings: any[] = data.bookings || [];

    if (bookings.length === 0) return [];

    const todayStr = new Date().toISOString().split("T")[0];

    for (const b of bookings) {
      const storageKey = `@eiko_notified_booking_${b.id}_${todayStr}`;
      const alreadyNotified = await AsyncStorage.getItem(storageKey);

      if (!alreadyNotified) {
        // Gửi thông báo đến thiết bị nếu có quyền
        if (isGranted && Platform.OS !== "web") {
          const title = isAdmin
            ? `🔔 [Lịch Hôm Nay] Khách đặt dịch vụ!`
            : `📅 [Nhắc Lịch] Dịch vụ hôm nay của bạn!`;

          const body = isAdmin
            ? `Khách ${b.customer_name} (${b.customer_phone}) có lịch "${b.service_name}" hôm nay. Hãy chuẩn bị đón khách!`
            : `Hôm nay bạn có lịch hẹn dịch vụ "${b.service_name}" tại Eiko Shop. Hẹn gặp bạn nhé!`;

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { bookingId: b.id, type: "due_today" },
              sound: true,
            },
            trigger: null, // Bắn ngay lập tức
          });
        }

        // Đánh dấu đã thông báo trong ngày hôm nay để không spam
        await AsyncStorage.setItem(storageKey, "1");
        console.log(`🔔 [NOTIFICATIONS] Đã gửi thông báo về máy cho booking #${b.id} (${b.service_name})`);
      }
    }

    return bookings;
  } catch (err) {
    console.error("❌ [NOTIFICATIONS] Lỗi kiểm tra lịch hẹn hôm nay:", err);
    return [];
  }
}
