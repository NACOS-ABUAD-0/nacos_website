import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/context/AuthContext';
import { CollaborationNeedData, unwrapApiError } from '@/lib/api';
import { useApplyCollaboration, useProject, useToggleLike } from '@/lib/hooks/useProjects';

function ApplyModal({
  projectId,
  needs,
  onClose,
}: {
  projectId: number | string;
  needs: CollaborationNeedData[];
  onClose: () => void;
}) {
  const [selectedNeed, setSelectedNeed] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const applyMutation = useApplyCollaboration(projectId);

  const handleSubmit = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      setError('Phone number and message are required.');
      return;
    }
    setError(null);
    try {
      await applyMutation.mutateAsync({ need_id: selectedNeed, phone_number: phoneNumber, message });
      setSuccess(true);
    } catch (err) {
      const data = unwrapApiError(err);
      setError(data?.detail ?? data?.non_field_errors?.[0] ?? 'Failed to submit application.');
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
          <Text className="text-lg font-bold text-gray-900">Apply to Collaborate</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
        </View>

        {success ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="checkmark-circle" size={48} color="#006E3A" />
            <Text className="mt-4 text-center text-gray-700">
              Your application has been sent to the project owner.
            </Text>
            <PrimaryButton title="Done" onPress={onClose} />
          </View>
        ) : (
          <ScrollView contentContainerClassName="px-6 py-6">
            {needs.length > 0 && (
              <View className="mb-4">
                <Text className="mb-1 text-sm font-medium text-gray-700">Which role? (optional)</Text>
                <View className="flex-row flex-wrap gap-2">
                  {needs.map((n) => (
                    <Pressable
                      key={n.id}
                      onPress={() => setSelectedNeed(selectedNeed === n.id ? null : (n.id ?? null))}
                      className={`rounded-full px-3 py-1.5 ${selectedNeed === n.id ? 'bg-primary' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-xs font-medium ${selectedNeed === n.id ? 'text-white' : 'text-gray-600'}`}>
                        {n.skill_type_display ?? n.skill_type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            <FormField
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <FormField
              label="Message"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              placeholder="Tell the owner why you'd be a good fit"
            />
            {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}
            <PrimaryButton
              title={applyMutation.isPending ? 'Sending…' : 'Send Application'}
              onPress={handleSubmit}
              loading={applyMutation.isPending}
            />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: project, isLoading } = useProject(id);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const toggleLike = useToggleLike(id, project?.is_liked_by_user ?? false);

  if (isLoading || !project) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#006E3A" />
      </SafeAreaView>
    );
  }

  const isOwner = user?.id === project.owner.id;
  const openNeeds = project.collaboration_needs.filter((n) => !n.is_filled);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={1}>
          {project.title}
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-6 py-6">
        <Text className="text-xl font-bold text-gray-900">{project.title}</Text>
        <Text className="mt-1 text-sm text-gray-500">by {project.owner.full_name}</Text>

        <View className="mt-3 flex-row items-center gap-4">
          <Pressable onPress={() => toggleLike.mutate()} className="flex-row items-center gap-1">
            <Ionicons
              name={project.is_liked_by_user ? 'heart' : 'heart-outline'}
              size={20}
              color={project.is_liked_by_user ? '#EF4444' : '#6B7280'}
            />
            <Text className="text-sm text-gray-600">{project.like_count}</Text>
          </Pressable>
          {isOwner && (
            <Pressable
              onPress={() => router.push(`/projects/${project.id}/requests`)}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="people-outline" size={18} color="#6B7280" />
              <Text className="text-sm text-gray-600">Collaboration Requests</Text>
            </Pressable>
          )}
        </View>

        <Text className="mt-4 text-sm leading-6 text-gray-700">{project.description}</Text>

        {project.tags.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Text key={tag.id} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                {tag.name}
              </Text>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(project.live_url)}
          className="mt-5 flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 py-3"
        >
          <Ionicons name="open-outline" size={16} color="#374151" />
          <Text className="font-medium text-gray-700">View Live Project</Text>
        </Pressable>

        {Object.entries(project.links ?? {}).length > 0 && (
          <View className="mt-3 gap-2">
            {Object.entries(project.links).map(([label, url]) => (
              <Pressable key={label} onPress={() => WebBrowser.openBrowserAsync(url)}>
                <Text className="text-sm font-medium text-primary">{label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!isOwner && (
          <View className="mt-6 border-t border-gray-100 pt-6">
            <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Collaboration
            </Text>
            {project.has_collaboration_needs ? (
              <>
                <View className="mb-3 flex-row flex-wrap gap-2">
                  {openNeeds.map((n) => (
                    <Text key={n.id} className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                      {n.skill_type_display ?? n.skill_type}
                    </Text>
                  ))}
                </View>
                <PrimaryButton title="Apply to Collaborate" onPress={() => setShowApplyModal(true)} />
              </>
            ) : (
              <Text className="text-sm text-gray-400">This project isn&apos;t looking for collaborators right now.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {showApplyModal && (
        <ApplyModal projectId={project.id} needs={openNeeds} onClose={() => setShowApplyModal(false)} />
      )}
    </SafeAreaView>
  );
}
