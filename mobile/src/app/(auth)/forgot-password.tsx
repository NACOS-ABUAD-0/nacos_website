import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { authAPI, unwrapApiError } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authAPI.requestPasswordReset(email.trim().toLowerCase(), matricNumber.trim() || undefined);
      setSent(true);
    } catch (err) {
      const data = unwrapApiError(err);
      setError(data?.detail ?? 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
          <Text className="mb-1 text-2xl font-bold text-gray-900">Reset your password</Text>
          <Text className="mb-6 text-sm text-gray-500">
            Enter your account email and we&apos;ll send you a reset link.
          </Text>

          {sent ? (
            <View className="rounded-lg border border-green-200 bg-green-50 p-4">
              <Text className="text-sm text-green-800">
                If an account exists for that email, a password reset link has been sent. Open the link on this
                device to finish resetting your password.
              </Text>
            </View>
          ) : (
            <>
              <FormField
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
              <FormField
                label="Matric Number (optional)"
                value={matricNumber}
                onChangeText={setMatricNumber}
                autoCapitalize="characters"
                editable={!isLoading}
              />
              {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}
              <PrimaryButton title={isLoading ? 'Sending…' : 'Send Reset Link'} onPress={handleSubmit} loading={isLoading} />
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
