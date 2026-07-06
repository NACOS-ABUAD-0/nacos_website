import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { resourcesAPI } from '@/lib/api';
import { useResource } from '@/lib/hooks/useResources';

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: resource, isLoading } = useResource(id);

  if (isLoading || !resource) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#006E3A" />
      </SafeAreaView>
    );
  }

  const handleView = () => WebBrowser.openBrowserAsync(resource.url);

  const handleDownload = async () => {
    try {
      await resourcesAPI.trackDownload(resource.id);
    } catch {
      // Non-fatal — still let the user open the file.
    }
    await WebBrowser.openBrowserAsync(resource.download_url || resource.url);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>
          {resource.title}
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-6 py-6">
        <View className="mb-4 flex-row items-center gap-3">
          <Text className="text-4xl">{resource.file_icon}</Text>
          <View>
            <Text className="text-lg font-bold text-gray-900">{resource.title}</Text>
            <Text className="text-xs text-gray-400">{resource.file_size_display}</Text>
          </View>
        </View>

        <Text className="text-sm leading-6 text-gray-700">{resource.description}</Text>

        <View className="mt-4 gap-2">
          {resource.course_code ? (
            <Text className="text-sm text-gray-600">Course: {resource.course_code}</Text>
          ) : null}
          {resource.year ? <Text className="text-sm text-gray-600">Year: {resource.year}</Text> : null}
          {resource.category ? (
            <Text className="text-sm text-gray-600">Category: {resource.category.name}</Text>
          ) : null}
          {resource.submitted_by ? (
            <Text className="text-sm text-gray-600">Shared by: {resource.submitted_by.full_name}</Text>
          ) : null}
          <Text className="text-sm text-gray-600">Downloads: {resource.download_count}</Text>
        </View>

        {resource.tags.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <Text key={tag.id} className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                {tag.name}
              </Text>
            ))}
          </View>
        )}

        <View className="mt-8 flex-row gap-3">
          <PrimaryButton title="View" onPress={handleView} variant="secondary" />
          <PrimaryButton title="Download" onPress={handleDownload} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
