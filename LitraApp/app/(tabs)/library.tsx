import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

interface QuoteItem {
  id: string;
  quote: string;
  bookTitle: string;
  author: string;
  theme: string;
  pageNumber?: string;
  category?: string;
}

export default function LibraryScreen() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [categoryColors, setCategoryColors] = useState<{[key: string]: string}>({});
  const [searchQuery, setSearchQuery] = useState(''); // Arama metni
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Seçili etiket
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem('litra_quotes');
      if (data) setQuotes(JSON.parse(data));
      const colorsData = await AsyncStorage.getItem('category_colors');
      if (colorsData) setCategoryColors(JSON.parse(colorsData));
    } catch (e) { console.error(e); }
  };

  // FİLTRELEME MANTIĞI
  const filteredQuotes = useMemo(() => {
    return quotes.filter(item => {
      const matchesSearch = item.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.quote.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, quotes]);

  // Mevcut tüm benzersiz kategorileri listele (Filtre butonları için)
  const uniqueCategories = useMemo(() => {
    return [...new Set(quotes.map(q => q.category).filter(Boolean))] as string[];
  }, [quotes]);

  const deleteQuote = (id: string) => {
    Alert.alert("Alıntıyı Sil", "Emin misiniz?", [
      { text: "Vazgeç" },
      { text: "Sil", style: "destructive", onPress: async () => {
          const updatedList = quotes.filter(item => item.id !== id);
          setQuotes(updatedList);
          await AsyncStorage.setItem('litra_quotes', JSON.stringify(updatedList));
      }}
    ]);
  };

  const renderItem = ({ item }: { item: QuoteItem }) => {
    const isDarkTheme = item.theme === 'modern' || item.theme === 'midnight';
    const tagBgColor = (item.category && categoryColors[item.category]) ? categoryColors[item.category] : '#F1F3F5';

    return (
      <View style={[styles.quoteCard, (styles as any)[item.theme] || styles.classic]}>
        {item.category && (
          <View style={[styles.badge, { backgroundColor: tagBgColor }]}>
            <Text style={[styles.badgeText, { color: isDarkTheme ? '#FFF' : '#495057' }]}># {item.category}</Text>
          </View>
        )}
        <Text style={[styles.quoteText, { color: isDarkTheme ? '#FFF' : '#333' }]} numberOfLines={3}>"{item.quote}"</Text>
        <View style={styles.footer}>
          <View style={styles.infoWrapper}>
            <View style={[styles.accentLine, { backgroundColor: tagBgColor }]} />
            <View>
              <Text style={[styles.bookInfo, { color: isDarkTheme ? '#AAA' : '#888' }]}>{item.bookTitle} — {item.author}</Text>
              {item.pageNumber && <Text style={[styles.pageText, { color: isDarkTheme ? '#888' : '#AAA' }]}>S. {item.pageNumber}</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={() => deleteQuote(item.id)}><Text style={styles.deleteBtn}>🗑️</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Kitaplığım</Text>

      {/* ARAMA ÇUBUĞU */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Kitap, yazar veya metin ara..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* KATEGORİ CHIPS (HIZLI FİLTRE) */}
      <View style={{ maxHeight: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, !selectedCategory && styles.activeFilterChip]} 
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterText, !selectedCategory && styles.activeFilterText]}>Tümü</Text>
          </TouchableOpacity>
          {uniqueCategories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.filterChip, selectedCategory === cat && styles.activeFilterChip]} 
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.activeFilterText]}># {cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{searchQuery || selectedCategory ? "Aramanızla eşleşen sonuç bulunamadı." : "Henüz bir alıntı eklemedin."}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerTitle: { fontSize: 28, fontWeight: '800', paddingHorizontal: 20, paddingTop: 60, color: '#1A1A1A' },
  
  // Arama ve Filtre Stilleri
  searchContainer: { paddingHorizontal: 20, marginVertical: 15 },
  searchInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', fontSize: 14 },
  filterScroll: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', borderSize: 1, borderColor: '#DDD' },
  activeFilterChip: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 13, color: '#666', fontWeight: '600' },
  activeFilterText: { color: '#FFF' },

  listContent: { padding: 15, paddingBottom: 100 },
  quoteCard: { padding: 20, borderRadius: 24, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, borderLeftWidth: 6 },
  classic: { backgroundColor: '#FDFCF8', borderLeftColor: '#E6E2D3' },
  modern: { backgroundColor: '#1A1A1B', borderLeftColor: '#007AFF' },
  nature: { backgroundColor: '#E8F5E9', borderLeftColor: '#A5D6A7' },
  vintage: { backgroundColor: '#F4ECD8', borderLeftColor: '#8D6E63' },
  midnight: { backgroundColor: '#0D1B2A', borderLeftColor: '#778DA9' },
  rose: { backgroundColor: '#FCE4EC', borderLeftColor: '#F06292' },
  ocean: { backgroundColor: '#E0F2F1', borderLeftColor: '#4DB6AC' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginBottom: 12 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  quoteText: { fontSize: 15, fontStyle: 'italic', lineHeight: 22, marginBottom: 18, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  accentLine: { width: 3, height: 28, marginRight: 10, borderRadius: 2 },
  bookInfo: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  pageText: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  deleteBtn: { fontSize: 18, opacity: 0.6 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#ADB5BD' }
});