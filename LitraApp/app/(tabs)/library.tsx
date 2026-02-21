import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

// TypeScript tipi (TSX kullanıyorsan kalsın, JS ise silebilirsin)
interface QuoteItem {
  id: string;
  quote: string;
  bookTitle: string;
  author: string;
  theme: string;
}

export default function LibraryScreen() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadQuotes();
    }
  }, [isFocused]);

  const loadQuotes = async () => {
    try {
      const data = await AsyncStorage.getItem('litra_quotes');
      if (data) {
        setQuotes(JSON.parse(data));
      }
    } catch (e) {
      console.error("Yükleme hatası:", e);
    }
  };

  const deleteQuote = (id: string) => {
    Alert.alert("Alıntıyı Sil", "Bu alıntıyı kütüphanenden silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { 
        text: "Sil", 
        style: "destructive", 
        onPress: async () => {
          const updatedList = quotes.filter(item => item.id !== id);
          setQuotes(updatedList);
          await AsyncStorage.setItem('litra_quotes', JSON.stringify(updatedList));
        } 
      }
    ]);
  };

  const renderItem = ({ item }: { item: QuoteItem }) => (
    <View style={[
      styles.quoteCard, 
      styles[item.theme] || styles.classic // Dinamik Tema Seçimi
    ]}>
      <Text 
        style={[
          styles.quoteText, 
          { color: (item.theme === 'modern' || item.theme === 'midnight') ? '#FFF' : '#333' }
        ]} 
        numberOfLines={3}
      >
        "{item.quote}"
      </Text>
      <View style={styles.footer}>
        <View style={styles.infoWrapper}>
          <View style={[styles.accentLine, { backgroundColor: (item.theme === 'modern' || item.theme === 'midnight') ? '#555' : '#DDD' }]} />
          <Text style={[styles.bookInfo, { color: (item.theme === 'modern' || item.theme === 'midnight') ? '#AAA' : '#888' }]}>
            {item.bookTitle} — {item.author}
          </Text>
        </View>
        <TouchableOpacity onPress={() => deleteQuote(item.id)} style={styles.deleteArea}>
          <Text style={styles.deleteBtn}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Kitaplığım</Text>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Henüz bir alıntı eklemedin. Oluştur sayfasından ilk alıntını kaydedebilirsin! ✨</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerTitle: { fontSize: 28, fontWeight: '800', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, color: '#1A1A1A' },
  listContent: { padding: 15, paddingBottom: 100 },
  
  // Ana Kart Yapısı
  quoteCard: { 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10,
    borderLeftWidth: 6,
  },

  // Tema Renkleri
  classic: { backgroundColor: '#FDFCF8', borderLeftColor: '#E6E2D3' },
  modern: { backgroundColor: '#1A1A1B', borderLeftColor: '#007AFF' },
  nature: { backgroundColor: '#E8F5E9', borderLeftColor: '#A5D6A7' },
  vintage: { backgroundColor: '#F4ECD8', borderLeftColor: '#8D6E63' },
  midnight: { backgroundColor: '#0D1B2A', borderLeftColor: '#778DA9' },
  rose: { backgroundColor: '#FCE4EC', borderLeftColor: '#F06292' },
  ocean: { backgroundColor: '#E0F2F1', borderLeftColor: '#4DB6AC' },

  quoteText: { 
    fontSize: 16, 
    fontStyle: 'italic', 
    lineHeight: 24,
    marginBottom: 15,
    fontWeight: '500'
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 5
  },
  infoWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  accentLine: { width: 2, height: 12, marginRight: 8, borderRadius: 1 },
  bookInfo: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteArea: { padding: 5 },
  deleteBtn: { fontSize: 18, opacity: 0.7 },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: '#ADB5BD', fontSize: 15, lineHeight: 22 }
});