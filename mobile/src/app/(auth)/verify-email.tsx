import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/context/AuthContext';
import { authAPI, unwrapApiError } from '@/lib/api';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ uid?: string; token?: string }>();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (params.uid && params.token) {
      setStatus('verifying');
      authAPI
        .verifyEmail(params.uid, params.token)
        .then(async () => {
          setStatus('success');
          await refreshProfile();
        })
        .catch((err) => {
          setStatus('error');
          setError(unwrapApiError(err)?.error ?? 'Failed to verify email. The link may have expired.');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.uid, params.token]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authAPI.resendVerification();
      setResent(true);
    } catch (err) {
      setError(unwrapApiError(err)?.detail ?? 'Failed to send verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6">
        {status === 'success' ? (
          <View className="items-center">
            <Text className="mb-2 text-2xl font-bold text-gray-900">Email verified!</Text>
            <Text className="mb-6 text-center text-sm text-gray-500">Your email has been confirmed.</Text>
            <PrimaryButton title="Continue" onPress={() => router.replace('/(tabs)')} />
          </View>
        ) : status === 'verifying' ? (
          <Text className="text-center text-gray-500">Verifying your email…</Text>
        ) : (
          <View className="items-center">
            <Text className="mb-2 text-2xl font-bold text-gray-900">Verify your email</Text>
            <Text className="mb-6 text-center text-sm text-gray-500">
              {status === 'error' && error
                ? error
                : 'Check your inbox for a verification link, or resend it below.'}
            </Text>
            {resent ? (
              <Text className="text-sm text-green-700">Verification email sent — check your inbox.</Text>
            ) : (
              <PrimaryButton title={isResending ? 'Sending…' : 'Resend Verification Email'} onPress={handleResend} loading={isResending} />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
