import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, TextInput, ScrollView, Alert, Dimensions, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import QuoteCard from '../../components/QuoteCard';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('camera'); 
  const [quote, setQuote] = useState("Kitaptan bir alıntı taramak için kamerayı açın.");
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [theme, setTheme] = useState('classic');
  const [loading, setLoading] = useState(false);

  // --- FONKSİYONLAR ---

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("İzin Gerekli", "Kamera erişimi olmadan tarama yapılamaz.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setLoading(true);
      // Simüle OCR: Buraya daha sonra gerçek bir API bağlayabilirsin.
      setTimeout(() => {
        setQuote("Okumak, özgürlüğe uçmaktır. Bu metin kameradan başarıyla tarandı.");
        setBookTitle("Örnek Kitap");
        setAuthor("Örnek Yazar");
        setLoading(false);
      }, 1500);
    }
  };

  const saveToLibrary = async () => {
    if (!quote || quote.length < 5) {
      Alert.alert("Uyarı", "Lütfen geçerli bir alıntı girin.");
      return;
    }

    try {
      const newEntry = {
        id: Date.now().toString(),
        quote,
        bookTitle: bookTitle || "Bilinmeyen Kitap",
        author: author || "Bilinmeyen Yazar",
        theme,
        date: new Date().toLocaleDateString('tr-TR'),
      };

      const existingData = await AsyncStorage.getItem('litra_quotes');
      const currentList = existingData ? JSON.parse(existingData) : [];
      const updatedList = [newEntry, ...currentList];
      
      await AsyncStorage.setItem('litra_quotes', JSON.stringify(updatedList));

      Alert.alert("Kaydedildi!", "Alıntın kütüphanene eklendi. ✨", [
        { text: "Yeni Ekle", onPress: () => { setQuote(""); setBookTitle(""); setAuthor(""); } },
        { text: "Kitaplığa Git", onPress: () => router.push('/library') }
      ]);
    } catch (e) {
      Alert.alert("Hata", "Kaydedilirken teknik bir sorun oluştu.");
    }
  };

  // --- ARAYÜZ ---

  return (
    <SafeAreaView style={styles.container}>
      {/* Sekme Seçici */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'camera' && styles.activeTab]} 
          onPress={() => setActiveTab('camera')}
        >
          <Text style={[styles.tabText, activeTab === 'camera' && styles.activeTabText]}>📷 Fotoğraf Çek</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'manual' && styles.activeTab]} 
          onPress={() => setActiveTab('manual')}
        >
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>✍️ Elle Gir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentWrapper} showsVerticalScrollIndicator={false}>
        
        <QuoteCard 
          quote={loading ? "Metin taranıyor..." : quote} 
          bookTitle={bookTitle}
          author={author}
          theme={theme} 
        />

        {activeTab === 'camera' ? (
          <View style={styles.actionSection}>
            <Text style={styles.infoText}>Kitap sayfasındaki o can alıcı cümleyi tara.</Text>
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
              value={quote}
              onChangeText={setQuote}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Kitap Adı"
                value={bookTitle}
                onChangeText={setBookTitle}
              />
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Yazar"
                value={author}
                onChangeText={setAuthor}
              />
            </View>
          </View>
        )}

        {/* ANA KAYDET BUTONU */}
        {!loading && (
          <TouchableOpacity style={styles.saveLibraryButton} onPress={saveToLibrary}>
            <Text style={styles.saveButtonText}>📌 Kitaplığıma Kaydet</Text>
          </TouchableOpacity>
        )}

        {/* Tema Seçici */}
        <View style={styles.themeContainer}>
          <Text style={styles.themeLabel}>GÖRÜNÜM STİLİ</Text>
          <View style={styles.themeButtons}>
            {['classic', 'modern', 'nature'].map((t) => (
              <TouchableOpacity 
                key={t}
                style={[
                  styles.themeButton, 
                  { backgroundColor: t === 'classic' ? '#FDFCF8' : t === 'modern' ? '#1A1A1B' : '#E8F5E9' }, 
                  theme === t && styles.activeTheme
                ]}
                onPress={() => setTheme(t)}
              />
            ))}
          </View>
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
  contentWrapper: { alignItems: 'center', paddingBottom: 40 },
  actionSection: { width: '90%', alignItems: 'center', marginTop: 10 },
  cameraMainButton: { backgroundColor: '#007AFF', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoText: { color: '#6C757D', marginBottom: 15, textAlign: 'center', fontSize: 13 },
  manualSection: { width: '90%', marginTop: 10 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#DEE2E6' },
  saveLibraryButton: { backgroundColor: '#FF9500', width: '90%', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 15, elevation: 3 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  themeContainer: { marginTop: 30, alignItems: 'center' },
  themeLabel: { fontSize: 10, fontWeight: 'bold', color: '#ADB5BD', letterSpacing: 1.5, marginBottom: 10 },
  themeButtons: { flexDirection: 'row', gap: 15 },
  themeButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#DEE2E6' },
  activeTheme: { borderColor: '#007AFF', borderWidth: 2.5 },
});