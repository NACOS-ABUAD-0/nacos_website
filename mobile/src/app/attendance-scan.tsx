import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { QRScannerView } from '@/components/qr-scanner';
import { attendanceAPI } from '@/lib/api';

type Result = { kind: 'recorded'; courseCode: string } | { kind: 'closed' } | { kind: 'invalid' } | null;

export default function AttendanceScanScreen() {
  const [result, setResult] = useState<Result>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScan = async (token: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await attendanceAPI.scan(token);
      setResult({ kind: 'recorded', courseCode: data.course_code });
    } catch (err: any) {
      setResult(err?.response?.status === 400 ? { kind: 'closed' } : { kind: 'invalid' });
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
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
        <Text className="text-lg font-bold text-gray-900">Class Attendance</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
      </View>

      {result ? (
        <View className="flex-1 items-center justify-center px-6">
          {result.kind === 'recorded' && (
            <>
              <Ionicons name="checkmark-circle" size={48} color="#006E3A" />
              <Text className="mt-4 text-center text-base text-gray-800">
                Marked present for {result.courseCode}
              </Text>
            </>
          )}
          {result.kind === 'closed' && (
            <>
              <Ionicons name="alert-circle" size={48} color="#F59E0B" />
              <Text className="mt-4 text-center text-base text-gray-800">
                This session has been closed. Ask your lecturer for a new QR code.
              </Text>
            </>
          )}
          {result.kind === 'invalid' && (
            <>
              <Ionicons name="close-circle" size={48} color="#EF4444" />
              <Text className="mt-4 text-center text-base text-gray-800">Invalid QR code.</Text>
            </>
          )}
          <View className="mt-8 w-full">
            <PrimaryButton title="Scan Another" onPress={scanAnother} />
          </View>
        </View>
      ) : (
        <>
          <Text className="px-6 py-4 text-center text-sm text-gray-500">
            Scan the QR code your lecturer is displaying.
          </Text>
          <QRScannerView key={scannerKey} onScan={handleScan} />
        </>
      )}
    </SafeAreaView>
  );
}
