import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, TextInput, ScrollView, Alert, Dimensions, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import QuoteCard from '../../components/QuoteCard';

const { width } = Dimensions.get('window');

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
  const [activeTab, setActiveTab] = useState('camera'); 
  const [quote, setQuote] = useState("Kitaptan bir alıntı taramak için kamerayı açın.");
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pageNumber, setPageNumber] = useState(""); // Yeni
  const [category, setCategory] = useState("");     // Yeni
  const [theme, setTheme] = useState('classic');
  const [loading, setLoading] = useState(false);

  const recognizeText = async (base64Image: string) => {
    try {
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpg;base64,${base64Image}`);
      formData.append('language', 'tur');
      formData.append('apikey', 'K81155988288957');
      formData.append('isOverlayRequired', 'false');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        let detectedText = result.ParsedResults[0].ParsedText;
        const cleanText = detectedText.replace(/\r?\n|\r/g, " ").trim();
        setQuote(cleanText);
        Alert.alert("Başarılı", "Metin başarıyla tarandı.");
      } else {
        Alert.alert("Hata", "Görüntüdeki metin okunamadı.");
      }
    } catch (error) {
      Alert.alert("Hata", "Bağlantı sorunu oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("İzin Gerekli", "Kamera erişimi onaylanmadı.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, 
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setLoading(true);
      recognizeText(result.assets[0].base64!);
    }
  };

const saveToLibrary = async () => {
  if (!quote || quote.length < 5 || quote.includes("taramak için kamerayı açın")) {
    Alert.alert("Uyarı", "Lütfen geçerli bir alıntı girin veya tarayın.");
    return;
  }

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

    const existingData = await AsyncStorage.getItem('litra_quotes');
    const currentList = existingData ? JSON.parse(existingData) : [];
    const updatedList = [newEntry, ...currentList];
    
    await AsyncStorage.setItem('litra_quotes', JSON.stringify(updatedList));

    // --- BURASI DEĞİŞTİ: KAYDETTİĞİ ANDA SIFIRLA ---
    setQuote("Kitaptan bir alıntı taramak için kamerayı açın.");
    setBookTitle("");
    setAuthor("");
    setPageNumber("");
    setCategory("");
    setTheme("classic");
    setActiveTab("camera"); // Sekmeyi de default fotoğraf çek moduna al

    Alert.alert("Kaydedildi!", "Alıntın kütüphanene eklendi. ✨", [
      { text: "Tamam" },
      { text: "Kitaplığa Git", onPress: () => router.push('/library') }
    ]);
  } catch (e) {
    Alert.alert("Hata", "Kaydedilirken teknik bir sorun oluştu.");
  }
};

  return (
    <SafeAreaView style={styles.container}>
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
  bookTitle={bookTitle}
  author={author}
  theme={theme} 
  placeholder={"..."}
  pageNumber={pageNumber} // Bunu ekle
  category={category}     // Bunu ekle
/>

        {activeTab === 'camera' ? (
          <View style={styles.actionSection}>
            <Text style={styles.infoText}>Kitap sayfasındaki cümleyi tara, Litra karta dönüştürsün.</Text>
            <TouchableOpacity style={styles.cameraMainButton} onPress={takePhoto} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Taramayı Başlat</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.manualSection}>
            <TextInput 
              style={[styles.input, { height: 100 }]} 
              multiline 
              placeholder="Alıntıyı buraya yazın..."
              placeholderTextColor="#666"
              value={quote}
              onChangeText={setQuote}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Kitap Adı" placeholderTextColor="#666" value={bookTitle} onChangeText={setBookTitle} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Yazar" placeholderTextColor="#666" value={author} onChangeText={setAuthor} />
            </View>

            {/* Yeni Bölüm: Sayfa No ve Kategori */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Sayfa No" 
                placeholderTextColor="#666" 
                keyboardType="numeric"
                value={pageNumber} 
                onChangeText={setPageNumber} 
              />
              <TextInput 
                style={[styles.input, { flex: 2 }]} 
                placeholder="Tür (Örn: Roman)" 
                placeholderTextColor="#666" 
                value={category} 
                onChangeText={setCategory} 
              />
            </View>
          </View>
        )}

        {!loading && (
          <TouchableOpacity style={styles.saveLibraryButton} onPress={saveToLibrary}>
            <Text style={styles.saveButtonText}>📌 Kitaplığıma Kaydet</Text>
          </TouchableOpacity>
        )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E9ECEF', margin: 15, borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
  tabText: { fontWeight: '600', color: '#6C757D' },
  activeTabText: { color: '#007AFF' },
  contentWrapper: { alignItems: 'center', paddingBottom: 60 },
  actionSection: { width: '90%', alignItems: 'center', marginTop: 10 },
  cameraMainButton: { backgroundColor: '#007AFF', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoText: { color: '#6C757D', marginBottom: 15, textAlign: 'center', fontSize: 13 },
  manualSection: { width: '90%', marginTop: 10 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#DEE2E6', color: '#1A1A1A' },
  saveLibraryButton: { backgroundColor: '#FF9500', width: '90%', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 15, elevation: 3 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  themeContainer: { marginTop: 30, width: '100%' },
  themeLabel: { fontSize: 10, fontWeight: 'bold', color: '#ADB5BD', letterSpacing: 1.5, marginBottom: 5, textAlign: 'center' },
  themeScrollContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 15 },
  themeButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activeTheme: { 
    borderWidth: 2,
    borderColor: '#007bffce',
    transform: [{ scale: 1.05 }] 
  },
  checkDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#007bffce' 
  }
});