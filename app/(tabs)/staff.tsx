// app/(tabs)/staff.tsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

// Cấu hình tiếng Việt cho Lịch
LocaleConfig.locales["vi"] = {
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "Th.1",
    "Th.2",
    "Th.3",
    "Th.4",
    "Th.5",
    "Th.6",
    "Th.7",
    "Th.8",
    "Th.9",
    "Th.10",
    "Th.11",
    "Th.12",
  ],
  dayNames: [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ],
  dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  today: "Hôm nay",
};
LocaleConfig.defaultLocale = "vi";

// Dữ liệu mẫu (Sau này lấy từ MySQL)
const STAFF_LIST = [
  { id: 1, name: "Nguyễn Văn A", role: "Nhân viên kho" },
  { id: 2, name: "Trần Thị B", role: "Kế toán" },
  { id: 3, name: "Lê Văn C", role: "Bảo vệ" },
];

export default function StaffScreen() {
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState("2026-10");

  // Hàm xử lý khi bấm vào một ngày trên lịch
  const handleDayPress = (day: any) => {
    const newMarkedDates = { ...markedDates };

    if (newMarkedDates[day.dateString]?.selected) {
      delete newMarkedDates[day.dateString];
    } else {
      newMarkedDates[day.dateString] = {
        selected: true,
        selectedColor: "#d97706",
        marked: true,
      };
    }
    setMarkedDates(newMarkedDates);
  };

  // Tính tổng ngày công
  const totalDays = Object.keys(markedDates).filter(
    (key) => markedDates[key].selected,
  ).length;

  const handleSaveAttendance = () => {
    Alert.alert(
      "Thành công",
      `Đã lưu ${totalDays} ngày công cho ${selectedStaff?.name} tháng ${currentMonth}`,
    );
    setSelectedStaff(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Danh Sách Nhân Viên</Text>

      <FlatList
        data={STAFF_LIST}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.staffCard}
            onPress={() => {
              setSelectedStaff(item);
              setMarkedDates({});
            }}
          >
            <Ionicons name="person-circle-outline" size={40} color="#d97706" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.staffName}>{item.name}</Text>
              <Text style={styles.staffRole}>{item.role}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      />

      {/* SỬA LỖI: Chỉ render Modal khi selectedStaff khác null */}
      {selectedStaff && (
        <Modal visible={true} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Chấm công: {selectedStaff.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedStaff(null)}>
                  <Ionicons name="close-circle" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.instruction}>
                Bấm vào ngày để chấm công (Cam = Đi làm)
              </Text>

              <Calendar
                current={`${currentMonth}-01`}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                markingType={"simple"}
                theme={{
                  selectedDayBackgroundColor: "#d97706",
                  todayTextColor: "#d97706",
                  arrowColor: "#d97706",
                }}
                onMonthChange={(month) =>
                  setCurrentMonth(month.dateString.slice(0, 7))
                }
              />

              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  Tổng ngày công:{" "}
                  <Text style={styles.highlight}>{totalDays}</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveAttendance}
              >
                <Text style={styles.saveButtonText}>💾 Lưu Chấm Công</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 16 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1f2937",
    fontFamily: "Roboto-Bold",
  },

  staffCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Roboto-Bold",
  },
  staffRole: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
    fontFamily: "Roboto-Regular",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", fontFamily: "Roboto-Bold" },
  instruction: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Roboto-Regular",
  },

  summaryBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fcd34d",
    alignItems: "center",
  },
  summaryText: { fontSize: 16, fontFamily: "Roboto-Regular" },
  highlight: {
    fontWeight: "bold",
    color: "#d97706",
    fontSize: 20,
    fontFamily: "Roboto-Bold",
  },

  saveButton: {
    backgroundColor: "#d97706",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto-Bold",
  },
});
