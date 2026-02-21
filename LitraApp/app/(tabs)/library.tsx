import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const isFocused = useIsFocused();

  // --- DÜZENLEME STATE'LERİ ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);

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

  const filteredQuotes = useMemo(() => {
    return quotes.filter(item => {
      const matchesSearch = item.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.quote.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, quotes]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(quotes.map(q => q.category).filter(Boolean))] as string[];
  }, [quotes]);

  // --- DÜZENLEME FONKSİYONLARI ---
  const openEditModal = (item: QuoteItem) => {
    setEditingItem({ ...item });
    setIsEditModalVisible(true);
  };

const saveEdit = async () => {
  if (!editingItem) return;
  
  // 1. Mevcut listeyi kopyala ve sadece ilgili öğeyi güncelle
  // Bu işlem eski etiketi genel listeden silmez, sadece BU alıntının etiketini değiştirir.
  const updatedList = quotes.map(q => {
    if (q.id === editingItem.id) {
      return {
        ...editingItem,
        // Eğer kullanıcı etiketi boş bıraktıysa null veya boş string yapabiliriz
        category: editingItem.category?.trim() || "" 
      };
    }
    return q;
  });

  // 2. State ve LocalStorage güncelle
  setQuotes(updatedList);
  await AsyncStorage.setItem('litra_quotes', JSON.stringify(updatedList));
  
  // 3. Modalı kapat
  setIsEditModalVisible(false);
  Alert.alert("Güncellendi", "Değişiklikler kaydedildi.");
};

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
      <TouchableOpacity activeOpacity={0.8} onPress={() => openEditModal(item)}>
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
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Kitaplığım</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Kitap, yazar veya metin ara..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
      />

      {/* --- DÜZENLEME MODALI --- */}
<Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alıntıyı Düzenle</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.closeBtn}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Alıntı Metni</Text>
              <TextInput
                style={[styles.modalInput, { height: 120 }]}
                multiline
                value={editingItem?.quote}
                onChangeText={(text) => setEditingItem(prev => prev ? {...prev, quote: text} : null)}
              />

              <Text style={styles.inputLabel}>Kitap Adı</Text>
              <TextInput
                style={styles.modalInput}
                value={editingItem?.bookTitle}
                onChangeText={(text) => setEditingItem(prev => prev ? {...prev, bookTitle: text} : null)}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Yazar</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editingItem?.author}
                    onChangeText={(text) => setEditingItem(prev => prev ? {...prev, author: text} : null)}
                  />
                </View>
                <View style={{ width: 80 }}>
                  <Text style={styles.inputLabel}>S. No</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={editingItem?.pageNumber}
                    onChangeText={(text) => setEditingItem(prev => prev ? {...prev, pageNumber: text} : null)}
                  />
                </View>
              </View>

              {/* --- YENİ: ETİKET / KATEGORİ DÜZENLEME --- */}
              <Text style={styles.inputLabel}>Tür / Etiket (Örn: Roman, Felsefe)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Kategori girin..."
                value={editingItem?.category}
                onChangeText={(text) => setEditingItem(prev => prev ? {...prev, category: text} : null)}
              />

              <TouchableOpacity style={styles.updateBtn} onPress={saveEdit}>
                <Text style={styles.updateBtnText}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
              
              <View style={{ height: 40 }} /> 
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerTitle: { fontSize: 28, fontWeight: '800', paddingHorizontal: 20, paddingTop: 60, color: '#1A1A1A' },
  
  searchContainer: { paddingHorizontal: 20, marginVertical: 15 },
  searchInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', fontSize: 14 },
  filterScroll: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', borderWidth: 1, borderColor: '#DDD' },
  activeFilterChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
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

  // MODAL STİLLERİ
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { color: '#007AFF', fontWeight: '600' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#ADB5BD', marginBottom: 8, textTransform: 'uppercase' },
  modalInput: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEE', color: '#333' },
  updateBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  updateBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});