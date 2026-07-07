import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriveResourceData, ResourceData, resourcesAPI } from '@/lib/api';
import { useDriveResources, useResources } from '@/lib/hooks/useResources';

// Google-Drive-synced resources have no detail page (they aren't DB rows —
// see DriveResourceData's comment in lib/api.ts), so View/Download are
// inline actions right on the card, matching how the web resources page
// handles this same data source.
function DriveResourceCard({ item }: { item: DriveResourceData }) {
  const handleView = () => WebBrowser.openBrowserAsync(item.url);
  const handleDownload = async () => {
    try {
      await resourcesAPI.trackDownload(item.id);
    } catch {
      // Non-fatal — still let the user open the file.
    }
    await WebBrowser.openBrowserAsync(item.download_url || item.url);
  };

  return (
    <View className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-start gap-3">
        <Ionicons name="document-text-outline" size={22} color="#006E3A" />
        <View className="flex-1">
          <Text className="font-semibold text-gray-900" numberOfLines={2}>
            {item.title}
          </Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            {item.course_code ? <Text className="text-xs text-gray-500">{item.course_code}</Text> : null}
            {item.year ? <Text className="text-xs text-gray-500">Year {item.year}</Text> : null}
            <Text className="text-xs text-gray-400">{item.file_size_display}</Text>
          </View>
        </View>
      </View>
      <View className="mt-3 flex-row gap-2">
        <Pressable onPress={handleView} className="flex-1 items-center rounded-lg bg-gray-100 py-2">
          <Text className="text-sm font-medium text-gray-700">View</Text>
        </Pressable>
        <Pressable onPress={handleDownload} className="flex-1 items-center rounded-lg bg-primary py-2">
          <Text className="text-sm font-medium text-white">Download</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Student/admin-submitted resources are real DB rows with a detail page —
// tapping navigates there (richer metadata: tags, submitter, description).
function CommunityResourceCard({ item }: { item: ResourceData }) {
  return (
    <Pressable
      onPress={() => router.push(`/resources/${item.id}`)}
      className="mb-3 flex-row items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <Ionicons name="document-text-outline" size={22} color="#006E3A" />
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

  const { data: driveResources, isLoading: isLoadingDrive, refetch: refetchDrive, isRefetching } =
    useDriveResources();
  const { data: communityData, isLoading: isLoadingCommunity } = useResources(search ? { search } : undefined);
  const communityResources = communityData?.results ?? [];

  const filteredDriveResources = useMemo(() => {
    const all = driveResources ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.course_code ?? '').toLowerCase().includes(q),
    );
  }, [driveResources, search]);

  const isLoading = isLoadingDrive || isLoadingCommunity;

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
      ) : filteredDriveResources.length === 0 && communityResources.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
          <Text className="mt-3 text-gray-400">No resources found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDriveResources}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DriveResourceCard item={item} />}
          contentContainerClassName="p-4"
          onRefresh={refetchDrive}
          refreshing={isRefetching}
          ListFooterComponent={
            communityResources.length > 0 ? (
              <View className="mt-2">
                <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Community Submitted
                </Text>
                {communityResources.map((item) => (
                  <CommunityResourceCard key={item.id} item={item} />
                ))}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
