import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { QuoteItem } from '../../context/MigrationContext';
import StoryGenerator from '../../components/StoryGenerator';

export default function MyQuotesScreen() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [categoryColors, setCategoryColors] = useState<{[key: string]: string}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const { colors } = useTheme();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  
  const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);
  const [selectedQuoteForStory, setSelectedQuoteForStory] = useState<QuoteItem | null>(null);
  const [bookImage, setBookImage] = useState<string | undefined>(undefined);

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

  const openEditModal = (item: QuoteItem) => {
    setEditingItem({ ...item });
    setIsEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const updatedList = quotes.map(q => q.id === editingItem.id ? { ...editingItem, category: editingItem.category?.trim() || "" } : q);
    setQuotes(updatedList);
    await AsyncStorage.setItem('litra_quotes', JSON.stringify(updatedList));
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

  const openStoryModal = async (item: QuoteItem) => {
    try {
      // Kitabın fotoğrafını yükle
      if (item.bookId) {
        const booksData = await AsyncStorage.getItem('litra_books');
        if (booksData) {
          const books = JSON.parse(booksData);
          const book = books.find((b: any) => b.id === item.bookId);
          if (book && book.image) {
            setBookImage(book.image);
          }
        }
      }
      setSelectedQuoteForStory(item);
      setIsStoryModalVisible(true);
    } catch (e) {
      console.error('Story modal açılırken hata:', e);
    }
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
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={() => openStoryModal(item)} 
                style={styles.shareButton}
              >
                <Text style={styles.shareBtn}>✨</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => deleteQuote(item.id)} 
                style={styles.deleteArea}
              >
                <Text style={styles.deleteBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerSection, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Alıntılarım</Text>
        <Text style={[styles.headerSubTitle, { color: colors.textSecondary }]}>{quotes.length} adet kayıtlı alıntı</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.borderColor }]}
          placeholder="Kitap, yazar veya metin ara..."
          placeholderTextColor={colors.textSecondary}
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{searchQuery || selectedCategory ? "Arama sonucu bulunamadı." : "Henüz bir alıntı eklemedin."}</Text>
          </View>
        }
      />

      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alıntıyı Düzenle</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}><Text style={styles.closeBtn}>Kapat</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Alıntı Metni</Text>
              <TextInput style={[styles.modalInput, { height: 120 }]} multiline value={editingItem?.quote} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, quote: text} : null)} />
              
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Kitap Adı</Text>
                  <View style={[styles.modalInput, { justifyContent: 'center', paddingVertical: 15 }]}>
                    <Text style={{ color: '#333', fontSize: 15 }}>{editingItem?.bookTitle}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Yazar</Text>
                  <View style={[styles.modalInput, { justifyContent: 'center', paddingVertical: 15 }]}>
                    <Text style={{ color: '#333', fontSize: 15 }}>{editingItem?.author}</Text>
                  </View>
                </View>
              </View>

              <View style={{ width: 100 }}>
                <Text style={styles.inputLabel}>Sayfa No</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={editingItem?.pageNumber} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, pageNumber: text} : null)} />
              </View>
              <TouchableOpacity style={styles.updateBtn} onPress={saveEdit}><Text style={styles.updateBtnText}>Değişiklikleri Kaydet</Text></TouchableOpacity>
              <View style={{ height: 40 }} /> 
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal 
        visible={isStoryModalVisible} 
        animationType="slide" 
        transparent={false}
        onRequestClose={() => {
          setIsStoryModalVisible(false);
          setSelectedQuoteForStory(null);
          setBookImage(undefined);
        }}
      >
        {selectedQuoteForStory && (
          <StoryGenerator
            quote={selectedQuoteForStory.quote}
            bookTitle={selectedQuoteForStory.bookTitle}
            author={selectedQuoteForStory.author}
            theme={selectedQuoteForStory.theme}
            category={selectedQuoteForStory.category}
            bookImageUri={bookImage}
            onClose={() => {
              setIsStoryModalVisible(false);
              setSelectedQuoteForStory(null);
              setBookImage(undefined);
            }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  headerSubTitle: { fontSize: 14, color: '#6C757D', fontWeight: '500', marginTop: 2 },
  searchContainer: { paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
  searchInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', fontSize: 14, color: '#333' },
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
  actionButtons: { flexDirection: 'row', gap: 8 },
  shareButton: { padding: 8 },
  shareBtn: { fontSize: 18, opacity: 0.7 },
  deleteArea: { padding: 8 },
  deleteBtn: { fontSize: 18, opacity: 0.6 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#ADB5BD' },
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
