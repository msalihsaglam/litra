import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Dimensions, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';

// 187. satırdaki hatayı çözen tanım:
const { width } = Dimensions.get('window');

const SOFT_COLORS = [
  '#E3F2FD', '#E8F5E9', '#FFF9C4', '#FFEBEE', 
  '#F3E5F5', '#FFF3E0', '#E8EAF6', '#FCE4EC'
];

export default function SettingsScreen() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryColors, setCategoryColors] = useState<{[key: string]: string}>({});
  const [showDeleteWarning, setShowDeleteWarning] = useState(true);
  const isFocused = useIsFocused();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { settings, updateSettings, startNotificationTimer } = useNotification();

  const APP_VERSION = "1.1.0";
  const DEVELOPER = "M. S. Sağlam";

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  const loadData = async () => {
    try {
      // Kitaplardan kategorileri yükle
      const booksData = await AsyncStorage.getItem('litra_books');
      if (booksData) {
        const books = JSON.parse(booksData);
        const uniqueCats = [...new Set(books.map((b: any) => b.category).filter(Boolean))] as string[];
        setCategories(uniqueCats);
      }
      const colorsData = await AsyncStorage.getItem('category_colors');
      if (colorsData) setCategoryColors(JSON.parse(colorsData));
      
      // Silme uyarı tercihini yükle
      const showWarning = await AsyncStorage.getItem('show_delete_warning');
      setShowDeleteWarning(showWarning !== 'false');
    } catch (e) { console.error(e); }
  };

  const updateColor = async (cat: string, color: string) => {
    const newColors = { ...categoryColors, [cat]: color };
    setCategoryColors(newColors);
    await AsyncStorage.setItem('category_colors', JSON.stringify(newColors));
  };

  const resetCategoryColor = async (cat: string) => {
    try {
      const newColors = { ...categoryColors };
      delete newColors[cat];
      setCategoryColors(newColors);
      await AsyncStorage.setItem('category_colors', JSON.stringify(newColors));
    } catch (e) { console.error(e); }
  };

  const getFrequencyLabel = (frequency: string): string => {
    switch (frequency) {
      case 'hourly': return 'Saatlik';
      case 'daily': return 'Günlük';
      case 'weekly': return 'Haftalık';
      default: return 'Günlük';
    }
  };

  const getTimeLabel = (hour: number): string => {
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const showFrequencyOptions = () => {
    Alert.alert(
      "Bildirim Sıklığını Seç",
      "Alıntıları ne sıklıkla almak istiyorsunuz?",
      [
        {
          text: "Saatlik",
          onPress: async () => {
            await updateSettings({ frequency: 'hourly' });
            Alert.alert("Başarılı", "Bildirimler saatlik olarak ayarlandı. (Her saat başında)");
          }
        },
        {
          text: "Günlük",
          onPress: async () => {
            await updateSettings({ frequency: 'daily' });
            Alert.alert("Başarılı", `Bildirimler günlük olarak ayarlandı. (Saat ${getTimeLabel(settings.notificationHour)}'de)`);
          }
        },
        {
          text: "Haftalık",
          onPress: async () => {
            await updateSettings({ frequency: 'weekly' });
            Alert.alert("Başarılı", `Bildirimler haftalık olarak ayarlandı. (Her hafta Saat ${getTimeLabel(settings.notificationHour)}'de)`);
          }
        },
        { text: "İptal", onPress: () => {} }
      ]
    );
  };

  const showTimeOptions = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const options = hours.map((hour) => ({
      text: getTimeLabel(hour),
      onPress: async () => {
        await updateSettings({ notificationHour: hour });
        Alert.alert("Başarılı", `Bildirim saati ${getTimeLabel(hour)}'e ayarlandı.`);
      }
    }));
    options.push({ text: "İptal", onPress: () => {} });

    Alert.alert("Bildirim Saatini Seç", "Alıntıları hangi saatte almak istiyorsunuz?", options);
  };

  const renderFooter = () => (
    <View style={[styles.footerContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.divider, { borderBottomColor: colors.borderColor }]} />
      <Text style={[styles.footerTitle, { color: colors.text }]}>Litra App</Text>
      <Text style={[styles.footerInfo, { color: colors.textSecondary }]}>Versiyon 1.1.0</Text>
      <Text style={[styles.footerInfo, { color: colors.textSecondary }]}>Developed by M. S. Sağlam</Text>
      <View style={styles.linkContainer}>
        <TouchableOpacity onPress={() => Alert.alert("Gizlilik Politikası", "Litra verilerinizi sadece cihazınızda saklar.")}>
          <Text style={[styles.linkText, { color: '#007AFF' }]}>Gizlilik Politikası</Text>
        </TouchableOpacity>
        <View style={[styles.dotSeparator, { borderLeftColor: colors.borderColor }]} />
        <TouchableOpacity onPress={() => Alert.alert("Öneri ve Destek", "mehmetsalihsaglam@gmail.com")}>
          <Text style={[styles.linkText, { color: '#007AFF' }]}>Destek</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.copyright, { color: colors.textSecondary }]}>© 2026 Tüm Hakları Saklıdır.</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ayarlar</Text>
        <Text style={[styles.headerSubTitle, { color: colors.textSecondary }]}>Görünüm ve etiket tercihlerini özelleştir</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* --- GÖRÜNÜM AYARLARI --- */}
            <View style={[styles.settingsSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>GÖRÜNÜM</Text>
              
              {/* Dark Mode Toggle */}
              <View style={[styles.settingRow, { borderBottomColor: colors.borderColor }]}>
                <View style={styles.settingInfo}>
                  <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={isDarkMode ? "#FFD700" : "#FF9500"} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Gece Modu</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{isDarkMode ? "Açık" : "Kapalı"}</Text>
                  </View>
                </View>
                <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
              </View>

              {/* Reset Delete Warning */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="warning-outline" size={22} color="#FF3B30" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Silme Uyarısı</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Tekrar göster</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    await AsyncStorage.setItem('show_delete_warning', 'true');
                    setShowDeleteWarning(true);
                    Alert.alert("Başarılı", "Silme uyarısı tekrar gösterilecek.");
                  }}
                >
                  <Ionicons name="refresh" size={22} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* --- BİLDİRİM AYARLARI --- */}
            <View style={[styles.settingsSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>BİLDİRİMLER</Text>
              
              {/* Notification Enable/Disable */}
              <View style={[styles.settingRow, { borderBottomColor: colors.borderColor }]}>
                <View style={styles.settingInfo}>
                  <Ionicons name={settings.enabled ? "notifications" : "notifications-off-outline"} size={22} color="#FF9500" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Alıntı Bildirimleri</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Rastgele alıntılar gönder</Text>
                  </View>
                </View>
                <Switch
                  value={settings.enabled}
                  onValueChange={async (value) => {
                    await updateSettings({ enabled: value });
                    if (value) {
                      const quotesData = await AsyncStorage.getItem('litra_quotes');
                      if (quotesData) {
                        const quotes = JSON.parse(quotesData);
                        if (quotes.length > 0) {
                          Alert.alert("Başarılı", "Bildirimler etkinleştirildi.");
                        } else {
                          Alert.alert("Bilgi", "Bildirim göndermek için en az bir alıntı eklemeniz gerekir.");
                        }
                      }
                    } else {
                      Alert.alert("Başarılı", "Bildirimler devre dışı bırakıldı.");
                    }
                  }}
                />
              </View>

              {/* Notification Frequency */}
              {settings.enabled && (
                <>
                  <View style={[styles.settingRow, { borderBottomColor: colors.borderColor }]}>
                    <View style={styles.settingInfo}>
                      <Ionicons name="time-outline" size={22} color="#34C759" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Bildirim Sıklığı</Text>
                        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{getFrequencyLabel(settings.frequency)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => showFrequencyOptions()}
                      style={{ paddingLeft: 10 }}
                    >
                      <Ionicons name="chevron-forward" size={22} color="#007AFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Notification Time - Saatlik haricinde göster */}
                  {settings.frequency !== 'hourly' && (
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Ionicons name="alarm-outline" size={22} color="#34C759" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={[styles.settingLabel, { color: colors.text }]}>Bildirim Saati</Text>
                          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{getTimeLabel(settings.notificationHour)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => showTimeOptions()}
                        style={{ paddingLeft: 10 }}
                      >
                        <Ionicons name="chevron-forward" size={22} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* --- ETİKET RENK AYARLARI --- */}
            <View style={[styles.settingsSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ETİKET RENKLERİ</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.catRow, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
            <View style={styles.catInfo}>
              <View style={styles.catTitleWrapper}>
                <Text style={[styles.catName, { color: colors.text }]}>#{item}</Text>
                <View style={[styles.previewDot, { backgroundColor: categoryColors[item] || '#DDD' }]} />
              </View>
              <TouchableOpacity onPress={() => resetCategoryColor(item)} style={styles.deleteArea}>
                <Ionicons name="refresh-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScroll}>
              {SOFT_COLORS.map((color) => {
                const isSelected = categoryColors[item] === color;
                return (
                  <TouchableOpacity key={color} onPress={() => updateColor(item, color)} style={styles.colorWrapper}>
                    <View style={[styles.outerCircle, isSelected && styles.activeOuterCircle]}>
                      <View style={[styles.colorCircle, { backgroundColor: color }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Henüz etiketlenmiş bir kitap yok.</Text>
          </View>
        }
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
  headerSubTitle: { fontSize: 14, color: '#6C757D', fontWeight: '500' },
  listContent: { paddingBottom: 40 },
  
  // Görünüm Ayarları Stilleri
  settingsSection: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, backgroundColor: '#FFF', elevation: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 12, color: '#6C757D' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  settingDescription: { fontSize: 13, color: '#6C757D', marginTop: 2 },
  categoriesHeader: { marginHorizontal: 20, marginBottom: 15, marginTop: 10 },
  
  // Etiket Renk Stilleri
  catRow: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 16, elevation: 1, borderBottomWidth: 1 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  catTitleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catName: { fontSize: 15, fontWeight: '700' },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  deleteArea: { padding: 4 },
  colorScroll: { paddingRight: 10 },
  colorWrapper: { marginRight: 12 },
  outerCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  activeOuterCircle: { borderColor: '#007AFF' },
  colorCircle: { width: 28, height: 28, borderRadius: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { textAlign: 'center', color: '#ADB5BD' },
  footerContainer: { marginTop: 20, alignItems: 'center', paddingBottom: 30 },
  divider: { width: width * 0.8, height: 1, backgroundColor: '#E9ECEF', marginBottom: 25, borderBottomWidth: 1 },
  footerTitle: { fontSize: 18, fontWeight: '800', color: '#ADB5BD' },
  footerInfo: { fontSize: 12, color: '#ADB5BD' },
  linkContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  linkText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ADB5BD', marginHorizontal: 10, borderLeftWidth: 1 },
  copyright: { fontSize: 10, color: '#CED4DA', marginTop: 20 }
});