import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#007AFF', 
      tabBarInactiveTintColor: '#8E8E93',
      tabBarStyle: { 
        height: 65, 
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
      },
      headerShown: false, 
    }}>
      {/* Name kısımlarını klasör yapına göre (tabs)/index şeklinde güncelledim */}
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
        name="(tabs)/library"
        options={{
          title: 'Kitaplığım',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
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
  );
}