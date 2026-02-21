import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Expo ile hazır gelir

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#007AFF', // Aktif menü rengi (Apple Mavisi)
      tabBarStyle: { height: 60, paddingBottom: 10 },
      headerShown: true, // Sayfa başlıkları görünsün
    }}>
      <Tabs.Screen
        name="(tabs)/index"
        options={{
          title: 'Oluştur',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/library"
        options={{
          title: 'Kitaplığım',
          tabBarIcon: ({ color }) => <Ionicons name="book" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tabs)/settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}