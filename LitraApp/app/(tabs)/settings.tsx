import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Dimensions } from 'react-native'; // Dimensions eklendi
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 187. satırdaki hatayı çözen tanım:
const { width } = Dimensions.get('window');

const SOFT_COLORS = [
  '#E3F2FD', '#E8F5E9', '#FFF9C4', '#FFEBEE', 
  '#F3E5F5', '#FFF3E0', '#E8EAF6', '#FCE4EC'
];

export default function SettingsScreen() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryColors, setCategoryColors] = useState<{[key: string]: string}>({});
  const isFocused = useIsFocused();

  const APP_VERSION = "1.0.0";
  const DEVELOPER = "M. S. Sağlam";

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  const loadData = async () => {
    try {
      const quotesData = await AsyncStorage.getItem('litra_quotes');
      if (quotesData) {
        const quotes = JSON.parse(quotesData);
        const uniqueCats = [...new Set(quotes.map((q: any) => q.category).filter(Boolean))] as string[];
        setCategories(uniqueCats);
      }
      const colorsData = await AsyncStorage.getItem('category_colors');
      if (colorsData) setCategoryColors(JSON.parse(colorsData));
    } catch (e) { console.error(e); }
  };

  const updateColor = async (cat: string, color: string) => {
    const newColors = { ...categoryColors, [cat]: color };
    setCategoryColors(newColors);
    await AsyncStorage.setItem('category_colors', JSON.stringify(newColors));
  };

  const deleteCategory = async (catToDelete: string) => {
    Alert.alert(
      "Türü Sil",
      `"${catToDelete}" etiketini tüm alıntılardan kaldırmak istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: async () => {
            try {
              const quotesData = await AsyncStorage.getItem('litra_quotes');
              if (quotesData) {
                const quotes = JSON.parse(quotesData);
                const updatedQuotes = quotes.map((q: any) => 
                  q.category === catToDelete ? { ...q, category: "" } : q
                );
                await AsyncStorage.setItem('litra_quotes', JSON.stringify(updatedQuotes));
              }
              const newColors = { ...categoryColors };
              delete newColors[catToDelete];
              setCategoryColors(newColors);
              await AsyncStorage.setItem('category_colors', JSON.stringify(newColors));
              loadData();
            } catch (e) { console.error(e); }
          } 
        }
      ]
    );
  };

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <View style={styles.divider} />
      <Text style={styles.footerTitle}>Litra App</Text>
      <Text style={styles.footerInfo}>Versiyon {APP_VERSION}</Text>
      <Text style={styles.footerInfo}>Developed by {DEVELOPER}</Text>
      <View style={styles.linkContainer}>
        <TouchableOpacity onPress={() => Alert.alert("Gizlilik Politikası", "Litra verilerinizi sadece cihazınızda saklar.")}>
          <Text style={styles.linkText}>Gizlilik Politikası</Text>
        </TouchableOpacity>
        <View style={styles.dotSeparator} />
        <TouchableOpacity onPress={() => Alert.alert("Öneri ve Destek", "mehmetsalihsaglam@gmail.com")}>
          <Text style={styles.linkText}>Destek</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.copyright}>© 2026 Tüm Hakları Saklıdır.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <Text style={styles.headerSubTitle}>Görünüm ve etiket tercihlerini özelleştir</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.catRow}>
            <View style={styles.catInfo}>
              <View style={styles.catTitleWrapper}>
                <Text style={styles.catName}># {item}</Text>
                <View style={[styles.previewDot, { backgroundColor: categoryColors[item] || '#DDD' }]} />
              </View>
              <TouchableOpacity onPress={() => deleteCategory(item)} style={styles.deleteArea}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" opacity={0.6} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScroll}>
              {SOFT_COLORS.map((color) => {
                const isSelected = categoryColors[item] === color;
                return (
                  <TouchableOpacity key={color} onPress={() => updateColor(item, color)} style={styles.colorWrapper}>
                    <View style={[styles.outerCircle, isSelected && styles.activeOuterCircle]}>
                      <View style={[styles.colorCircle, { backgroundColor: color }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz etiketlenmiş bir alıntı yok.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
  headerSubTitle: { fontSize: 14, color: '#6C757D', fontWeight: '500' },
  listContent: { paddingBottom: 40 },
  catRow: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 18, borderRadius: 24, marginBottom: 15, elevation: 3 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  catTitleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catName: { fontSize: 16, fontWeight: '700' },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  deleteArea: { padding: 4 },
  colorScroll: { paddingRight: 10 },
  colorWrapper: { marginRight: 12 },
  outerCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  activeOuterCircle: { borderColor: '#007AFF' },
  colorCircle: { width: 28, height: 28, borderRadius: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { textAlign: 'center', color: '#ADB5BD' },
  footerContainer: { marginTop: 20, alignItems: 'center', paddingBottom: 30 },
  divider: { width: width * 0.8, height: 1, backgroundColor: '#E9ECEF', marginBottom: 25 },
  footerTitle: { fontSize: 18, fontWeight: '800', color: '#ADB5BD' },
  footerInfo: { fontSize: 12, color: '#ADB5BD' },
  linkContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  linkText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ADB5BD', marginHorizontal: 10 },
  copyright: { fontSize: 10, color: '#CED4DA', marginTop: 20 }
});