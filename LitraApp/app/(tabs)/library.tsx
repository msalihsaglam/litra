import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

// TypeScript kullanıyorsan objenin yapısını tanıtıyoruz (Kırmızı çizgileri bitirir)
interface QuoteItem {
  id: string;
  quote: string;
  bookTitle: string;
  author: string;
  theme: 'classic' | 'modern' | 'nature';
  date?: string;
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
    Alert.alert("Sil", "bu alıntıyı silmek istediğine emin misin?", [
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
    <View style={[styles.quoteCard, styles[item.theme]]}>
      {/* Yazı rengini temanın içine gömdüğümüz için burada hata almayacaksın */}
      <Text 
        style={[
          styles.quoteText, 
          { color: item.theme === 'modern' ? '#FFF' : '#333' }
        ]} 
        numberOfLines={3}
      >
        "{item.quote}"
      </Text>
      <View style={styles.footer}>
        <Text style={styles.bookInfo}>{item.bookTitle} — {item.author}</Text>
        <TouchableOpacity onPress={() => deleteQuote(item.id)}>
          <Text style={styles.deleteBtn}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Kitaplığım</Text>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz kaydedilmiş bir alıntı yok. İlk alıntını oluştur!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 20, color: '#1A1A1A', paddingTop: 60 },
  listContent: { padding: 15, paddingBottom: 100 },
  quoteCard: { 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 15, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 8 
  },
  classic: { backgroundColor: '#FDFCF8', borderLeftWidth: 6, borderLeftColor: '#E6E2D3' },
  modern: { backgroundColor: '#1A1A1B', borderLeftWidth: 6, borderLeftColor: '#007AFF' },
  nature: { backgroundColor: '#E8F5E9', borderLeftWidth: 6, borderLeftColor: '#A5D6A7' },
  quoteText: { 
    fontSize: 16, 
    fontStyle: 'italic', 
    lineHeight: 24,
    marginBottom: 15 
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 10 },
  bookInfo: { fontSize: 11, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', flex: 1 },
  deleteBtn: { fontSize: 20, marginLeft: 10 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', color: '#ADB5BD', paddingHorizontal: 40, fontSize: 16 }
});