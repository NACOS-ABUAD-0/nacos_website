import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventSalesPanel, type TicketTypeFilter } from '@/components/event-sales-panel';
import { PrimaryButton } from '@/components/primary-button';
import { QRScannerView } from '@/components/qr-scanner';
import { useAuth } from '@/context/AuthContext';
import { adminAttendanceAPI, type AdminCheckInError, type AdminCheckInRegistration } from '@/lib/api';
import { useEvent, useEventSales } from '@/lib/hooks/useEvents';

type Result =
  | { kind: 'checked_in' | 'already_checked_in'; registration: AdminCheckInRegistration }
  | { kind: 'failed'; title: string; reason: string; registration?: AdminCheckInRegistration };

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function scanFailure(error: unknown): Result {
  const response = (error as { response?: { status?: number; data?: AdminCheckInError } })?.response;
  const data = response?.data;
  if (data?.status === 'not_paid') {
    return { kind: 'failed', title: 'Not paid', reason: "This ticket's payment hasn't gone through, so it can't be used yet.", registration: data.registration };
  }
  if (data?.status === 'cancelled') {
    return { kind: 'failed', title: 'Ticket cancelled', reason: data.detail ?? "This ticket was refunded, so it can't be used.", registration: data.registration };
  }
  if (data?.status === 'wrong_event') return { kind: 'failed', title: 'Wrong event', reason: data.detail ?? 'This ticket is for a different event.' };
  if (response?.status === 404) return { kind: 'failed', title: 'Invalid ticket', reason: data?.detail ?? "This QR code isn't a valid ticket for this event." };
  if (!response) return { kind: 'failed', title: 'No connection', reason: "Couldn't reach the server. Check the internet connection and scan again." };
  return { kind: 'failed', title: 'Check-in failed', reason: data?.detail ?? 'Something went wrong. Please scan again.' };
}

export default function AdminEventCheckinScreen() {
  const { canManageEvents } = useAuth();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const { data: event } = useEvent(eventId);
  const { data: sales, isError: salesError, refetch, isRefetching } = useEventSales(eventId);
  const [mode, setMode] = useState<'sales' | 'scanning' | 'result'>('sales');
  const [result, setResult] = useState<Result | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TicketTypeFilter>('all');

  if (!canManageEvents) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-gray-500">Admins and excos only.</Text>
      </SafeAreaView>
    );
  }

  const handleScan = async (token: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await adminAttendanceAPI.checkInByToken(eventId, token);
      setResult({ kind: data.status, registration: data.registration });
    } catch (error) {
      setResult(scanFailure(error));
    } finally {
      setIsSubmitting(false);
      setMode('result');
      queryClient.invalidateQueries({ queryKey: ['event-sales', eventId] });
    }
  };

  const scanAnother = () => {
    setResult(null);
    setScannerKey((k) => k + 1);
    setMode('scanning');
  };

  const done = () => {
    setResult(null);
    setMode('sales');
  };

  const style = result && {
    checked_in: { icon: 'checkmark-circle' as const, color: '#006E3A', title: 'Checked in' },
    already_checked_in: { icon: 'information-circle' as const, color: '#F59E0B', title: 'Already checked in' },
    failed: { icon: 'close-circle' as const, color: '#EF4444', title: result.kind === 'failed' ? result.title : '' },
  }[result.kind];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3">
        <Pressable onPress={() => (mode === 'sales' ? router.back() : done())} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>
          {event?.title ?? 'Event Check-in'}
        </Text>
      </View>

      {mode === 'sales' && (
        <ScrollView
          contentContainerClassName="p-4"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#006E3A" />}
        >
          <PrimaryButton title="Scan ticket" onPress={scanAnother} />
          <View className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
            <EventSalesPanel sales={sales} isError={salesError} filter={typeFilter} onFilterChange={setTypeFilter} />
          </View>
        </ScrollView>
      )}

      {mode === 'scanning' && <QRScannerView key={scannerKey} onScan={handleScan} />}

      {mode === 'result' && result && style && (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name={style.icon} size={56} color={style.color} />
          <Text className="mt-4 text-center text-xl font-bold text-gray-900">{style.title}</Text>
          {result.kind === 'failed' && <Text className="mt-2 text-center text-sm text-gray-600">{result.reason}</Text>}
          {result.kind === 'already_checked_in' && result.registration.checked_in_at && (
            <Text className="mt-2 text-center text-sm text-gray-600">
              Scanned at {formatTime(result.registration.checked_in_at)}
              {result.registration.checked_in_by ? ` by ${result.registration.checked_in_by.full_name}` : ''}. Don't let them
              in again.
            </Text>
          )}
          {result.registration && (
            <View className="mt-4 items-center">
              <Text className="text-lg font-semibold text-gray-900">{result.registration.name}</Text>
              {result.registration.ticket_type && (
                <Text className="mt-1 text-sm font-semibold uppercase tracking-wide text-primary">
                  {result.registration.ticket_type.name}
                  {result.registration.ticket_type.venue ? ` · ${result.registration.ticket_type.venue}` : ''}
                </Text>
              )}
            </View>
          )}
          <View className="mt-8 w-full gap-3">
            <PrimaryButton title="Scan next ticket" onPress={scanAnother} />
            <PrimaryButton title="Done" onPress={done} variant="secondary" />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
