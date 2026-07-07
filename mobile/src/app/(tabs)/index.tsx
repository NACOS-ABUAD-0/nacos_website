import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/lib/hooks/useNotifications';

const QUICK_LINKS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/events' | '/resources' | '/projects' | '/assistant' | '/attendance-scan';
}[] = [
  { label: 'Events', icon: 'calendar', href: '/events' },
  { label: 'Resources', icon: 'document-text', href: '/resources' },
  { label: 'Projects', icon: 'rocket', href: '/projects' },
  { label: 'Assistant', icon: 'chatbubble-ellipses', href: '/assistant' },
  { label: 'Scan Attendance', icon: 'qr-code', href: '/attendance-scan' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { data } = useNotifications();
  const unreadCount = data?.results?.filter((n) => !n.is_read).length ?? 0;

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="px-6 py-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-gray-500">Welcome back,</Text>
            <Text className="text-2xl font-bold text-gray-900">{firstName}</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} className="relative p-2" hitSlop={8}>
            <Ionicons name="notifications-outline" size={26} color="#374151" />
            {unreadCount > 0 && (
              <View className="absolute right-1 top-1 h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1">
                <Text className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <Text className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-400">Quick Links</Text>
        <View className="flex-row flex-wrap gap-3">
          {QUICK_LINKS.map((link) => (
            <Pressable
              key={link.href}
              onPress={() => router.push(link.href)}
              className="w-[47%] items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons name={link.icon} size={24} color="#006E3A" />
              </View>
              <Text className="font-medium text-gray-800">{link.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
