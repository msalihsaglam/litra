import { useEffect, useState, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { NotificationProvider, useNotification } from '../context/NotificationContext';
import { runMigrations } from '../context/MigrationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NotificationCard from '../components/NotificationCard';

function TabsContent() {
  const { colors } = useTheme();
  const { startNotificationTimer, stopNotificationTimer, settings } = useNotification();
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [currentNotificationData, setCurrentNotificationData] = useState<any>(null);

  // Migration'ları başlangıçta çalıştır ve bildirimleri planla
  useEffect(() => {
    runMigrations();
    initializeNotifications();
  }, []);

  // Notification listener - Bildirim tıklanındığında modal aç
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      setCurrentNotificationData(data);
      setNotificationVisible(true);
    });

    return () => subscription.remove();
  }, []);

  const handleNotificationClose = useCallback(() => {
    setNotificationVisible(false);
  }, []);

  const initializeNotifications = async () => {
    try {
      // Bildirim izinleri talep et
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Bildirim izin durumu:', status);

      // Alıntıları yükle ve timer başlat
      const quotesData = await AsyncStorage.getItem('litra_quotes');
      if (quotesData) {
        const quotes = JSON.parse(quotesData);
        if (quotes.length > 0 && settings.enabled) {
          startNotificationTimer(quotes);
        }
      }
    } catch (e) {
      console.error('Notification başlatırken hata:', e);
    }
  };

  // Settings değişince timer'ı kontrol et
  useEffect(() => {
    if (settings.enabled) {
      // Alıntıları yükle ve timer başlat
      AsyncStorage.getItem('litra_quotes').then((quotesData) => {
        if (quotesData) {
          const quotes = JSON.parse(quotesData);
          if (quotes.length > 0) {
            startNotificationTimer(quotes);
          }
        }
      });
    } else {
      stopNotificationTimer();
    }

    return () => {
      // Cleanup
    };
  }, [settings.enabled, settings.frequency, settings.notificationHour, startNotificationTimer, stopNotificationTimer]);

  return (
    <>
      <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#007AFF', 
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 12,
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.borderColor,
        },
        headerShown: false, 
      }}>
        <Tabs.Screen
          name="(tabs)/index" 
          options={{
            title: 'Oluştur',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={28} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="(tabs)/my-library"
          options={{
            title: 'Kitaplığım',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "library" : "library-outline"} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="(tabs)/my-quotes"
          options={{
            title: 'Alıntılarım',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
            ),
          }}
        />

        {/* --- YENİ ANALİZ SEKMESİ --- */}
        <Tabs.Screen
          name="(tabs)/stats" 
          options={{
            title: 'Analiz',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="(tabs)/settings"
          options={{
            title: 'Ayarlar',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Notification Modal */}
      <NotificationCard
        visible={notificationVisible}
        quoteData={currentNotificationData}
        onClose={handleNotificationClose}
      />
    </>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <TabsContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}