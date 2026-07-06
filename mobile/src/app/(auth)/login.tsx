import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.detail ?? err?.non_field_errors?.[0] ?? 'Login failed. Please check your details.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
          <Text className="mb-1 text-2xl font-bold text-gray-900">Welcome back</Text>
          <Text className="mb-6 text-sm text-gray-500">Log in to your NACOS ABUAD account</Text>

          <FormField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
          <FormField
            label="Password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />

          {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}

          <View className="mt-2 flex-row gap-3">
            <PrimaryButton title={isLoading ? 'Logging in…' : 'Log In'} onPress={handleLogin} loading={isLoading} />
          </View>

          <Link href="/(auth)/forgot-password" className="mt-4 text-center text-sm text-primary">
            Forgot your password?
          </Link>

          <View className="mt-8 flex-row justify-center gap-1">
            <Text className="text-sm text-gray-500">Don&apos;t have an account?</Text>
            <Link href="/(auth)/register" className="text-sm font-semibold text-primary">
              Sign up
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
