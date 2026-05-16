import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [stats, setStats] = useState<any>({
    // Kitap İstatistikleri
    totalBooks: 0,
    completedBooks: 0,
    readingBooks: 0,
    plannedBooks: 0,
    avgCompletionDays: 0,
    avgReadingDays: 0,
    
    // Alıntı İstatistikleri
    totalQuotes: 0,
    last10Days: 0,
    topBooks: [],
    topCategories: [],
  });
  const isFocused = useIsFocused();
  const { colors } = useTheme();

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
        planned: 0,
        avgCompletionDays: 0,
        avgReadingDays: 0,
        topCategories: []
      };
      
      if (booksData) {
        const books = JSON.parse(booksData);
        bookStats.total = books.length;
        bookStats.completed = books.filter((b: any) => b.status === 'okudum').length;
        bookStats.reading = books.filter((b: any) => b.status === 'okuyorum').length;
        bookStats.planned = books.filter((b: any) => b.status === 'okuyacağım').length;

        // Ortalama okuma süresi (tamamlanan kitaplar)
        const completedBooks = books.filter((b: any) => b.status === 'okudum' && b.dateCompleted);
        if (completedBooks.length > 0) {
          let totalDays = 0;
          completedBooks.forEach((b: any) => {
            const [addDay, addMonth, addYear] = b.dateAdded.split('.').map(Number);
            const [compDay, compMonth, compYear] = b.dateCompleted.split('.').map(Number);
            const addDate = new Date(addYear, addMonth - 1, addDay);
            const compDate = new Date(compYear, compMonth - 1, compDay);
            // Gün farkı + 1 (aynı günü de saymak için)
            const daysDiff = Math.ceil((compDate.getTime() - addDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            totalDays += daysDiff;
          });
          bookStats.avgCompletionDays = Math.round(totalDays / completedBooks.length);
        }

        // Ortalama okuma süresi (şu anda okuyorum olanlar - başlangıçtan bugüne kadar geçen gün)
        const readingBooks = books.filter((b: any) => b.status === 'okuyorum');
        if (readingBooks.length > 0) {
          let totalDays = 0;
          readingBooks.forEach((b: any) => {
            const [addDay, addMonth, addYear] = b.dateAdded.split('.').map(Number);
            const addDate = new Date(addYear, addMonth - 1, addDay);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Saati sıfırla
            const daysDiff = Math.ceil((today.getTime() - addDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            totalDays += daysDiff;
          });
          bookStats.avgReadingDays = Math.round(totalDays / readingBooks.length);
        }

        // Etiketlere göre kitap sayısı
        const catCounts = books.reduce((acc: any, b: any) => {
          if (b.category) {
            acc[b.category] = (acc[b.category] || 0) + 1;
          }
          return acc;
        }, {});
        bookStats.topCategories = Object.entries(catCounts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3);
      }

      // Alıntı istatistikleri
      const quotesData = await AsyncStorage.getItem('litra_quotes');
      let quoteStats = {
        total: 0,
        last10Days: 0,
        topBooks: []
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
      }

      setStats({
        totalBooks: bookStats.total,
        completedBooks: bookStats.completed,
        readingBooks: bookStats.reading,
        plannedBooks: bookStats.planned,
        avgCompletionDays: bookStats.avgCompletionDays,
        avgReadingDays: bookStats.avgReadingDays,
        totalQuotes: quoteStats.total,
        last10Days: quoteStats.last10Days,
        topBooks: quoteStats.topBooks,
        topCategories: bookStats.topCategories,
      });
    } catch (e) { 
      console.error(e); 
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.title, { color: colors.text }]}>İstatistikler</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Okuma yolculuğunun özeti</Text>
        </View>

        {/* Kitap İstatistikleri */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📚 Kitap İstatistikleri</Text>
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

        {/* Okuma Süresi İstatistikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Okuma Süresi Analizi</Text>
          <View style={styles.row}>
            {stats.avgCompletionDays > 0 && (
              <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.cardVal}>{stats.avgCompletionDays}</Text>
                <Text style={styles.cardLabel}>Ortalama Bitirme Süresi (Gün)</Text>
              </View>
            )}
            {stats.avgReadingDays > 0 && (
              <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.cardVal}>{stats.avgReadingDays}</Text>
                <Text style={styles.cardLabel}>Ortalama Okuma Süresi (Gün)</Text>
              </View>
            )}
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