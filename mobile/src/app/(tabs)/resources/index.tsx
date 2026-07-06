import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResourceData } from '@/lib/api';
import { useResources } from '@/lib/hooks/useResources';

function ResourceCard({ item }: { item: ResourceData }) {
  return (
    <Pressable
      onPress={() => router.push(`/resources/${item.id}`)}
      className="mb-3 flex-row items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <Text className="text-2xl">{item.file_icon}</Text>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900" numberOfLines={2}>
          {item.title}
        </Text>
        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          {item.course_code ? <Text className="text-xs text-gray-500">{item.course_code}</Text> : null}
          {item.year ? <Text className="text-xs text-gray-500">Year {item.year}</Text> : null}
          <Text className="text-xs text-gray-400">{item.file_size_display}</Text>
        </View>
        {item.submitted_by ? (
          <Text className="mt-1 text-xs text-gray-400">Shared by {item.submitted_by.full_name}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const [search, setSearch] = useState('');
  const { data, isLoading, refetch, isRefetching } = useResources(search ? { search } : undefined);
  const resources = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="border-b border-gray-100 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Resources</Text>
          <Pressable
            onPress={() => router.push('/resources/submit')}
            className="flex-row items-center gap-1 rounded-full bg-primary px-3 py-1.5"
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="text-xs font-semibold text-white">Submit</Text>
          </Pressable>
        </View>
        <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Search resources…"
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
      ) : resources.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
          <Text className="mt-3 text-gray-400">No resources found</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ResourceCard item={item} />}
          contentContainerClassName="p-4"
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeAreaView>
  );
}
