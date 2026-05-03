import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, TextInput, ScrollView, Alert, Dimensions, ActivityIndicator, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import QuoteCard from '../../components/QuoteCard';
import ImagePicker from 'react-native-image-crop-picker'; // KRİTİK: TEKRAR AKTİF

const { width, height } = Dimensions.get('window');

const THEME_LIST = [
  { id: 'classic', color: '#FDFCF8', label: 'Klasik' },
  { id: 'modern', color: '#1A1A1B', label: 'Modern' },
  { id: 'nature', color: '#E8F5E9', label: 'Doğa' },
  { id: 'vintage', color: '#F4ECD8', label: 'Eski Kitap' },
  { id: 'midnight', color: '#0D1B2A', label: 'Gece' },
  { id: 'rose', color: '#FCE4EC', label: 'Zarif' },
  { id: 'ocean', color: '#E0F2F1', label: 'Deniz' },
];

export default function Index() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('camera'); 
  const [quote, setQuote] = useState("Rakamlar sınırları belirler; iyinin, mükemmelin sınırları yoktur.");
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pageNumber, setPageNumber] = useState(""); 
  const [category, setCategory] = useState("");     
  const [theme, setTheme] = useState('classic');
  const [loading, setLoading] = useState(false);

  // --- KİTAP SEÇİCİ STATE'LERİ ---
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [recentBooks, setRecentBooks] = useState<{title: string, author: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isFocused) loadRecentBooks();
  }, [isFocused]);

  const loadRecentBooks = async () => {
    try {
      const data = await AsyncStorage.getItem('litra_quotes');
      if (data) {
        const quotes = JSON.parse(data);
        const uniqueMap = new Map();
        quotes.forEach((q: any) => {
          if (q.bookTitle && !uniqueMap.has(q.bookTitle.toLowerCase())) {
            uniqueMap.set(q.bookTitle.toLowerCase(), { title: q.bookTitle, author: q.author });
          }
        });
        setRecentBooks(Array.from(uniqueMap.values()));
      }
    } catch (e) { console.log(e); }
  };

  const filteredBooks = recentBooks.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recognizeText = async (base64Image: string) => {
    try {
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpg;base64,${base64Image}`);
      formData.append('language', 'tur');
      formData.append('apikey', 'K81155988288957');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true'); 
      formData.append('scale', 'true'); 

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        let detectedText = result.ParsedResults[0].ParsedText;
        const cleanText = detectedText.replace(/\r?\n|\r/g, " ").trim();
        setQuote(cleanText);
      }
    } catch (error) {
      Alert.alert("Hata", "Bağlantı sorunu.");
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = () => {
    ImagePicker.openCamera({
      width: 1200,
      height: 800,
      cropping: true,
      freeStyleCropEnabled: true,
      mediaType: 'photo',
      includeBase64: true,
      cropperToolbarTitle: 'Alıntıyı Seç ve Kırp',
      cropperActiveWidgetColor: '#007AFF',
      cropperToolbarColor: '#FFFFFF',
      cropperStatusBarColor: '#FFFFFF',
      cropperCancelText: 'Vazgeç',
      cropperChooseText: 'Onayla ve Tara',
    }).then((image: any) => {
      if (image && image.data) {
        setLoading(true);
        recognizeText(image.data);
      }
    }).catch(e => {
      if (e.code !== 'E_PICKER_CANCELLED') console.log(e);
    });
  };

  const saveToLibrary = async () => {
    if (!quote || quote.length < 5) return;
    try {
      const newEntry = {
        id: Date.now().toString(),
        quote,
        bookTitle: bookTitle || "Bilinmeyen Kitap",
        author: author || "Bilinmeyen Yazar",
        pageNumber: pageNumber || "",
        category: category || "",
        theme,
        date: new Date().toLocaleDateString('tr-TR'),
      };
      const data = await AsyncStorage.getItem('litra_quotes');
      const list = data ? JSON.parse(data) : [];
      await AsyncStorage.setItem('litra_quotes', JSON.stringify([newEntry, ...list]));
      
      setQuote("Kitaptan bir alıntı taramak için kamerayı açın.");
      setBookTitle("");
      setAuthor("");
      Alert.alert("Kaydedildi!", "✨", [
        { text: "Tamam" },
        { text: "Kitaplığa Git", onPress: () => router.push('/library') }
      ]);
    } catch (e) { Alert.alert("Hata", "Sorun oluştu."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Litra</Text>
        <Text style={styles.headerSubTitle}>Yeni alıntı ekle veya tara</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'camera' && styles.activeTab]} onPress={() => setActiveTab('camera')}>
          <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>📷 Fotoğraf Çek</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'manual' && styles.activeTab]} onPress={() => setActiveTab('manual')}>
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>✍️ Elle Gir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentWrapper} showsVerticalScrollIndicator={false}>
        <QuoteCard 
          quote={loading ? "Metin taranıyor..." : quote} 
          bookTitle={bookTitle} author={author} theme={theme} 
          pageNumber={pageNumber} category={category} 
        />

        <View style={styles.manualSection}>
          {activeTab === 'manual' && (
            <TextInput 
              style={[styles.input, { height: 80 }]} multiline 
              placeholder="Alıntıyı buraya yazın..." value={quote} onChangeText={setQuote}
            />
          )}
          
          <View style={styles.inputWithIcon}>
            <TextInput 
              style={[styles.input, { flex: 1, marginBottom: 0 }]} 
              placeholder="Kitap Adı" value={bookTitle} onChangeText={setBookTitle} 
            />
            <TouchableOpacity 
              style={styles.iconInsideInput} 
              onPress={() => { setSearchQuery(""); setBookModalVisible(true); }}
            >
              <Ionicons name="library" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Yazar" value={author} onChangeText={setAuthor} />
        </View>

        {activeTab === 'camera' && (
          <TouchableOpacity style={styles.cameraMainButton} onPress={takePhoto} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📷 Taramayı Başlat</Text>}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveLibraryButton} onPress={saveToLibrary}>
          <Text style={styles.saveButtonText}>📌 Kitaplığıma Kaydet</Text>
        </TouchableOpacity>

        <View style={styles.themeContainer}>
          <Text style={styles.themeLabel}>GÖRÜNÜM STİLİ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeScrollContent}>
            {THEME_LIST.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.themeButton, { backgroundColor: t.color }, theme === t.id && styles.activeTheme]} onPress={() => setTheme(t.id)}>
                {theme === t.id && <View style={styles.checkDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* --- KİTAP SEÇİCİ MODAL --- */}
      <Modal visible={bookModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kitap Seç</Text>
              <TouchableOpacity onPress={() => setBookModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#ADB5BD" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#ADB5BD" style={{marginLeft: 10}} />
              <TextInput 
                style={styles.searchBar} placeholder="Kitap veya yazar ara..." 
                value={searchQuery} onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredBooks}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.bookSelectItem}
                  onPress={() => {
                    setBookTitle(item.title);
                    setAuthor(item.author);
                    setBookModalVisible(false);
                  }}
                >
                  <View style={styles.bookIconCircle}><Ionicons name="book" size={16} color="#007AFF" /></View>
                  <View>
                    <Text style={styles.bookSelectTitle}>{item.title}</Text>
                    <Text style={styles.bookSelectAuthor}>{item.author}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Henüz kayıtlı kitap yok.</Text>}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  headerSubTitle: { fontSize: 14, color: '#6C757D', fontWeight: '500', marginTop: 2 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E9ECEF', marginHorizontal: 20, marginVertical: 10, borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontWeight: '600', color: '#6C757D' },
  activeTabText: { color: '#007AFF' },
  contentWrapper: { alignItems: 'center', paddingBottom: 60 },
  manualSection: { width: '90%', marginTop: 10 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#DEE2E6', color: '#1A1A1A' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconInsideInput: { position: 'absolute', right: 15, padding: 5 },
  cameraMainButton: { backgroundColor: '#007AFF', width: '90%', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveLibraryButton: { backgroundColor: '#FF9500', width: '90%', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 15 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  themeContainer: { marginTop: 30, width: '100%' },
  themeLabel: { fontSize: 10, fontWeight: 'bold', color: '#ADB5BD', textAlign: 'center' },
  themeScrollContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 15 },
  themeButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', elevation: 2 },
  activeTheme: { borderWidth: 2, borderColor: '#007bffce' },
  checkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#007bffce' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: height * 0.7, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 12, marginBottom: 20 },
  searchBar: { flex: 1, padding: 12, fontSize: 14 },
  bookSelectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  bookIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E7F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  bookSelectTitle: { fontSize: 15, fontWeight: '700' },
  bookSelectAuthor: { fontSize: 13, color: '#6C757D' },
  emptyText: { textAlign: 'center', color: '#ADB5BD', marginTop: 50 }
});