import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ProjectData } from '@/lib/api';

export function ProjectCard({ item }: { item: ProjectData }) {
  return (
    <Pressable
      onPress={() => router.push(`/projects/${item.id}`)}
      className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-base font-semibold text-gray-900" numberOfLines={2}>
          {item.title}
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="heart" size={14} color="#EF4444" />
          <Text className="text-xs text-gray-500">{item.like_count}</Text>
        </View>
      </View>
      <Text className="mt-1 text-xs text-gray-400">by {item.owner.full_name}</Text>
      <Text className="mt-2 text-sm text-gray-600" numberOfLines={2}>
        {item.description}
      </Text>
      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        {item.tags.slice(0, 3).map((tag) => (
          <Text key={tag.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {tag.name}
          </Text>
        ))}
        {item.has_collaboration_needs && (
          <Text className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            Needs collaborators
          </Text>
        )}
      </View>
    </Pressable>
  );
}
