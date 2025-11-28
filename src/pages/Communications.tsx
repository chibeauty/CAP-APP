import { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ChatThread } from '@/components/chat/ChatThread';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/types';

export function Communications() {
  const { user } = useAuth();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Array<{ id: string; name: string; lastMessage?: string }>>([]);

  const fetchThreads = async () => {
    try {
      // In production, fetch actual threads from Supabase
      // This is a placeholder
      setThreads([
        { id: 'security-team', name: 'Security Team', lastMessage: 'We are here to help' },
        { id: 'event-coord', name: 'Event Coordinator', lastMessage: 'Event details updated' },
      ]);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThread]);

  const handleSendMessage = async (content: string, type: 'chat' | 'ptt' | 'video' = 'chat') => {
    if (!user || !activeThread) return;

    try {
      const { error } = await supabase.from('messages').insert({
        thread_id: activeThread,
        sender_id: user.id,
        content,
        type,
      });

      if (error) throw error;
      fetchMessages(activeThread);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStartCall = () => {
    // WebRTC call implementation would go here
    alert('Starting video call...');
  };

  return (
    <div className="pb-20 md:pb-6 h-screen flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Communications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Chat with security team and event coordinators
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThread(thread.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors ${
                      activeThread === thread.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-dark-text">
                      {thread.name}
                    </div>
                    {thread.lastMessage && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {thread.lastMessage}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 flex flex-col">
            {activeThread ? (
              <ChatThread
                threadId={activeThread}
                messages={messages}
                currentUserId={user?.id || ''}
                onSendMessage={handleSendMessage}
                onStartCall={handleStartCall}
              />
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FaComments className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a conversation to start chatting
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

