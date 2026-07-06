// src/pages/AssistantPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import {
  useAssistantMessages,
  useSendAssistantMessage,
  useClearAssistantConversation,
} from '../lib/hooks/useAssistant';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Send, Loader2, Sparkles, Trash2, Bot, User as UserIcon } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const { isDark } = useTheme();
  const { data: messages, isLoading } = useAssistantMessages();
  const { mutate: sendMessage, isPending: isSending } = useSendAssistantMessage();
  const { mutate: clearConversation, isPending: isClearing } = useClearAssistantConversation();

  const [input, setInput] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setPendingMessage(trimmed);
    setInput('');
    sendMessage(trimmed, {
      onSettled: () => setPendingMessage(null),
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Failed to send message.';
        toast.error(msg);
      },
    });
  };

  const handleClear = () => {
    if (!window.confirm('Clear this conversation? This cannot be undone.')) return;
    clearConversation(undefined, {
      onSuccess: () => toast.success('Conversation cleared.'),
      onError: () => toast.error('Failed to clear conversation.'),
    });
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0a0f1e]' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles className="w-6 h-6 text-green-600" />
              NACOS Assistant
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Ask about academic resources, student projects, or NACOS ABUAD in general.
            </p>
          </div>
          {messages && messages.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isClearing}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                isDark
                  ? 'border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Message list */}
        <div
          className={`flex-1 mt-4 mb-4 min-h-[50vh] max-h-[60vh] overflow-y-auto rounded-2xl border p-4 space-y-4 ${
            isDark ? 'bg-[#161d2e] border-white/[0.07]' : 'bg-white border-gray-100'
          }`}
        >
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            </div>
          )}

          {!isLoading && (!messages || messages.length === 0) && !pendingMessage && (
            <div className={`text-center py-10 text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Ask something like "any resources on data structures?" or "show me projects using React."
            </div>
          )}

          {messages?.map((m) => (
            <ChatBubble key={m.id} role={m.role} content={m.content} isDark={isDark} />
          ))}

          {pendingMessage && (
            <>
              <ChatBubble role="user" content={pendingMessage} isDark={isDark} />
              <div className="flex items-center gap-2 px-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <Bot className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                </div>
                <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
              </div>
            </>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the assistant anything..."
            disabled={isSending}
            className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all disabled:opacity-60 ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
            }`}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </motion.form>
      </main>
      <Footer />
    </div>
  );
};

const ChatBubble: React.FC<{ role: 'user' | 'assistant'; content: string; isDark: boolean }> = ({
  role,
  content,
  isDark,
}) => {
  const isUser = role === 'user';
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-green-600' : isDark ? 'bg-white/10' : 'bg-gray-100'
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-white" />
        ) : (
          <Bot className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
        )}
      </div>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-green-600 text-white rounded-tr-sm'
            : isDark
            ? 'bg-white/[0.06] text-slate-200 rounded-tl-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  );
};
