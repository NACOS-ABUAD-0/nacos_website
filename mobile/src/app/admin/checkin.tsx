import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { EventData } from '@/lib/api';
import { useEvents } from '@/lib/hooks/useEvents';

function EventRow({ item }: { item: EventData }) {
  return (
    <Pressable
      onPress={() => router.push(`/admin/checkin/${item.id}`)}
      className="mb-3 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <View className="flex-1 pr-2">
        <Text className="font-semibold text-gray-900" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-400">{item.status}</Text>
      </View>
      <Ionicons name="qr-code-outline" size={20} color="#006E3A" />
    </Pressable>
  );
}

export default function AdminCheckinPickerScreen() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useEvents();
  const events = data?.results ?? [];

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-gray-500">Admins only.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Event Check-in</Text>
      </View>
      <Text className="px-4 py-3 text-sm text-gray-500">Pick an event to scan attendee QR codes for.</Text>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006E3A" />
        </View>
      ) : events.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
          <Text className="mt-3 text-gray-400">No events found</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <EventRow item={item} />}
          contentContainerClassName="p-4"
        />
      )}
    </SafeAreaView>
  );
}
