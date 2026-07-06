import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssistantMessage } from '@/lib/api';
import { useAssistantMessages, useClearAssistantConversation, useSendAssistantMessage } from '@/lib/hooks/useAssistant';

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user';
  return (
    <View className={`mb-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-primary' : 'bg-gray-100'}`}>
        <Text className={isUser ? 'text-white' : 'text-gray-800'}>{message.content}</Text>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const { data: messages, isLoading } = useAssistantMessages();
  const sendMessage = useSendAssistantMessage();
  const clearConversation = useClearAssistantConversation();
  const [input, setInput] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
    setInput('');
    setPendingMessage(trimmed);
    try {
      await sendMessage.mutateAsync(trimmed);
    } catch {
      Alert.alert('Failed to send', 'Please try again.');
    } finally {
      setPendingMessage(null);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear conversation?', 'This will delete your entire chat history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearConversation.mutate() },
    ]);
  };

  const items = messages ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
        <Text className="text-lg font-bold text-gray-900">Assistant</Text>
        <Pressable onPress={handleClear} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" keyboardVerticalOffset={90}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#006E3A" />
          </View>
        ) : items.length === 0 && !pendingMessage ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#D1D5DB" />
            <Text className="mt-3 text-center text-gray-400">
              Ask me anything about NACOS resources, projects, or events.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerClassName="px-4 py-4"
            ListFooterComponent={
              pendingMessage ? (
                <>
                  <MessageBubble
                    message={{ id: -1, role: 'user', content: pendingMessage, created_at: '' }}
                  />
                  <View className="mb-3 max-w-[85%] self-start rounded-2xl bg-gray-100 px-4 py-3">
                    <ActivityIndicator size="small" color="#6B7280" />
                  </View>
                </>
              ) : null
            }
          />
        )}

        <View className="flex-row items-center gap-2 border-t border-gray-100 px-4 py-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor="#9CA3AF"
            className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm text-gray-800"
            multiline
            editable={!sendMessage.isPending}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              !input.trim() || sendMessage.isPending ? 'bg-gray-200' : 'bg-primary'
            }`}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
