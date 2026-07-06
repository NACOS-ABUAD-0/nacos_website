import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { assistantAPI } from '@/lib/api';

export function useAssistantMessages() {
  return useQuery({
    queryKey: ['assistant-messages'],
    queryFn: async () => (await assistantAPI.getMessages()).data,
  });
}

export function useSendAssistantMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => assistantAPI.sendMessage(message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assistant-messages'] }),
  });
}

export function useClearAssistantConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => assistantAPI.clearConversation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assistant-messages'] }),
  });
}
