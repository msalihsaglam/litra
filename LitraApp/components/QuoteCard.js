import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const QuoteCard = ({ quote, bookTitle, author, theme = 'classic', placeholder, pageNumber, category }) => {
  // Tema tanımlamaları
  const themes = {
    classic: { bg: '#FDFCF8', text: '#2C2C2C', accent: '#8E8E8E' },
    modern: { bg: '#1A1A1B', text: '#FFFFFF', accent: '#A0A0A0' },
    nature: { bg: '#E8F5E9', text: '#2E7D32', accent: '#66BB6A' },
    vintage: { bg: '#F4ECD8', text: '#5D4037', accent: '#8D6E63' },
    midnight: { bg: '#0D1B2A', text: '#E0E1DD', accent: '#778DA9' },
    rose: { bg: '#FCE4EC', text: '#880E4F', accent: '#F06292' },
    ocean: { bg: '#E0F2F1', text: '#00695C', accent: '#4DB6AC' }
  };

  const activeTheme = themes[theme] || themes.classic;

  // Başlangıç metni veya boşluk kontrolü
  const isDefaultText = quote === "Kitaptan bir alıntı taramak için kamerayı açın." || !quote;
  const displayQuote = isDefaultText ? placeholder : quote;

  return (
    <View style={[styles.card, { backgroundColor: activeTheme.bg }]}>
      {/* Üst Kısım: Kategori/Tür Etiketi */}
      {category ? (
        <View style={[styles.badge, { backgroundColor: theme === 'modern' || theme === 'midnight' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.badgeText, { color: activeTheme.accent }]}># {category}</Text>
        </View>
      ) : null}

      <Text style={[styles.quoteMark, { color: activeTheme.text, opacity: 0.1 }]}>“</Text>
      
      <Text style={[styles.quoteText, { color: activeTheme.text }]}>
        {displayQuote}
      </Text>

      <View style={styles.footer}>
        <View style={[styles.line, { backgroundColor: activeTheme.accent }]} />
        <View>
          <Text style={[styles.bookInfo, { color: activeTheme.accent }]}>
            {bookTitle || "Kitap Adı"} — {author || "Yazar"}
          </Text>
          {pageNumber ? (
            <Text style={[styles.pageInfo, { color: activeTheme.accent }]}>
              Sayfa: {pageNumber}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.9,
    padding: 30,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    alignSelf: 'center',
    marginVertical: 10,
    minHeight: 260,
    justifyContent: 'center'
  },
  badge: {
    position: 'absolute',
    top: 20,
    right: 25,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteMark: {
    fontSize: 80,
    position: 'absolute',
    top: 10,
    left: 20,
    fontFamily: 'serif',
  },
  quoteText: {
    fontSize: 20,
    lineHeight: 32,
    fontStyle: 'italic',
    textAlign: 'left',
    zIndex: 1,
    marginTop: 10,
  },
  footer: {
    marginTop: 25,
  },
  line: {
    height: 1.5,
    width: 40,
    marginBottom: 8,
    borderRadius: 2
  },
  bookInfo: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pageInfo: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8
  }
});

export default QuoteCard;