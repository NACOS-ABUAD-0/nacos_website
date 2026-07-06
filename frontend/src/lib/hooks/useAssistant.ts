// src/lib/hooks/useAssistant.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assistantAPI } from '../api';

export interface AssistantMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const useAssistantMessages = () => {
  return useQuery<AssistantMessage[]>({
    queryKey: ['assistant-messages'],
    queryFn: async () => {
      const res = await assistantAPI.getMessages();
      return res.data;
    },
  });
};

export const useSendAssistantMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await assistantAPI.sendMessage(message);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assistant-messages'] });
    },
  });
};

export const useClearAssistantConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await assistantAPI.clearConversation();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assistant-messages'] });
    },
  });
};
