import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectCard } from '@/components/project-card';
import { useMyProjects } from '@/lib/hooks/useProjects';

export default function MyProjectsScreen() {
  const { data: projects, isLoading, refetch, isRefetching } = useMyProjects();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">My Projects</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006E3A" />
        </View>
      ) : !projects || projects.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="rocket-outline" size={40} color="#D1D5DB" />
          <Text className="mt-3 text-gray-400">You haven&apos;t added any projects yet</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ProjectCard item={item} />}
          contentContainerClassName="p-4"
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeAreaView>
  );
}
