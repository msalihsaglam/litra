import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput,
  Modal, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
  SafeAreaView, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

interface Book {
  id: string;
  title: string;
  author: string;
  image?: string; // base64 - optional
  status: 'okudum' | 'okuyacağım' | 'okuyorum';
  category?: string; // etiket/kategori
  dateAdded: string;
  dateCompleted?: string;
}

// Dinamik import: Native picker kullan, Expo Go'da fallback
let RNImageCropPicker: any = null;
try {
  RNImageCropPicker = require('react-native-image-crop-picker');
} catch (e) {
  // Expo Go ortamında modül mevcut değil
}

const USE_NATIVE_PICKER = RNImageCropPicker !== null;

export default function MyLibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(true);
  const isFocused = useIsFocused();

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    author: string;
    status: 'okudum' | 'okuyacağım' | 'okuyorum';
    category: string;
  }>({
    title: '',
    author: '',
    status: 'okuyacağım',
    category: '',
  });

  useEffect(() => {
    if (isFocused) loadBooks();
  }, [isFocused]);

  const loadBooks = async () => {
    try {
      const data = await AsyncStorage.getItem('litra_books');
      if (data) setBooks(JSON.parse(data));
      
      // Silme uyarısı göster/gizle ayarını yükle
      const showWarning = await AsyncStorage.getItem('show_delete_warning');
      setShowDeleteWarning(showWarning !== 'false');
    } catch (e) {
      console.error(e);
    }
  };

  const saveBooks = async (updatedBooks: Book[]) => {
    try {
      await AsyncStorage.setItem('litra_books', JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
    } catch (e) {
      console.error(e);
    }
  };

  const pickImage = async () => {
    try {
      if (USE_NATIVE_PICKER && RNImageCropPicker) {
        // Normal build: Gallery seçme
        RNImageCropPicker.openPicker({
          width: 300,
          height: 450,
          cropping: true,
          mediaType: 'photo',
          includeBase64: true,
        })
          .then((image: any) => {
            if (image && image.data) {
              setSelectedImage(image.data);
            }
          })
          .catch((e: any) => {
            if (e.code !== 'E_PICKER_CANCELLED') console.log(e);
          });
      } else {
        // Expo Go: expo-image-picker
        const permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('İzin Hatası', 'Galeri erişimi için izin gerekir.');
          return;
        }

        const result = await ExpoImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
          setSelectedImage(result.assets[0].base64);
        }
      }
    } catch (e) {
      Alert.alert('Hata', 'Resim seçilemedi.');
    }
  };

  const takePhoto = async () => {
    try {
      if (USE_NATIVE_PICKER && RNImageCropPicker) {
        // Normal build
        RNImageCropPicker.openCamera({
          width: 300,
          height: 450,
          cropping: true,
          mediaType: 'photo',
          includeBase64: true,
        })
          .then((image: any) => {
            if (image && image.data) {
              setSelectedImage(image.data);
            }
          })
          .catch((e: any) => {
            if (e.code !== 'E_PICKER_CANCELLED') console.log(e);
          });
      } else {
        // Expo Go
        const permission = await ExpoImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('İzin Hatası', 'Kamera erişimi için izin gerekir.');
          return;
        }

        const result = await ExpoImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
          setSelectedImage(result.assets[0].base64);
        }
      }
    } catch (e) {
      Alert.alert('Hata', 'Fotoğraf çekilemedi.');
    }
  };

  const addBook = async () => {
    if (!formData.title || !formData.author) {
      Alert.alert('Hata', 'Kitap adı ve yazar gerekli.');
      return;
    }

    const newBook: Book = {
      id: Date.now().toString(),
      title: formData.title,
      author: formData.author,
      image: selectedImage || undefined,
      status: formData.status,
      category: formData.category || undefined,
      dateAdded: new Date().toLocaleDateString('tr-TR'),
    };

    const updatedBooks = [newBook, ...books];
    await saveBooks(updatedBooks);

    // Reset form
    setFormData({ title: '', author: '', status: 'okuyacağım', category: '' });
    setSelectedImage(null);
    setIsModalVisible(false);
    Alert.alert('Başarılı', 'Kitap eklendi!');
  };

  const updateBookStatus = async (bookId: string, newStatus: 'okudum' | 'okuyacağım' | 'okuyorum') => {
    const updatedBooks = books.map(book => {
      if (book.id === bookId) {
        const updatedBook = { ...book, status: newStatus };
        // Okudum'a geçilirse tarihi kaydet
        if (newStatus === 'okudum' && !book.dateCompleted) {
          updatedBook.dateCompleted = new Date().toLocaleDateString('tr-TR');
        }
        // Okudum'dan başka bir statüye geçilirse tarihi sil
        if (newStatus !== 'okudum') {
          updatedBook.dateCompleted = undefined;
        }
        return updatedBook;
      }
      return book;
    });
    await saveBooks(updatedBooks);
  };

  const deleteBook = (bookId: string) => {
    const handleDelete = async () => {
      const updatedBooks = books.filter(b => b.id !== bookId);
      await saveBooks(updatedBooks);
    };

    if (showDeleteWarning) {
      Alert.alert(
        'Kitabı Sil',
        'Bu kitabı silmek istediğinizden emin misiniz?\n\n⚠️ Dikkkat: Bu kitapla ilgili tüm alıntılar ve analiz sonuçları da etkilenecektir.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Bir daha gösterme',
            style: 'default',
            onPress: async () => {
              await AsyncStorage.setItem('show_delete_warning', 'false');
              setShowDeleteWarning(false);
              await handleDelete();
            }
          },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: handleDelete
          }
        ]
      );
    } else {
      handleDelete();
    }
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setIsEditModalVisible(true);
  };

  const saveEditedBook = async () => {
    if (!editingBook || !editingBook.title || !editingBook.author) {
      Alert.alert('Hata', 'Kitap adı ve yazar gerekli.');
      return;
    }

    const updatedBooks = books.map(b =>
      b.id === editingBook.id ? editingBook : b
    );
    await saveBooks(updatedBooks);
    setIsEditModalVisible(false);
    Alert.alert('Başarılı', 'Kitap güncellendi!');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'okudum': return '✅ Okudum';
      case 'okuyacağım': return '📌 Okuyacağım';
      case 'okuyorum': return '📖 Okuyorum';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'okudum': return '#34C759';
      case 'okuyacağım': return '#FF9500';
      case 'okuyorum': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const renderBookCard = ({ item }: { item: Book }) => (
    <View style={styles.bookCard}>
      {item.image ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.image}` }}
          style={styles.bookImage}
        />
      ) : (
        <View style={[styles.bookImage, styles.placeholderImage]}>
          <Ionicons name="library" size={50} color="#FFF" />
        </View>
      )}

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
        {item.category && (
          <Text style={styles.bookCategory}>🏷️ {item.category}</Text>
        )}
        <Text style={styles.bookDate}>Eklendi: {item.dateAdded}</Text>
        {item.dateCompleted && (
          <Text style={styles.bookDateCompleted}>✅ Okudum: {item.dateCompleted}</Text>
        )}

        <View style={styles.statusButtonsContainer}>
          {(['okuyacağım', 'okuyorum', 'okudum'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                {
                  backgroundColor: item.status === status ? getStatusColor(status) : '#F1F3F5',
                  borderColor: getStatusColor(status),
                  borderWidth: 1.5,
                }
              ]}
              onPress={() => updateBookStatus(item.id, status)}
            >
              <Text style={[
                styles.statusButtonText,
                { color: item.status === status ? '#FFF' : getStatusColor(status) }
              ]}>
                {getStatusLabel(status).split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteBook(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const groupedBooks = {
    okudum: books.filter(b => b.status === 'okudum'),
    okuyorum: books.filter(b => b.status === 'okuyorum'),
    okuyacağım: books.filter(b => b.status === 'okuyacağım'),
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kitaplığım</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Okuyorum */}
        {groupedBooks.okuyorum.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 Okuyorum</Text>
            <FlatList
              data={groupedBooks.okuyorum}
              renderItem={renderBookCard}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Okuyacağım */}
        {groupedBooks.okuyacağım.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📌 Okuyacağım</Text>
            <FlatList
              data={groupedBooks.okuyacağım}
              renderItem={renderBookCard}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Okudum */}
        {groupedBooks.okudum.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Okudum</Text>
            <FlatList
              data={groupedBooks.okudum}
              renderItem={renderBookCard}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {books.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>Henüz kitap eklenmedi</Text>
            <Text style={styles.emptySubText}>Kitap eklemek için + düğmesine basın</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Book Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Kitap Ekle</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Section */}
                <View style={styles.imageSection}>
                  {selectedImage ? (
                    <>
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                        style={styles.selectedImage}
                      />
                      <TouchableOpacity
                        style={styles.changeImageButton}
                        onPress={() => setSelectedImage(null)}
                      >
                        <Text style={styles.changeImageText}>Resmi Değiştir</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="book" size={60} color="#1A1A1A" />
                      <Text style={styles.placeholderText}>Kitap Resmini Ekle (Opsiyonel)</Text>
                    </View>
                  )}
                </View>

                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.imageButton, styles.galleryButton]}
                    onPress={pickImage}
                  >
                    <Ionicons name="images-outline" size={20} color="#FFF" />
                    <Text style={styles.imageButtonText}>Galeriden Seç</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.imageButton, styles.cameraButton]}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera-outline" size={20} color="#FFF" />
                    <Text style={styles.imageButtonText}>Fotoğraf Çek</Text>
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <TextInput
                  style={styles.input}
                  placeholder="Kitap Adı"
                  placeholderTextColor="#999"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Yazar"
                  placeholderTextColor="#999"
                  value={formData.author}
                  onChangeText={(text) => setFormData({ ...formData, author: text })}
                />

                {/* Status Selection */}
                <Text style={styles.statusLabel}>Durum</Text>
                <View style={styles.statusSelectionContainer}>
                  {(['okuyacağım', 'okuyorum', 'okudum'] as const).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusSelectionButton,
                        formData.status === status && {
                          backgroundColor: getStatusColor(status),
                          borderColor: getStatusColor(status),
                        }
                      ]}
                      onPress={() => setFormData({ ...formData, status })}
                    >
                      <Text style={[
                        styles.statusSelectionText,
                        formData.status === status && { color: '#FFF', fontWeight: 'bold' }
                      ]}>
                        {getStatusLabel(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Category/Tag */}
                <Text style={styles.statusLabel}>Etiket / Kategori (Opsiyonel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Bilim Kurgu, Felsefe, Kişisel Gelişim..."
                  placeholderTextColor="#999"
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                />

                {/* Add Button */}
                <TouchableOpacity
                  style={styles.addBookButton}
                  onPress={addBook}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.addBookButtonText}>Kitabı Ekle</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Kitabı Düzenle</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  style={styles.input}
                  placeholder="Kitap Adı"
                  placeholderTextColor="#999"
                  value={editingBook?.title}
                  onChangeText={(text) => setEditingBook(prev => prev ? { ...prev, title: text } : null)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Yazar"
                  placeholderTextColor="#999"
                  value={editingBook?.author}
                  onChangeText={(text) => setEditingBook(prev => prev ? { ...prev, author: text } : null)}
                />

                <Text style={styles.statusLabel}>Etiket / Kategori (Opsiyonel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Bilim Kurgu, Felsefe..."
                  placeholderTextColor="#999"
                  value={editingBook?.category}
                  onChangeText={(text) => setEditingBook(prev => prev ? { ...prev, category: text } : null)}
                />

                <Text style={styles.statusLabel}>Durum</Text>
                <View style={styles.statusSelectionContainer}>
                  {(['okuyacağım', 'okuyorum', 'okudum'] as const).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusSelectionButton,
                        editingBook?.status === status && {
                          backgroundColor: getStatusColor(status),
                          borderColor: getStatusColor(status),
                        }
                      ]}
                      onPress={() => {
                        if (editingBook) {
                          const updated = { ...editingBook, status };
                          if (status === 'okudum' && !editingBook.dateCompleted) {
                            updated.dateCompleted = new Date().toLocaleDateString('tr-TR');
                          }
                          if (status !== 'okudum') {
                            updated.dateCompleted = undefined;
                          }
                          setEditingBook(updated);
                        }
                      }}
                    >
                      <Text style={[
                        styles.statusSelectionText,
                        editingBook?.status === status && { color: '#FFF', fontWeight: 'bold' }
                      ]}>
                        {getStatusLabel(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addBookButton}
                  onPress={saveEditedBook}
                >
                  <Text style={styles.addBookButtonText}>Değişiklikleri Kaydet</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bookImage: {
    width: 100,
    height: 140,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    backgroundColor: '#1A1A1A',
  },
  bookInfo: {
    flex: 1,
    padding: 12,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bookAuthor: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 4,
  },
  bookCategory: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 4,
    fontWeight: '600',
  },
  bookDate: {
    fontSize: 11,
    color: '#ADB5BD',
    marginTop: 4,
  },
  bookDateCompleted: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 3,
    fontWeight: '600',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: height * 0.85,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  imageSection: {
    marginBottom: 15,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 10,
    fontWeight: '600',
  },
  selectedImage: {
    width: 150,
    height: 220,
    borderRadius: 12,
    marginBottom: 10,
  },
  changeImageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  changeImageText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  galleryButton: {
    backgroundColor: '#34C759',
  },
  cameraButton: {
    backgroundColor: '#FF9500',
  },
  imageButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    color: '#1A1A1A',
    fontSize: 15,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  statusSelectionContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statusSelectionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  statusSelectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C757D',
  },
  addBookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  addBookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
