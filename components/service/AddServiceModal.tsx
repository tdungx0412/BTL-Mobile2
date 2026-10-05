// components/service/AddServiceModal.tsx
import { API_URL, BASE_URL } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface ServiceDataToEdit {
  id?: number;
  name?: string;
  price?: number | string;
  category?: string;
  duration_minutes?: number;
  description?: string;
  image?: string;
}

interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingService?: ServiceDataToEdit | null;
}

const CATEGORY_OPTIONS = [
  { id: "packaging", label: "Gói Quà", icon: "gift-outline", emoji: "🎁" },
  { id: "diy_kit", label: "Kit DIY", icon: "construct-outline", emoji: "🛠️" },
  { id: "mini_decor", label: "Decor Mini", icon: "flower-outline", emoji: "🌿" },
  { id: "lettering", label: "Viết Thiệp", icon: "create-outline", emoji: "✍️" },
  { id: "workshop", label: "Workshop", icon: "color-palette-outline", emoji: "🎨" },
];

const DURATION_PRESETS = [15, 20, 30, 45, 60, 90, 120];

const SAMPLE_TEMPLATES = [
  {
    name: "Gói quà hoa khô Vintage Eiko",
    price: "45000",
    category: "packaging",
    duration: "20",
    description: "Gói quà bằng giấy Kraft tự nhiên, dây gai mộc và hoa baby sấy khô kèm thiệp chúc mừng viết tay.",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Bộ kit thêu túi tote hoa sen",
    price: "120000",
    category: "diy_kit",
    duration: "60",
    description: "Bộ đầy đủ gồm túi vải canvas mộc, khung thêu gỗ sồi, kim thêu và bộ chỉ tơ bóng nhiều màu.",
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Khắc tên & viết thư pháp thiệp",
    price: "35000",
    category: "lettering",
    duration: "15",
    description: "Nghệ nhân viết thiệp bằng mực nhũ đồng phong cách Calligraphy trang nhã và tinh tế.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
  },
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editingService = null,
}) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("packaging");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingService) {
        setName(editingService.name || "");
        setPrice(String(editingService.price || ""));
        setCategory(editingService.category || "packaging");
        setDurationMinutes(String(editingService.duration_minutes || 30));
        setDescription(editingService.description || "");

        let img = editingService.image || "";
        if (img && !img.startsWith("http")) {
          img = `${BASE_URL}${img}`;
        }
        setImageUri(img || null);
        setImageUrl(img || "");
        setImageBase64(null);
        setIsUrlMode(false);
      } else {
        // Reset form for fresh create
        setName("");
        setPrice("");
        setCategory("packaging");
        setDurationMinutes("30");
        setDescription("");
        setImageUri(null);
        setImageUrl("");
        setImageBase64(null);
        setIsUrlMode(false);
      }
    }
  }, [visible, editingService]);

  // Chọn ảnh từ thư viện thiết bị
  const handlePickImage = async () => {
    try {
      const permRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permRes.granted) {
        Alert.alert("Quyền truy cập", "Cần cấp quyền truy cập ảnh để chọn ảnh đại diện dịch vụ.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      });

      if (!res.canceled && res.assets[0]) {
        const asset = res.assets[0];
        setImageUri(asset.uri);
        if (asset.base64) {
          setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setImageBase64(asset.uri);
        }
        setImageUrl("");
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh: " + err.message);
    }
  };

  // Điền mẫu nhanh
  const handleApplyTemplate = (tpl: typeof SAMPLE_TEMPLATES[0]) => {
    setName(tpl.name);
    setPrice(tpl.price);
    setCategory(tpl.category);
    setDurationMinutes(tpl.duration);
    setDescription(tpl.description);
    setImageUri(tpl.image);
    setImageUrl(tpl.image);
    setImageBase64(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên dịch vụ");
      return;
    }

    const numPrice = parseFloat(price.replace(/[^0-9]/g, ""));
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập giá dịch vụ hợp lệ (VNĐ)");
      return;
    }

    setSaving(true);
    try {
      let finalImage = "";
      if (imageBase64) {
        finalImage = imageBase64;
      } else if (imageUrl.trim()) {
        finalImage = imageUrl.trim();
      } else if (imageUri) {
        finalImage = imageUri;
      } else {
        // Ảnh mặc định tinh tế nếu không chọn
        finalImage = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80";
      }

      const payload = {
        name: name.trim(),
        price: numPrice,
        category: category.trim() || "packaging",
        duration_minutes: parseInt(durationMinutes) || 30,
        description: description.trim(),
        image: finalImage,
      };

      let url = `${API_URL}/admin/services`;
      let method = "POST";

      if (editingService?.id) {
        url = `${API_URL}/admin/services/${editingService.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert(
          "Thành công 🎉",
          data.message || (editingService ? "Đã cập nhật dịch vụ thành công!" : "Đã thêm dịch vụ mới thành công!")
        );
        onSuccess();
        onClose();
      } else {
        Alert.alert("Lỗi ❌", data.message || "Không thể lưu dịch vụ.");
      }
    } catch (err: any) {
      console.error("Save service error:", err);
      Alert.alert("Lỗi kết nối", err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="sparkles" size={18} color="#be185d" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {editingService ? "Chỉnh Sửa Dịch Vụ" : "Thêm Dịch Vụ Mới"}
                </Text>
                <Text style={styles.modalSubtitle}>Gói quà, kit DIY, viết thiệp thủ công</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* SAMPLE PRESETS QUICK FILL (Chỉ hiện khi thêm mới) */}
            {!editingService && (
              <View style={styles.sampleSection}>
                <Text style={styles.sampleTitle}>⚡ Mẫu gợi ý nhanh:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleRow}>
                  {SAMPLE_TEMPLATES.map((tpl, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.sampleChip}
                      onPress={() => handleApplyTemplate(tpl)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sampleChipText}>+ {tpl.name.slice(0, 18)}...</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* HÌNH ẢNH DỊCH VỤ */}
            <Text style={styles.inputLabel}>Ảnh đại diện dịch vụ</Text>
            <View style={styles.imageBox}>
              {imageUri || imageUrl ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: imageUri || imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.btnChangeImg}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="camera-reverse" size={16} color="#fff" />
                    <Text style={styles.btnChangeImgText}>Đổi ảnh</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage} activeOpacity={0.8}>
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="cloud-upload-outline" size={28} color="#be185d" />
                  </View>
                  <Text style={styles.uploadTextPrimary}>Chọn ảnh từ thư viện</Text>
                  <Text style={styles.uploadTextSub}>Hỗ trợ JPG, PNG, WEBP</Text>
                </TouchableOpacity>
              )}

              {/* Mode switch for URL */}
              <View style={styles.urlToggleRow}>
                <TouchableOpacity
                  onPress={() => setIsUrlMode(!isUrlMode)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name={isUrlMode ? "chevron-up" : "link-outline"} size={14} color="#be185d" />
                  <Text style={styles.urlToggleText}>
                    {isUrlMode ? "Ẩn nhập link ảnh trực tiếp" : "Hoặc dán URL ảnh trực tiếp"}
                  </Text>
                </TouchableOpacity>
              </View>

              {isUrlMode && (
                <TextInput
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, { marginTop: 6, fontSize: 13 }]}
                  value={imageUrl}
                  onChangeText={(val) => {
                    setImageUrl(val);
                    setImageUri(val);
                    setImageBase64(null);
                  }}
                />
              )}
            </View>

            {/* TÊN DỊCH VỤ */}
            <Text style={styles.inputLabel}>
              Tên dịch vụ <Text style={{ color: "#dc2626" }}>*</Text>
            </Text>
            <TextInput
              placeholder="VD: Gói quà hoa khô Vintage, Kit thêu tay..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            {/* GIÁ & THỜI LƯỢNG */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputLabel}>
                  Giá dịch vụ (VNĐ) <Text style={{ color: "#dc2626" }}>*</Text>
                </Text>
                <TextInput
                  placeholder="VD: 50000"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Thời lượng (phút)</Text>
                <TextInput
                  placeholder="30"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                  keyboardType="numeric"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                />
              </View>
            </View>

            {/* PRESET THỜI LƯỢNG */}
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {DURATION_PRESETS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.durationChip,
                    durationMinutes === String(m) && styles.durationChipActive,
                  ]}
                  onPress={() => setDurationMinutes(String(m))}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      durationMinutes === String(m) && styles.durationChipTextActive,
                    ]}
                  >
                    {m}p
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DANH MỤC DỊCH VỤ */}
            <Text style={styles.inputLabel}>Phân loại danh mục</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.categoryBtn,
                    category === c.id && styles.categoryBtnActive,
                  ]}
                  onPress={() => setCategory(c.id)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryBtnText,
                      category === c.id && styles.categoryBtnTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* MÔ TẢ CHI TIẾT */}
            <Text style={styles.inputLabel}>Mô tả chi tiết dịch vụ</Text>
            <TextInput
              placeholder="Nêu rõ quy cách thực hiện, phụ kiện kèm theo (nơ, hoa sấy khô, thiệp viết tay...)"
              placeholderTextColor="#9ca3af"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* ACTION BUTTONS */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSubmit, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.btnSubmitText}>
                      {editingService ? "LƯU THAY ĐỔI" : "TẠO DỊCH VỤ"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fce7f3",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sampleSection: {
    marginBottom: 16,
    backgroundColor: "#fff1f2",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ffe4e6",
  },
  sampleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#be185d",
    marginBottom: 6,
  },
  sampleRow: {
    gap: 8,
  },
  sampleChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  sampleChipText: {
    fontSize: 12,
    color: "#be185d",
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  imageBox: {
    marginBottom: 6,
  },
  uploadArea: {
    backgroundColor: "#fdf2f8",
    borderWidth: 1.5,
    borderColor: "#fbcfe8",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  uploadTextPrimary: {
    fontSize: 13,
    fontWeight: "700",
    color: "#be185d",
  },
  uploadTextSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  previewContainer: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    height: 160,
    backgroundColor: "#e5e7eb",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  btnChangeImg: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnChangeImgText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  urlToggleRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  urlToggleText: {
    fontSize: 12,
    color: "#be185d",
    fontWeight: "600",
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  durationChipActive: {
    backgroundColor: "#fce7f3",
    borderColor: "#be185d",
  },
  durationChipText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  durationChipTextActive: {
    color: "#be185d",
    fontWeight: "700",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryBtnActive: {
    backgroundColor: "#fdf2f8",
    borderColor: "#be185d",
  },
  categoryBtnText: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "600",
  },
  categoryBtnTextActive: {
    color: "#be185d",
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4b5563",
  },
  btnSubmit: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#be185d",
    shadowColor: "#be185d",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
});
