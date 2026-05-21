import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { QuoteItem } from './MigrationContext';

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  notificationHour: number; // 0-23 (günlük/haftalık için tercih saati)
  theme: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  frequency: 'daily',
  notificationHour: 8, // Sabah 08:00
  theme: 'classic',
};

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  sendQuoteNotification: (quotes: QuoteItem[]) => Promise<void>;
  startNotificationTimer: (quotes: QuoteItem[]) => void;
  stopNotificationTimer: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Bildirim davranışını ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let notificationTimer: NodeJS.Timeout | null = null;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [lastNotificationTime, setLastNotificationTime] = useState<{
    hour?: number;
    day?: string;
    week?: number;
  }>({});

  // Ayarları yükle
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('litra_notification_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }

      const lastTime = await AsyncStorage.getItem('litra_last_notification_time');
      if (lastTime) {
        setLastNotificationTime(JSON.parse(lastTime));
      }
    } catch (e) {
      console.error('Notification ayarları yüklenirken hata:', e);
    }
  };

  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      try {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        await AsyncStorage.setItem('litra_notification_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Notification ayarları kaydedilirken hata:', e);
      }
    },
    [settings]
  );

  // Rastgele alıntı seç
  const getRandomQuote = (quotes: QuoteItem[]): QuoteItem | null => {
    if (quotes.length === 0) return null;
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  // Bildirim gösterilmesi gerekip gerekmediğini kontrol et
  const shouldSendNotification = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toISOString().split('T')[0];
    const weekNumber = Math.floor((now.getDate() - now.getDay() - 1) / 7) + 1;

    switch (settings.frequency) {
      case 'hourly':
        return lastNotificationTime.hour !== currentHour;

      case 'daily':
        if (currentHour === settings.notificationHour) {
          return lastNotificationTime.day !== currentDay;
        }
        return false;

      case 'weekly':
        if (currentHour === settings.notificationHour) {
          return lastNotificationTime.week !== weekNumber;
        }
        return false;

      default:
        return false;
    }
  }, [settings.frequency, settings.notificationHour, lastNotificationTime]);

  // Bildirim gönder ve zamanı kaydet
  const sendQuoteNotification = useCallback(
    async (quotes: QuoteItem[]) => {
      try {
        if (!settings.enabled || quotes.length === 0) {
          return;
        }

        if (!shouldSendNotification()) {
          return;
        }

        const randomQuote = getRandomQuote(quotes);
        if (!randomQuote) return;

        const title = randomQuote.bookTitle;
        const body = `"${randomQuote.quote.substring(0, 100)}${randomQuote.quote.length > 100 ? '...' : ''}"`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: {
              quoteId: randomQuote.id,
              quote: randomQuote.quote,
              bookTitle: randomQuote.bookTitle,
              author: randomQuote.author,
              theme: settings.theme,
              category: randomQuote.category,
              pageNumber: randomQuote.pageNumber,
            },
          },
          trigger: { seconds: 2 },
        });

        // Son bildirim zamanını kaydet
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.toISOString().split('T')[0];
        const weekNumber = Math.floor((now.getDate() - now.getDay() - 1) / 7) + 1;

        const newTime = {
          ...lastNotificationTime,
          ...(settings.frequency === 'hourly' && { hour: currentHour }),
          ...(settings.frequency === 'daily' && { day: currentDay }),
          ...(settings.frequency === 'weekly' && { week: weekNumber }),
        };

        setLastNotificationTime(newTime);
        await AsyncStorage.setItem('litra_last_notification_time', JSON.stringify(newTime));

        console.log(`✅ Bildirim gönderildi (${settings.frequency})`);
      } catch (e) {
        console.error('Bildirim gönderilirken hata:', e);
      }
    },
    [settings, shouldSendNotification, lastNotificationTime]
  );

  // Timer başlat - Dakika başında kontrol et
  const startNotificationTimer = useCallback(
    (quotes: QuoteItem[]) => {
      if (notificationTimer) {
        clearInterval(notificationTimer);
      }

      sendQuoteNotification(quotes);

      notificationTimer = setInterval(() => {
        sendQuoteNotification(quotes);
      }, 60000);

      console.log('✅ Bildirim timer başlatıldı');
    },
    [sendQuoteNotification]
  );

  // Timer durdur
  const stopNotificationTimer = useCallback(() => {
    if (notificationTimer) {
      clearInterval(notificationTimer);
      notificationTimer = null;
      console.log('⏹️ Bildirim timer durduruldu');
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (notificationTimer) {
        clearInterval(notificationTimer);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        settings,
        updateSettings,
        sendQuoteNotification,
        startNotificationTimer,
        stopNotificationTimer,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
