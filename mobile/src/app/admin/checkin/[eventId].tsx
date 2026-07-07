import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { QRScannerView } from '@/components/qr-scanner';
import { useAuth } from '@/context/AuthContext';
import { adminAttendanceAPI } from '@/lib/api';
import { useEvent } from '@/lib/hooks/useEvents';

type Result = { kind: 'checked_in' | 'already_checked_in'; name: string } | { kind: 'invalid' } | null;

export default function AdminEventCheckinScreen() {
  const { isAdmin } = useAuth();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data: event } = useEvent(eventId);
  const [result, setResult] = useState<Result>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-gray-500">Admins only.</Text>
      </SafeAreaView>
    );
  }

  const handleScan = async (token: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await adminAttendanceAPI.checkInByToken(eventId, token);
      setResult({ kind: data.status, name: data.registration.user.full_name });
    } catch {
      setResult({ kind: 'invalid' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scanAnother = () => {
    setResult(null);
    setScannerKey((k) => k + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>
          {event?.title ?? 'Event Check-in'}
        </Text>
      </View>

      {result ? (
        <View className="flex-1 items-center justify-center px-6">
          {result.kind === 'checked_in' && (
            <>
              <Ionicons name="checkmark-circle" size={48} color="#006E3A" />
              <Text className="mt-4 text-center text-base text-gray-800">Checked in: {result.name}</Text>
            </>
          )}
          {result.kind === 'already_checked_in' && (
            <>
              <Ionicons name="information-circle" size={48} color="#F59E0B" />
              <Text className="mt-4 text-center text-base text-gray-800">Already checked in: {result.name}</Text>
            </>
          )}
          {result.kind === 'invalid' && (
            <>
              <Ionicons name="close-circle" size={48} color="#EF4444" />
              <Text className="mt-4 text-center text-base text-gray-800">
                No matching registration found for this event.
              </Text>
            </>
          )}
          <View className="mt-8 w-full">
            <PrimaryButton title="Scan Another" onPress={scanAnother} />
          </View>
        </View>
      ) : (
        <QRScannerView key={scannerKey} onScan={handleScan} />
      )}
    </SafeAreaView>
  );
}
