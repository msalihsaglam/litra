import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const ASPECT_RATIO = STORY_HEIGHT / STORY_WIDTH;

interface StoryGeneratorProps {
  quote: string;
  bookTitle: string;
  author: string;
  theme: string;
  category?: string;
  bookImageUri?: string;
  onClose: () => void;
}

const StoryGenerator: React.FC<StoryGeneratorProps> = ({
  quote,
  bookTitle,
  author,
  theme,
  category,
  bookImageUri,
  onClose,
}) => {
  const viewShotRef = useRef<ViewShot>(null);

  // Tema renklerini al
  const getThemeColors = () => {
    const themes: { [key: string]: { bg: string; text: string; accent: string; gradient1: string; gradient2: string } } = {
      classic: { bg: '#FDFCF8', text: '#FFFFFF', accent: '#8E8E8E', gradient1: '#F5E6D3', gradient2: '#D4A574' },
      modern: { bg: '#1A1A1B', text: '#FFFFFF', accent: '#A0A0A0', gradient1: '#2D2D2D', gradient2: '#1A1A1B' },
      nature: { bg: '#E8F5E9', text: '#FFFFFF', accent: '#66BB6A', gradient1: '#4CAF50', gradient2: '#2E7D32' },
      vintage: { bg: '#F4ECD8', text: '#FFFFFF', accent: '#8D6E63', gradient1: '#A1887F', gradient2: '#6D4C41' },
      midnight: { bg: '#0D1B2A', text: '#FFFFFF', accent: '#778DA9', gradient1: '#1A3A52', gradient2: '#0D1B2A' },
      rose: { bg: '#FCE4EC', text: '#FFFFFF', accent: '#F06292', gradient1: '#EC407A', gradient2: '#AD1457' },
      ocean: { bg: '#E0F2F1', text: '#FFFFFF', accent: '#4DB6AC', gradient1: '#00897B', gradient2: '#26A69A' },
    };
    return themes[theme] || themes.classic;
  };

  const themeColors = getThemeColors();
  const containerHeight = width * ASPECT_RATIO;

  const captureAndSave = async () => {
    try {
      // Önce izinleri iste
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log('[Story] MediaLibrary permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Hata', 'Galeriye erişim izni gerekli');
        return;
      }

      if (viewShotRef.current) {
        console.log('[Story] Starting capture...');
        const uri = await viewShotRef.current.capture();
        console.log('[Story] Capture successful, URI:', uri);

        try {
          console.log('[Story] Saving to library...');
          await MediaLibrary.saveToLibraryAsync(uri);
          console.log('[Story] Successfully saved to library');

          Alert.alert('Başarılı', 'Story galerinize kaydedildi! ✨');
          onClose();
        } catch (assetError) {
          console.error('[Story] Full error object:', assetError);
          console.error('[Story] Asset creation error:', assetError);
          Alert.alert('Hata', 'Story kaydedilemedi');
        }
      }
    } catch (error) {
      console.error('[Story] Capture error:', error);
      Alert.alert('Hata', 'Story kaydedilirken hata');
    }
  };

  return (
    <View style={styles.container}>
      {/* Önizleme */}
      <View style={[styles.previewContainer, { height: containerHeight }]}>
        <ViewShot
          ref={viewShotRef}
          options={{
            format: 'png',
            quality: 0.8,
            width: STORY_WIDTH,
            height: STORY_HEIGHT,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Dinamik Arka Plan */}
          <LinearGradient
            colors={[themeColors.gradient1, themeColors.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyBackground}
          >
            {bookImageUri && (
              <>
                <Image
                  source={{ uri: bookImageUri }}
                  style={styles.backgroundImage}
                  contentFit="cover"
                />
                <View style={styles.overlayFilter} />
              </>
            )}

            {/* Siber-Zen Neon Kartı */}
            <View style={styles.storyContent}>
              {/* Glassmorphism Kart */}
              <View
                style={[
                  styles.glassCard,
                  {
                    borderColor: themeColors.accent,
                  },
                ]}
              >
                {/* Dekoratif Top Eleman */}
                <View style={[styles.topDecor, { backgroundColor: themeColors.accent }]} />

                {/* Alıntı Metni */}
                <Text style={[styles.quoteText, { color: themeColors.text }]}>
                  "{quote}"
                </Text>

                {/* Kitap Bilgisi */}
                <View style={styles.bookInfo}>
                  <Text style={[styles.bookTitle, { color: themeColors.text }]}>
                    {bookTitle}
                  </Text>
                  <Text style={[styles.author, { color: themeColors.accent }]}>
                    — {author}
                  </Text>
                  {category && (
                    <Text
                      style={[
                        styles.category,
                        { color: themeColors.accent },
                      ]}
                    >
                      #{category}
                    </Text>
                  )}
                </View>

                {/* Dekoratif Bottom Eleman */}
                <View style={[styles.bottomDecor, { backgroundColor: themeColors.accent }]} />
              </View>
            </View>

            {/* Watermark */}
            <View style={styles.watermark}>
              <Ionicons name="sparkles" size={12} color={themeColors.accent} />
              <Text style={[styles.watermarkText, { color: themeColors.text }]}>Litra</Text>
            </View>
          </LinearGradient>
        </ViewShot>
      </View>

      {/* Butonlar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#007AFF" />
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={captureAndSave}
        >
          <Ionicons name="download" size={24} color="#FFF" />
          <Text style={styles.saveButtonText}>Galeriye Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  previewContainer: {
    aspectRatio: 9 / 16,
    marginHorizontal: 'auto',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    alignSelf: 'center',
  },
  storyBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlayFilter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  glassCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.15,
    elevation: 8,
  },
  topDecor: {
    width: 3,
    height: 20,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.6,
  },
  quoteText: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 28,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  bookInfo: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 20,
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  bottomDecor: {
    width: 3,
    height: 20,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 20,
    opacity: 0.6,
  },
  watermark: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  watermarkText: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    gap: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default StoryGenerator;
