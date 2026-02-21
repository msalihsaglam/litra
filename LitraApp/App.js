import { StyleSheet, View, SafeAreaView } from 'react-native';
import QuoteCard from './components/QuoteCard'; // Yazdığımız dosya

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <QuoteCard 
        quote="Hayat, biz başka planlar yaparken başımızdan geçenlerdir." 
        bookTitle="Bilinmeyen Bir Kadının Mektubu"
        author="Stefan Zweig"
        theme="classic" 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
});