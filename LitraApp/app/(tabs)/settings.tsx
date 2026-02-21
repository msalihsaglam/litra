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
    const quotesData = await AsyncStorage.getItem('litra_quotes');
    if (quotesData) {
      const quotes = JSON.parse(quotesData);
      const uniqueCats = [...new Set(quotes.map((q: any) => q.category).filter(Boolean))] as string[];
      setCategories(uniqueCats);
    }
    const colorsData = await AsyncStorage.getItem('category_colors');
    if (colorsData) setCategoryColors(JSON.parse(colorsData));
  };

  const updateColor = async (cat: string, color: string) => {
    const newColors = { ...categoryColors, [cat]: color };
    setCategoryColors(newColors);
    await AsyncStorage.setItem('category_colors', JSON.stringify(newColors));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Etiket Ayarları</Text>
      <Text style={styles.subHeader}>Kategorilerini özelleştirmek için bir renk seç.</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={{ paddingBottom: 40 }}
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
                    {/* Dış Halka (Sadece seçiliyken görünür) */}
                    <View style={[
                      styles.outerCircle,
                      isSelected && styles.activeOuterCircle
                    ]}>
                      {/* İç Renk Butonu */}
                      <View style={[styles.colorCircle, { backgroundColor: color }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Henüz etiketlenmiş bir alıntı yok.{"\n"}Oluştur ekranında bir 'Tür' ekleyerek başlayabilirsin.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { fontSize: 26, fontWeight: '800', paddingHorizontal: 20, paddingTop: 20, color: '#1A1A1A' },
  subHeader: { fontSize: 14, color: '#6C757D', paddingHorizontal: 20, marginBottom: 25 },
  catRow: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 18, borderRadius: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  catName: { fontSize: 16, fontWeight: '700', color: '#333', letterSpacing: 0.5 },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  colorScroll: { paddingRight: 20 },
  
  // PROFESYONEL SEÇİM EFEKTİ
  colorWrapper: { marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  outerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent', // Seçili değilken gizli
  },
  activeOuterCircle: {
    borderColor: '#007AFF', // Şık bir mavi halka
    backgroundColor: '#FFF', // Halka ile renk arasında beyaz boşluk hissi
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)', // Çok ince bir kenar hattı
  },
  
  empty: { textAlign: 'center', marginTop: 100, color: '#ADB5BD', lineHeight: 22, paddingHorizontal: 50 }
});