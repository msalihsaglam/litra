import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuoteItem {
  id: string;
  quote: string;
  bookTitle: string;
  author: string;
  theme: string;
  pageNumber?: string;
  category?: string;
  bookId?: string; // NEW: kitap referansı
  migrationVersion?: number;
  date?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  image?: string;
  status: 'okudum' | 'okuyacağım' | 'okuyorum';
  category?: string;
  dateAdded: string;
  dateCompleted?: string;
}

const MIGRATION_VERSION = 1;
const LAST_MIGRATION_KEY = 'litra_last_migration_version';

/**
 * Mevcut alıntıları güncelle - kitap ID'leri ekle
 */
async function migrateQuotesV1(): Promise<void> {
  try {
    const quotesData = await AsyncStorage.getItem('litra_quotes');
    const booksData = await AsyncStorage.getItem('litra_books');

    if (!quotesData || !booksData) return;

    const quotes: QuoteItem[] = JSON.parse(quotesData);
    const books: Book[] = JSON.parse(booksData);

    // Kitapları title+author ile indeksle
    const bookIndex = new Map<string, Book>();
    books.forEach(book => {
      const key = `${book.title.toLowerCase().trim()}|${book.author.toLowerCase().trim()}`;
      bookIndex.set(key, book);
    });

    // Alıntıları güncelle
    let migratedCount = 0;
    const updatedQuotes = quotes.map(quote => {
      // Zaten migre edilmişse atla
      if (quote.migrationVersion === MIGRATION_VERSION && quote.bookId) {
        return quote;
      }

      // Kitabı ara
      const key = `${quote.bookTitle.toLowerCase().trim()}|${quote.author.toLowerCase().trim()}`;
      const matchedBook = bookIndex.get(key);

      const updatedQuote: QuoteItem = {
        ...quote,
        bookId: matchedBook?.id,
        migrationVersion: MIGRATION_VERSION,
      };

      if (matchedBook) migratedCount++;
      return updatedQuote;
    });

    // Güncellenmiş alıntıları kaydet
    await AsyncStorage.setItem('litra_quotes', JSON.stringify(updatedQuotes));
    console.log(`✅ Migration V1: ${migratedCount}/${quotes.length} alıntı kitap ID'si ile eşleştirildi`);

  } catch (error) {
    console.error('❌ Migration V1 hatası:', error);
  }
}

/**
 * Tüm migration'ları sırasıyla çalıştır
 */
export async function runMigrations(): Promise<void> {
  try {
    const lastMigration = await AsyncStorage.getItem(LAST_MIGRATION_KEY);
    const lastVersion = lastMigration ? parseInt(lastMigration) : 0;

    if (lastVersion < 1) {
      console.log('🔄 Migration V1 başlıyor...');
      await migrateQuotesV1();
    }

    // Başarılı olduysa versiyon kaydet
    await AsyncStorage.setItem(LAST_MIGRATION_KEY, MIGRATION_VERSION.toString());
    console.log(`✅ Tüm migration'lar tamamlandı. Versiyon: ${MIGRATION_VERSION}`);

  } catch (error) {
    console.error('❌ Migration çalıştırılırken hata:', error);
  }
}

/**
 * Kitap silindiğinde ilgili alıntıları işaretle
 */
export async function markQuotesOrphanedAfterBookDelete(bookId: string): Promise<void> {
  try {
    const quotesData = await AsyncStorage.getItem('litra_quotes');
    if (!quotesData) return;

    const quotes: QuoteItem[] = JSON.parse(quotesData);
    const updated = quotes.map(q => 
      q.bookId === bookId ? { ...q, bookId: undefined } : q
    );

    await AsyncStorage.setItem('litra_quotes', JSON.stringify(updated));
    console.log(`⚠️ Kitap ${bookId} silinendi - ${quotes.filter(q => q.bookId === bookId).length} alıntı öksüz bırakıldı`);
  } catch (error) {
    console.error('❌ Alıntı işaretleme hatası:', error);
  }
}

/**
 * Kitap adı/yazar değiştiğinde alıntıları güncelle
 */
export async function updateQuotesAfterBookEdit(
  bookId: string,
  newTitle: string,
  newAuthor: string
): Promise<void> {
  try {
    const quotesData = await AsyncStorage.getItem('litra_quotes');
    if (!quotesData) return;

    const quotes: QuoteItem[] = JSON.parse(quotesData);
    const updated = quotes.map(q => 
      q.bookId === bookId 
        ? { ...q, bookTitle: newTitle, author: newAuthor }
        : q
    );

    await AsyncStorage.setItem('litra_quotes', JSON.stringify(updated));
    console.log(`✅ ${quotes.filter(q => q.bookId === bookId).length} alıntı güncellendi`);
  } catch (error) {
    console.error('❌ Alıntı güncelleme hatası:', error);
  }
}

/**
 * Kitapla ilgili tüm alıntıları getir
 */
export async function getQuotesByBookId(bookId: string): Promise<QuoteItem[]> {
  try {
    const quotesData = await AsyncStorage.getItem('litra_quotes');
    if (!quotesData) return [];

    const quotes: QuoteItem[] = JSON.parse(quotesData);
    return quotes.filter(q => q.bookId === bookId);
  } catch (error) {
    console.error('❌ Kitap alıntıları getirme hatası:', error);
    return [];
  }
}
