import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { authAPI, unwrapApiError } from '@/lib/api';

// Password-reset emails link to the web app (backend/accounts/utils.py builds
// the link from FRONTEND_URL), since that's where uid/token deep-linking is
// already wired up. This screen exists for the case a future deep link
// (nacosabuad://reset-password?uid=..&token=..) or manual entry is used.
export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ uid?: string; token?: string }>();
  const [uid, setUid] = useState(params.uid ?? '');
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!uid.trim() || !token.trim()) {
      setError('Missing or invalid reset link details.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authAPI.confirmPasswordReset(uid.trim(), token.trim(), password, password2);
      setDone(true);
    } catch (err) {
      const data = unwrapApiError(err);
      setError(data?.detail ?? data?.non_field_errors?.[0] ?? 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
          <Text className="mb-1 text-2xl font-bold text-gray-900">Set a new password</Text>

          {done ? (
            <View className="rounded-lg border border-green-200 bg-green-50 p-4">
              <Text className="mb-3 text-sm text-green-800">Your password has been reset. You can now log in.</Text>
              <PrimaryButton title="Go to Login" onPress={() => router.replace('/(auth)/login')} />
            </View>
          ) : (
            <>
              {!params.uid && (
                <FormField label="Reset code (uid)" value={uid} onChangeText={setUid} autoCapitalize="none" editable={!isLoading} />
              )}
              {!params.token && (
                <FormField label="Reset token" value={token} onChangeText={setToken} autoCapitalize="none" editable={!isLoading} />
              )}
              <FormField
                label="New Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoComplete="new-password"
                editable={!isLoading}
              />
              <FormField
                label="Confirm New Password"
                secureTextEntry
                value={password2}
                onChangeText={setPassword2}
                autoComplete="new-password"
                editable={!isLoading}
              />
              {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}
              <PrimaryButton title={isLoading ? 'Saving…' : 'Reset Password'} onPress={handleSubmit} loading={isLoading} />
            </>
          )}

          <View className="mt-8 flex-row justify-center gap-1">
            <Link href="/(auth)/login" className="text-sm font-semibold text-primary">
              Back to login
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
