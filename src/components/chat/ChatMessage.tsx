import { format } from 'date-fns';
import { FaUser } from 'react-icons/fa';

interface ChatMessageProps {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type?: 'chat' | 'ptt' | 'video' | 'audio';
}

export function ChatMessage({
  senderName,
  content,
  timestamp,
  isOwn,
  type = 'chat',
}: ChatMessageProps) {
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
        <FaUser className="w-5 h-5" />
      </div>
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {isOwn ? 'You' : senderName}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {format(new Date(timestamp), 'HH:mm')}
          </span>
        </div>
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-dark-surface text-gray-900 dark:text-dark-text'
          }`}
        >
          {type === 'audio' || type === 'ptt' ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">🎤 Audio message</span>
              <audio src={content} controls className="max-w-xs" />
            </div>
          ) : (
            <p className="text-sm">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

