import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/context/AuthContext';
import { authAPI, unwrapApiError } from '@/lib/api';

type Step = 1 | 2 | 3;

const STEP_LABELS = ['Email', 'Identity', 'Password'];

const LEVELS = ['100', '200', '300', '400'];

function StepIndicator({ current }: { current: Step }) {
  return (
    <View className="mb-6 flex-row items-center justify-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as Step;
        const done = current > num;
        const active = current === num;
        return (
          <View key={label} className="flex-row items-center">
            <View className="items-center">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  done || active ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <Text className={done || active ? 'font-bold text-white' : 'font-bold text-gray-500'}>
                  {done ? '✓' : num}
                </Text>
              </View>
              <Text className={`mt-1 text-xs ${active ? 'font-medium text-primary' : 'text-gray-400'}`}>
                {label}
              </Text>
            </View>
            {i < STEP_LABELS.length - 1 && (
              <View className={`mb-4 h-0.5 w-8 ${done ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function getPasswordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [surname, setSurname] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [level, setLevel] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [studentInfo, setStudentInfo] = useState<{ full_name: string; department: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authAPI.checkEmail(trimmed);
      setEmail(trimmed);
      setStep(2);
    } catch (err) {
      const data = unwrapApiError(err);
      setError(data?.email?.[0] ?? data?.detail ?? data?.non_field_errors?.[0] ?? 'Email check failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentitySubmit = async () => {
    if (!surname.trim() || !otherNames.trim()) {
      setError('Surname and other names are required.');
      return;
    }
    if (!level) {
      setError('Select your level.');
      return;
    }
    // 100 level students haven't been issued matric numbers yet.
    if (!matricNumber.trim()) {
      if (level !== '100') {
        setError('Matric number is required.');
        return;
      }
      setError(null);
      setVerificationToken('');
      setStudentInfo(null);
      setStep(3);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await authAPI.verifyStudent(
        email,
        surname.trim(),
        otherNames.trim(),
        matricNumber.trim(),
      );
      setVerificationToken(data.verification_token);
      setStudentInfo(data.student);
      setStep(3);
    } catch (err) {
      const data = unwrapApiError(err);
      setError(
        data?.matric_number?.[0] ??
          data?.surname?.[0] ??
          data?.other_names?.[0] ??
          data?.non_field_errors?.[0] ??
          data?.detail ??
          'Identity verification failed. Please check your details.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password || password.length < 8) {
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
      await register({
        email,
        surname: surname.trim(),
        otherNames: otherNames.trim(),
        level,
        matricNumber: matricNumber.trim() || undefined,
        password,
        password2,
        verificationToken: verificationToken || undefined,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.detail ?? 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pwStrength = getPasswordStrength(password);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 py-10">
          <Text className="mb-1 text-2xl font-bold text-gray-900">Create Account</Text>
          <Text className="mb-5 text-sm text-gray-500">Join the NACOS ABUAD innovation community</Text>

          <StepIndicator current={step} />

          {step === 1 && (
            <View>
              <Text className="mb-4 text-sm text-gray-600">Enter your email to get started.</Text>
              <FormField
                label="Email"
                placeholder="you@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
              {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}
              <PrimaryButton title={isLoading ? 'Checking…' : 'Continue'} onPress={handleEmailSubmit} loading={isLoading} />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text className="mb-4 text-sm text-gray-600">Confirm your identity using your official student records.</Text>
              <FormField label="Email (confirmed)" value={email} editable={false} />
              <FormField
                label="Surname"
                value={surname}
                onChangeText={setSurname}
                placeholder="Your family name, as on your student record"
                autoComplete="family-name"
                editable={!isLoading}
              />
              <FormField
                label="Other Names"
                value={otherNames}
                onChangeText={setOtherNames}
                placeholder="First and middle names"
                autoComplete="given-name"
                editable={!isLoading}
              />
              <View className="mb-4">
                <Text className="mb-1 text-sm font-medium text-gray-700">Level</Text>
                <View className="flex-row gap-2">
                  {LEVELS.map((l) => {
                    const selected = level === l;
                    return (
                      <Pressable
                        key={l}
                        onPress={() => setLevel(l)}
                        disabled={isLoading}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={`flex-1 items-center rounded-lg border py-3 ${
                          selected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                        }`}
                      >
                        <Text className={selected ? 'font-semibold text-white' : 'text-gray-700'}>{l}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <FormField
                label={level === '100' ? 'Matric Number (optional)' : 'Matric Number'}
                value={matricNumber}
                onChangeText={setMatricNumber}
                placeholder="e.g. 23/SCI01/002"
                autoCapitalize="characters"
                editable={!isLoading}
              />
              {level === '100' ? (
                <Text className="-mt-2 mb-4 text-xs text-gray-500">
                  No matric number yet? Leave this blank and add it from your profile once numbers are issued.
                </Text>
              ) : null}
              {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <PrimaryButton title="Back" onPress={() => setStep(1)} variant="secondary" disabled={isLoading} />
                </View>
                <View className="flex-1">
                  <PrimaryButton title={isLoading ? 'Verifying…' : 'Verify'} onPress={handleIdentitySubmit} loading={isLoading} />
                </View>
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              {studentInfo && (
                <View className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                  <Text className="font-semibold text-green-800">✓ Identity Verified</Text>
                  <Text className="text-green-700">{studentInfo.full_name}</Text>
                  <Text className="text-xs text-green-600">
                    {studentInfo.department} · {level} Level
                  </Text>
                </View>
              )}
              <FormField
                label="Create Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                editable={!isLoading}
              />
              {password.length > 0 && (
                <View className="-mt-2 mb-4">
                  <View className="flex-row gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <View
                        key={n}
                        className={`h-1 flex-1 rounded-full ${n <= pwStrength.score ? 'bg-primary' : 'bg-gray-200'}`}
                      />
                    ))}
                  </View>
                  <Text className="mt-1 text-xs text-gray-500">{pwStrength.label}</Text>
                </View>
              )}
              <FormField
                label="Confirm Password"
                secureTextEntry
                value={password2}
                onChangeText={setPassword2}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                editable={!isLoading}
              />
              {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <PrimaryButton title="Back" onPress={() => setStep(2)} variant="secondary" disabled={isLoading} />
                </View>
                <View className="flex-1">
                  <PrimaryButton
                    title={isLoading ? 'Creating account…' : 'Create Account'}
                    onPress={handlePasswordSubmit}
                    loading={isLoading}
                  />
                </View>
              </View>
            </View>
          )}

          <View className="mt-8 flex-row justify-center gap-1">
            <Text className="text-sm text-gray-500">Already have an account?</Text>
            <Link href="/(auth)/login" className="text-sm font-semibold text-primary">
              Log in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
