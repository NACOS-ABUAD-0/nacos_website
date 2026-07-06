import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import QRCode from 'react-native-qrcode-svg';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { useEvent, useMyRegistration, useRegisterForEvent } from '@/lib/hooks/useEvents';

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = s.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const startTime = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${startTime} – ${endTime}`;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const { data: registration, isLoading: isLoadingRegistration } = useMyRegistration(id);
  const registerMutation = useRegisterForEvent(id);

  if (isLoading || !event) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#006E3A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom', 'left', 'right']}>
      <ScrollView>
        <View className="relative">
          {event.media.poster ? (
            <Image source={{ uri: event.media.poster }} style={{ width: '100%', height: 200 }} contentFit="cover" />
          ) : (
            <View className="h-20 bg-primary/10" />
          )}
          <Pressable
            onPress={() => router.back()}
            className="absolute left-4 top-4 h-9 w-9 items-center justify-center rounded-full bg-black/40"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>

        <View className="px-6 py-5">
          <Text className="text-xl font-bold text-gray-900">{event.title}</Text>

          <View className="mt-3 gap-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600">{formatRange(event.start_time, event.end_time)}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name={event.is_remote ? 'globe-outline' : 'location-outline'} size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600">{event.is_remote ? 'Remote event' : event.location}</Text>
            </View>
          </View>

          <Text className="mt-4 text-sm leading-6 text-gray-700">{event.description}</Text>

          {event.registration_url && (
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(event.registration_url!)}
              className="mt-5 flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 py-3"
            >
              <Ionicons name="open-outline" size={16} color="#374151" />
              <Text className="font-medium text-gray-700">Official Registration Page</Text>
            </Pressable>
          )}

          <View className="mt-6 border-t border-gray-100 pt-6">
            <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              In-App Check-in
            </Text>

            {isLoadingRegistration ? (
              <ActivityIndicator color="#006E3A" />
            ) : registration ? (
              <View className="items-center rounded-2xl border border-green-100 bg-green-50 p-6">
                <Text className="mb-4 text-sm font-medium text-green-800">
                  {registration.checked_in_at ? 'Checked in ✓' : 'Show this QR code at the door'}
                </Text>
                <QRCode value={registration.token} size={180} />
              </View>
            ) : event.status === 'completed' ? (
              <Text className="text-sm text-gray-400">Registration is closed — this event has ended.</Text>
            ) : (
              <PrimaryButton
                title={registerMutation.isPending ? 'Registering…' : 'Register for Check-in'}
                onPress={() => registerMutation.mutate()}
                loading={registerMutation.isPending}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
