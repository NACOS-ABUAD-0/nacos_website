import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventData } from '@/lib/api';
import { useEvents } from '@/lib/hooks/useEvents';

const FILTERS: { label: string; value?: string }[] = [
  { label: 'All', value: undefined },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
];

const STATUS_STYLES: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function EventCard({ event }: { event: EventData }) {
  return (
    <Pressable
      onPress={() => router.push(`/events/${event.id}`)}
      className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      {event.media.poster ? (
        <Image source={{ uri: event.media.poster }} style={{ width: '100%', height: 140 }} contentFit="cover" />
      ) : null}
      <View className="p-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[event.status]}`}>
            {event.status}
          </Text>
          <Text className="text-xs text-gray-400">{formatDateTime(event.start_time)}</Text>
        </View>
        <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
          {event.title}
        </Text>
        <View className="mt-2 flex-row items-center gap-1">
          <Ionicons name={event.is_remote ? 'globe-outline' : 'location-outline'} size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-500">{event.is_remote ? 'Remote' : event.location}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function EventsScreen() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data, isLoading, refetch, isRefetching } = useEvents(filter ? { status: filter } : undefined);
  const events = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="border-b border-gray-100 bg-white px-4 py-3">
        <Text className="mb-3 text-xl font-bold text-gray-900">Events</Text>
        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <Pressable
              key={f.label}
              onPress={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 ${filter === f.value ? 'bg-primary' : 'bg-gray-100'}`}
            >
              <Text className={`text-xs font-medium ${filter === f.value ? 'text-white' : 'text-gray-600'}`}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerClassName="p-4"
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeAreaView>
  );
}
