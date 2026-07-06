import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { cloudinaryAPI, unwrapApiError } from '@/lib/api';
import { useResourceCategories, useSubmitResource } from '@/lib/hooks/useResources';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
];
const MAX_FILE_SIZE_MB = 20;

export default function SubmitResourceScreen() {
  const { data: categories } = useResourceCategories();
  const submitMutation = useSubmitResource();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [year, setYear] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_MIME_TYPES,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setFile(result.assets[0]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }
    if ((file.size ?? 0) > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large (max ${MAX_FILE_SIZE_MB}MB).`);
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const uploadResult = await cloudinaryAPI.uploadResourceFile({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
      });

      await submitMutation.mutateAsync({
        title,
        description,
        course_code: courseCode,
        year,
        category_id: categoryId ?? undefined,
        url: uploadResult.secure_url,
        file_type: file.mimeType || 'application/octet-stream',
        file_size: file.size ?? 0,
      });

      setSuccess(true);
    } catch (err) {
      const data = unwrapApiError(err);
      setError(
        typeof data === 'object' && data
          ? Object.values(data).flat().join(' ')
          : 'Failed to submit resource. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="checkmark-circle" size={48} color="#006E3A" />
        <Text className="mt-4 text-center text-base text-gray-700">
          Thanks! Your resource has been submitted and is pending admin approval before it appears publicly.
        </Text>
        <PrimaryButton title="Done" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
        <Text className="text-lg font-bold text-gray-900">Submit a Resource</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-6">
          <FormField label="Title" value={title} onChangeText={setTitle} editable={!isUploading} />
          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            editable={!isUploading}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormField
                label="Course Code"
                value={courseCode}
                onChangeText={setCourseCode}
                placeholder="e.g. CSC301"
                autoCapitalize="characters"
                editable={!isUploading}
              />
            </View>
            <View className="flex-1">
              <FormField label="Year" value={year} onChangeText={setYear} placeholder="e.g. 2025" editable={!isUploading} />
            </View>
          </View>

          {categories && categories.length > 0 && (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-gray-700">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                    className={`rounded-full px-3 py-1.5 ${categoryId === c.id ? 'bg-primary' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-xs font-medium ${categoryId === c.id ? 'text-white' : 'text-gray-600'}`}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Text className="mb-1 text-sm font-medium text-gray-700">
            File (PDF, Word, PowerPoint, Excel, ZIP, or text — max {MAX_FILE_SIZE_MB}MB)
          </Text>
          <Pressable
            onPress={handlePickFile}
            className="mb-4 flex-row items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-4"
          >
            <Ionicons name="document-attach-outline" size={20} color="#6B7280" />
            <Text className="flex-1 text-sm text-gray-600" numberOfLines={1}>
              {file ? file.name : 'Choose a file…'}
            </Text>
          </Pressable>

          {error ? <Text className="mb-3 text-sm text-red-500">{error}</Text> : null}

          <PrimaryButton
            title={isUploading ? 'Uploading…' : 'Submit for Review'}
            onPress={handleSubmit}
            loading={isUploading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
