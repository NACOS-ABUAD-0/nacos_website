import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectCard } from '@/components/project-card';
import { useProjects } from '@/lib/hooks/useProjects';

export default function ProjectsScreen() {
  const [search, setSearch] = useState('');
  const { data, isLoading, refetch, isRefetching } = useProjects(search ? { search } : undefined);
  const projects = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="border-b border-gray-100 bg-white px-4 py-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Projects</Text>
          <View className="flex-row gap-3">
            <Pressable onPress={() => router.push('/projects/liked')} hitSlop={8}>
              <Ionicons name="heart-outline" size={22} color="#374151" />
            </Pressable>
            <Pressable onPress={() => router.push('/projects/my-projects')} hitSlop={8}>
              <Ionicons name="person-circle-outline" size={22} color="#374151" />
            </Pressable>
          </View>
        </View>
        <View className="flex-row items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Search projects…"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-sm text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006E3A" />
        </View>
      ) : projects.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="rocket-outline" size={40} color="#D1D5DB" />
          <Text className="mt-3 text-gray-400">No projects found</Text>
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
