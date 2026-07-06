import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { NotificationData } from '@/lib/api';
import { useDeleteNotification, useMarkNotificationRead, useNotifications } from '@/lib/hooks/useNotifications';

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationRow({ item }: { item: NotificationData }) {
  const markRead = useMarkNotificationRead();
  const deleteNotification = useDeleteNotification();

  return (
    <Pressable
      onPress={() => !item.is_read && markRead.mutate(item.id)}
      className={`flex-row items-start gap-3 border-b border-gray-100 px-4 py-4 ${
        item.is_read ? 'bg-white' : 'bg-green-50'
      }`}
    >
      <View className={`mt-1.5 h-2 w-2 rounded-full ${item.is_read ? 'bg-transparent' : 'bg-primary'}`} />
      <View className="flex-1">
        <Text className="font-semibold text-gray-900">{item.title}</Text>
        <Text className="mt-0.5 text-sm text-gray-600">{item.message}</Text>
        <Text className="mt-1 text-xs text-gray-400">{timeAgo(item.created_at)}</Text>
      </View>
      <Pressable onPress={() => deleteNotification.mutate(item.id)} hitSlop={8}>
        <Ionicons name="close" size={18} color="#9CA3AF" />
      </Pressable>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const notifications = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
        <Text className="text-lg font-bold text-gray-900">Notifications</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006E3A" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="notifications-off-outline" size={40} color="#D1D5DB" />
          <Text className="mt-3 text-gray-400">No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <NotificationRow item={item} />}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeAreaView>
  );
}
