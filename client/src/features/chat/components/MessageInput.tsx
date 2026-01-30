'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  isSending?: boolean;
}

export const MessageInput = ({
  onSend,
  onTyping,
  onStopTyping,
  disabled,
  isSending,
}: MessageInputProps) => {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);

      // Send typing indicator
      if (onTyping) {
        onTyping();
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        if (onStopTyping) {
          onStopTyping();
        }
      }, 2000);
    },
    [onTyping, onStopTyping]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedContent = content.trim();
      if (!trimmedContent || disabled || isSending) return;

      onSend(trimmedContent);
      setContent('');

      // Clear typing timeout and send stop typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (onStopTyping) {
        onStopTyping();
      }
    },
    [content, disabled, isSending, onSend, onStopTyping]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled || isSending}
          rows={1}
          className="min-h-10 max-h-32 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || disabled || isSending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
