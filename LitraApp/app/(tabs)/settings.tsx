import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

// LITRA Soft Renk Paleti
const SOFT_COLORS = [
  '#E3F2FD', '#E8F5E9', '#FFF9C4', '#FFEBEE', 
  '#F3E5F5', '#FFF3E0', '#E8EAF6', '#FCE4EC'
];

export default function SettingsScreen() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryColors, setCategoryColors] = useState<{[key: string]: string}>({});
  const isFocused = useIsFocused();

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
    } catch (e) {
      console.error("Veri yükleme hatası:", e);
    }
  };

  const updateColor = async (cat: string, color: string) => {
    const newColors = { ...categoryColors, [cat]: color };
    setCategoryColors(newColors);
    await AsyncStorage.setItem('category_colors', JSON.stringify(newColors));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Üst Başlık Bölümü - Index ve Library ile tam uyumlu */}
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
               <Text style={styles.catName}># {item}</Text>
               <View style={[styles.previewDot, { backgroundColor: categoryColors[item] || '#DDD' }]} />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScroll}>
              {SOFT_COLORS.map((color) => {
                const isSelected = categoryColors[item] === color;
                return (
                  <TouchableOpacity
                    key={color}
                    onPress={() => updateColor(item, color)}
                    style={styles.colorWrapper}
                  >
                    <View style={[
                      styles.outerCircle,
                      isSelected && styles.activeOuterCircle
                    ]}>
                      <View style={[styles.colorCircle, { backgroundColor: color }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz etiketlenmiş bir alıntı yok.{"\n"}Oluştur ekranında bir 'Tür' ekleyerek başlayabilirsin.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  // TUTARLI BAŞLIK SİSTEMİ
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#1A1A1A',
    letterSpacing: -0.5
  },
  headerSubTitle: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
    marginTop: 2
  },

  listContent: { paddingBottom: 40, paddingTop: 5 },
  catRow: { 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    padding: 18, 
    borderRadius: 24, 
    marginBottom: 15, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 12 
  },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  catName: { fontSize: 16, fontWeight: '700', color: '#333', letterSpacing: 0.5 },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  colorScroll: { paddingRight: 10 },
  
  colorWrapper: { marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  outerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeOuterCircle: {
    borderColor: '#007AFF',
    backgroundColor: '#FFF',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 50 },
  emptyText: { textAlign: 'center', color: '#ADB5BD', fontSize: 15, lineHeight: 22 }
});