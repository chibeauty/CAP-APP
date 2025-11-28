import { useState } from 'react';
import { FaPaperPlane, FaMicrophone, FaVideo, FaPhone } from 'react-icons/fa';
import { ChatMessage } from './ChatMessage';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Message } from '@/types';

interface ChatThreadProps {
  threadId: string;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, type?: 'chat' | 'ptt' | 'video') => void;
  onStartCall?: () => void;
}

export function ChatThread({
  messages,
  currentUserId,
  onSendMessage,
  onStartCall,
}: ChatThreadProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), 'chat');
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              id={msg.id}
              senderId={msg.sender_id}
              senderName="User" // Would come from user data
              content={msg.content}
              timestamp={msg.created_at}
              isOwn={msg.sender_id === currentUserId}
              type={msg.type}
            />
          ))
        )}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-dark-surface">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSendMessage('', 'ptt')}
            aria-label="Push to talk"
          >
            <FaMicrophone className="w-4 h-4" />
          </Button>
          {onStartCall && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartCall}
              aria-label="Start video call"
            >
              <FaVideo className="w-4 h-4" />
            </Button>
          )}
          {onStartCall && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartCall}
              aria-label="Start audio call"
            >
              <FaPhone className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} aria-label="Send message">
            <FaPaperPlane className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

