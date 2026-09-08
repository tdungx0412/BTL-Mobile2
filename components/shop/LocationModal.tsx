import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PROVINCES } from '@/constants/provinces';
import { styles } from './shop-styles';

type LocationModalProps = {
  visible: boolean;
  search: string;
  selectedProvince: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onSelect: (province: string) => void;
};

export function LocationModal({ visible, search, selectedProvince, onSearchChange, onClose, onSelect }: LocationModalProps) {
  const filteredProvinces = useMemo(
    () => PROVINCES.filter((province) => province.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><View style={styles.modalSheet}>
        <View style={styles.modalHeader}><View><ThemedText type="subtitle" style={styles.modalTitle}>Chọn địa điểm</ThemedText><ThemedText style={styles.countText}>{PROVINCES.length} tỉnh, thành phố</ThemedText></View><Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Đóng menu địa điểm"><Ionicons name="close" size={22} color="#52636a" /></Pressable></View>
        <View style={styles.searchBox}><Ionicons name="search" size={19} color="#71858c" /><TextInput value={search} onChangeText={onSearchChange} placeholder="Tìm tỉnh, thành phố..." placeholderTextColor="#8a9aa0" style={styles.searchInput} autoCapitalize="words" accessibilityLabel="Tìm tỉnh thành phố" /></View>
        <FlatList data={filteredProvinces} keyExtractor={(province) => province} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent} renderItem={({ item }) => { const isSelected = item === selectedProvince; return <Pressable style={[styles.provinceRow, isSelected && styles.selectedRow]} onPress={() => onSelect(item)}><ThemedText style={[styles.provinceName, isSelected && styles.selectedName]}>{item}</ThemedText>{isSelected && <Ionicons name="checkmark-circle" size={21} color="#7142a5" />}</Pressable>; }} ListEmptyComponent={<ThemedText style={styles.emptyText}>Không tìm thấy địa điểm phù hợp.</ThemedText>} />
      </View></View>
    </Modal>
  );
}
