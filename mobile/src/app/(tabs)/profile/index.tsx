import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        <Text className="text-2xl font-bold text-gray-900">{user?.full_name}</Text>
        <Text className="mt-1 text-sm text-gray-500">{user?.email}</Text>
        <View className="mt-4 gap-2">
          <Text className="text-sm text-gray-600">Matric Number: {user?.matric_number}</Text>
          <Text className="text-sm text-gray-600">
            Email verified: {user?.is_email_verified ? 'Yes' : 'No'}
          </Text>
          {isAdmin && <Text className="text-sm font-medium text-primary">Admin account</Text>}
        </View>

        <View className="mt-10">
          <PrimaryButton title="Log Out" onPress={() => logout()} variant="secondary" />
        </View>

        <Text className="mt-6 text-center text-xs text-gray-400">
          Notifications, account settings, and more coming in Milestone 3
        </Text>
      </View>
    </SafeAreaView>
  );
}
