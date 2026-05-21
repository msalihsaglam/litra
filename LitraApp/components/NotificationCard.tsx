import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import QuoteCard from './QuoteCard';

const { width, height } = Dimensions.get('window');

interface NotificationQuoteData {
  quoteId: string;
  quote: string;
  bookTitle: string;
  author: string;
  theme: string;
  category?: string;
  pageNumber?: string;
}

interface NotificationCardProps {
  visible: boolean;
  quoteData: NotificationQuoteData | null;
  onClose: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ visible, quoteData, onClose }) => {
  const insets = useSafeAreaInsets();
  if (!quoteData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={24} color="#FF9500" />
            <Text style={styles.headerTitle}>Alıntı Bildirimi</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Quote Card */}
          <View style={styles.cardContainer}>
            <QuoteCard
              quote={quoteData.quote}
              bookTitle={quoteData.bookTitle}
              author={quoteData.author}
              theme={quoteData.theme}
              category={quoteData.category}
              pageNumber={quoteData.pageNumber}
            />
          </View>

          {/* Quote Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="book-outline" size={18} color="#007AFF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Kitap</Text>
                <Text style={styles.detailValue}>{quoteData.bookTitle}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={18} color="#007AFF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Yazar</Text>
                <Text style={styles.detailValue}>{quoteData.author}</Text>
              </View>
            </View>

            {quoteData.category && (
              <View style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={18} color="#007AFF" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Kategori</Text>
                  <Text style={styles.detailValue}>#{quoteData.category}</Text>
                </View>
              </View>
            )}

            {quoteData.pageNumber && (
              <View style={styles.detailRow}>
                <Ionicons name="document-outline" size={18} color="#007AFF" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Sayfa</Text>
                  <Text style={styles.detailValue}>{quoteData.pageNumber}</Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Kapat</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailsSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C757D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default NotificationCard;
