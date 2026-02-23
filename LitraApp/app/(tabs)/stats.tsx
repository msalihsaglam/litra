import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [stats, setStats] = useState<any>({
    last10Days: 0,
    topBooks: [],
    topCategories: [],
    totalQuotes: 0
  });
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadStats();
  }, [isFocused]);

  const loadStats = async () => {
    try {
      const data = await AsyncStorage.getItem('litra_quotes');
      if (data) {
        const quotes = JSON.parse(data);
        
        // 1. Son 10 Günlük Filtreleme
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        const recentQuotes = quotes.filter((q: any) => {
          // Tarih formatı: "24.02.2026"
          const [day, month, year] = q.date.split('.').map(Number);
          const quoteDate = new Date(year, month - 1, day);
          return quoteDate >= tenDaysAgo;
        });

        // 2. En Çok Alıntı Yapılan Kitaplar
        const bookCounts = quotes.reduce((acc: any, q: any) => {
          const title = q.bookTitle || "Bilinmeyen Kitap";
          acc[title] = (acc[title] || 0) + 1;
          return acc;
        }, {});
        const sortedBooks = Object.entries(bookCounts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3);

        // 3. En Çok Tercih Edilen Türler
        const catCounts = quotes.reduce((acc: any, q: any) => {
          const cat = q.category || "Genel";
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});
        const sortedCats = Object.entries(catCounts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3);

        setStats({
          last10Days: recentQuotes.length,
          topBooks: sortedBooks,
          topCategories: sortedCats,
          totalQuotes: quotes.length
        });
      }
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>İstatistikler</Text>
          <Text style={styles.subtitle}>Okuma yolculuğunun özeti</Text>
        </View>

        {/* Özet Kartları */}
        <View style={styles.row}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.cardVal}>{stats.last10Days}</Text>
            <Text style={styles.cardLabel}>Son 10 Gün</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.cardVal}>{stats.totalQuotes}</Text>
            <Text style={styles.cardLabel}>Toplam Alıntı</Text>
          </View>
        </View>

        {/* En Çok Alıntı Yapılan Kitaplar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 En Çok Alıntı Yapılanlar</Text>
          {stats.topBooks.map(([title, count]: any, index: number) => (
            <View key={index} style={styles.listRow}>
              <Text style={styles.listText} numberOfLines={1}>{title}</Text>
              <Text style={styles.listCount}>{count} Adet</Text>
            </View>
          ))}
        </View>

        {/* Favori Türler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Favori Türler</Text>
          <View style={styles.chipContainer}>
            {stats.topCategories.map(([cat, count]: any, index: number) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{cat} ({count})</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#6C757D', marginTop: 4 },
  row: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statCard: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center' },
  cardVal: { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
  cardLabel: { fontSize: 12, color: '#6C757D', marginTop: 4, fontWeight: '600' },
  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 15 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  listText: { fontSize: 15, color: '#495057', flex: 1, marginRight: 10 },
  listCount: { fontSize: 14, fontWeight: '700', color: '#007AFF' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F1F3F5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 13, color: '#495057', fontWeight: '600' }
});