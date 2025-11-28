import { useEffect } from 'react';
import { FaMicrophone, FaStop, FaTrash } from 'react-icons/fa';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '../ui/Button';

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  maxDuration?: number; // in seconds
}

export function AudioRecorder({ onRecordingComplete, maxDuration = 60 }: AudioRecorderProps) {
  const { isRecording, audioBlob, startRecording, stopRecording, clearRecording, error } =
    useAudioRecorder();

  useEffect(() => {
    if (audioBlob && onRecordingComplete && !isRecording) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, onRecordingComplete, isRecording]);

  const handleStop = () => {
    stopRecording();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        {!isRecording && !audioBlob && (
          <Button
            variant="danger"
            onClick={startRecording}
            aria-label="Start recording"
            className="rounded-full w-16 h-16 p-0"
          >
            <FaMicrophone className="w-6 h-6" />
          </Button>
        )}
        {isRecording && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recording...
              </span>
            </div>
            <Button
              variant="danger"
              onClick={handleStop}
              aria-label="Stop recording"
              className="rounded-full w-16 h-16 p-0"
            >
              <FaStop className="w-6 h-6" />
            </Button>
          </>
        )}
        {audioBlob && !isRecording && (
          <div className="flex items-center gap-3">
            <audio src={URL.createObjectURL(audioBlob)} controls className="max-w-xs" />
            <Button
              variant="ghost"
              onClick={clearRecording}
              aria-label="Delete recording"
              size="sm"
            >
              <FaTrash className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

