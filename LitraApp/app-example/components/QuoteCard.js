import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const QuoteCard = ({ quote, bookTitle, author, theme = 'classic' }) => {
  // Temalara göre renk yönetimi
  const themes = {
    classic: { bg: '#FDFCF8', text: '#2C2C2C', accent: '#8E8E8E' },
    modern: { bg: '#1A1A1B', text: '#FFFFFF', accent: '#A0A0A0' },
    nature: { bg: '#E8F5E9', text: '#2E7D32', accent: '#66BB6A' }
  };

  const activeTheme = themes[theme];

  return (
    <View style={[styles.card, { backgroundColor: activeTheme.bg }]}>
      <Text style={styles.quoteMark}>“</Text>
      
      <Text style={[styles.quoteText, { color: activeTheme.text }]}>
        {quote || "Kitaptan taradığınız metin burada görünecek..."}
      </Text>

      <View style={styles.footer}>
        <View style={[styles.line, { backgroundColor: activeTheme.accent }]} />
        <Text style={[styles.bookInfo, { color: activeTheme.accent }]}>
          {bookTitle} — {author}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.9,
    padding: 30,
    borderRadius: 20,
    elevation: 10, // Android gölge
    shadowColor: '#000', // iOS gölge
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignSelf: 'center',
    marginVertical: 20,
  },
  quoteMark: {
    fontSize: 60,
    fontFamily: 'Georgia', // Serif font
    marginBottom: -20,
    opacity: 0.3,
  },
  quoteText: {
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    textAlign: 'left',
  },
  footer: {
    marginTop: 40,
  },
  line: {
    height: 1,
    width: 40,
    marginBottom: 10,
  },
  bookInfo: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default QuoteCard;