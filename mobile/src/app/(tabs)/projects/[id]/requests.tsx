import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollaborationRequestData } from '@/lib/api';
import {
  useAcceptCollaborationRequest,
  useCollaborationRequests,
  useRejectCollaborationRequest,
} from '@/lib/hooks/useProjects';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function RequestCard({ item, projectId }: { item: CollaborationRequestData; projectId: string }) {
  const acceptMutation = useAcceptCollaborationRequest(projectId);
  const rejectMutation = useRejectCollaborationRequest(projectId);

  return (
    <View className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-gray-900">{item.applicant_name}</Text>
        <Text className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
          {item.status}
        </Text>
      </View>
      <Text className="text-xs text-gray-400">{item.applicant_email}</Text>
      {item.need_skill && <Text className="mt-1 text-xs text-gray-500">Role: {item.need_skill}</Text>}
      <Text className="mt-2 text-sm text-gray-700">{item.message}</Text>
      <Text className="mt-1 text-xs text-gray-500">📞 {item.phone_number}</Text>

      {item.status === 'pending' && (
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => acceptMutation.mutate(item.id)}
            className="flex-1 items-center rounded-lg bg-primary py-2"
          >
            <Text className="text-sm font-medium text-white">Accept</Text>
          </Pressable>
          <Pressable
            onPress={() => rejectMutation.mutate(item.id)}
            className="flex-1 items-center rounded-lg bg-red-50 py-2"
          >
            <Text className="text-sm font-medium text-red-700">Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function CollaborationRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: requests, isLoading, refetch, isRefetching } = useCollaborationRequests(id);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Collaboration Requests</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006E3A" />
        </View>
      ) : !requests || requests.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={40} color="#D1D5DB" />
          <Text className="mt-3 text-gray-400">No collaboration requests yet</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <RequestCard item={item} projectId={id} />}
          contentContainerClassName="p-4"
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeAreaView>
  );
}
