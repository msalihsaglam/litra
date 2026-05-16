import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [stats, setStats] = useState<any>({
    // Kitap İstatistikleri
    totalBooks: 0,
    completedBooks: 0,
    readingBooks: 0,
    plannedBooks: 0,
    
    // Alıntı İstatistikleri
    totalQuotes: 0,
    last10Days: 0,
    topBooks: [],
    topCategories: [],
  });
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadStats();
  }, [isFocused]);

  const loadStats = async () => {
    try {
      // Kitap istatistikleri
      const booksData = await AsyncStorage.getItem('litra_books');
      let bookStats = {
        total: 0,
        completed: 0,
        reading: 0,
        planned: 0
      };
      
      if (booksData) {
        const books = JSON.parse(booksData);
        bookStats.total = books.length;
        bookStats.completed = books.filter((b: any) => b.status === 'okudum').length;
        bookStats.reading = books.filter((b: any) => b.status === 'okuyorum').length;
        bookStats.planned = books.filter((b: any) => b.status === 'okuyacağım').length;
      }

      // Alıntı istatistikleri
      const quotesData = await AsyncStorage.getItem('litra_quotes');
      let quoteStats = {
        total: 0,
        last10Days: 0,
        topBooks: [],
        topCategories: []
      };

      if (quotesData) {
        const quotes = JSON.parse(quotesData);
        quoteStats.total = quotes.length;

        // Son 10 günlük alıntılar
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        const recentQuotes = quotes.filter((q: any) => {
          const [day, month, year] = q.date.split('.').map(Number);
          const quoteDate = new Date(year, month - 1, day);
          return quoteDate >= tenDaysAgo;
        });
        quoteStats.last10Days = recentQuotes.length;

        // En çok alıntı yapılan kitaplar
        const bookCounts = quotes.reduce((acc: any, q: any) => {
          const title = q.bookTitle || "Bilinmeyen Kitap";
          acc[title] = (acc[title] || 0) + 1;
          return acc;
        }, {});
        quoteStats.topBooks = Object.entries(bookCounts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3);

        // En çok tercih edilen türler
        const catCounts = quotes.reduce((acc: any, q: any) => {
          const cat = q.category || "Genel";
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});
        quoteStats.topCategories = Object.entries(catCounts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3);
      }

      setStats({
        totalBooks: bookStats.total,
        completedBooks: bookStats.completed,
        readingBooks: bookStats.reading,
        plannedBooks: bookStats.planned,
        totalQuotes: quoteStats.total,
        last10Days: quoteStats.last10Days,
        topBooks: quoteStats.topBooks,
        topCategories: quoteStats.topCategories,
      });
    } catch (e) { 
      console.error(e); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>İstatistikler</Text>
          <Text style={styles.subtitle}>Okuma yolculuğunun özeti</Text>
        </View>

        {/* Kitap İstatistikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Kitap İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.cardVal}>{stats.totalBooks}</Text>
              <Text style={styles.cardLabel}>Toplam Kitap</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.cardVal}>{stats.completedBooks}</Text>
              <Text style={styles.cardLabel}>✅ Okudum</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.cardVal}>{stats.readingBooks}</Text>
              <Text style={styles.cardLabel}>📖 Okuyorum</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FCE4EC' }]}>
              <Text style={styles.cardVal}>{stats.plannedBooks}</Text>
              <Text style={styles.cardLabel}>📌 Okuyacağım</Text>
            </View>
          </View>
        </View>

        {/* Alıntı İstatistikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✍️ Alıntı İstatistikleri</Text>
          <View style={styles.row}>
            <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.cardVal}>{stats.totalQuotes}</Text>
              <Text style={styles.cardLabel}>Toplam Alıntı</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E0F2F1' }]}>
              <Text style={styles.cardVal}>{stats.last10Days}</Text>
              <Text style={styles.cardLabel}>Son 10 Gün</Text>
            </View>
          </View>
        </View>

        {/* En Çok Alıntı Yapılan Kitaplar */}
        {stats.topBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ En Çok Alıntı Yapılanlar</Text>
            {stats.topBooks.map(([title, count]: any, index: number) => (
              <View key={index} style={styles.listRow}>
                <Text style={styles.listText} numberOfLines={1}>{index + 1}. {title}</Text>
                <Text style={styles.listCount}>{count} Adet</Text>
              </View>
            ))}
          </View>
        )}

        {/* Favori Türler */}
        {stats.topCategories.length > 0 && (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#6C757D', marginTop: 4 },
  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 15 },
  statsGrid: { gap: 10 },
  row: { flexDirection: 'row', gap: 15 },
  statCard: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  cardVal: { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
  cardLabel: { fontSize: 12, color: '#6C757D', marginTop: 8, fontWeight: '600', textAlign: 'center' },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  listText: { fontSize: 15, color: '#495057', flex: 1, marginRight: 10, fontWeight: '500' },
  listCount: { fontSize: 14, fontWeight: '700', color: '#007AFF', backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F1F3F5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 13, color: '#495057', fontWeight: '600' }
});