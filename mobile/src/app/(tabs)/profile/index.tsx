import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/context/AuthContext';

function MenuRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-gray-100 py-4"
    >
      <View className="flex-row items-center gap-3">
        <Ionicons name={icon} size={20} color="#374151" />
        <Text className="text-base text-gray-800">{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        <Text className="text-2xl font-bold text-gray-900">{user?.full_name}</Text>
        <Text className="mt-1 text-sm text-gray-500">{user?.email}</Text>
        <View className="mt-4 gap-1">
          <Text className="text-sm text-gray-600">Matric Number: {user?.matric_number}</Text>
          <Text className="text-sm text-gray-600">
            Email verified: {user?.is_email_verified ? 'Yes' : 'No'}
          </Text>
          {isAdmin && <Text className="text-sm font-medium text-primary">Admin account</Text>}
        </View>

        <View className="mt-8">
          <MenuRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
          <MenuRow icon="rocket-outline" label="My Projects" onPress={() => router.push('/projects/my-projects')} />
          <MenuRow icon="heart-outline" label="Liked Projects" onPress={() => router.push('/projects/liked')} />
          <MenuRow
            icon="people-outline"
            label="My Collaborations"
            onPress={() => router.push('/projects/my-collaborations')}
          />
        </View>

        <View className="mt-10">
          <PrimaryButton title="Log Out" onPress={() => logout()} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
}
