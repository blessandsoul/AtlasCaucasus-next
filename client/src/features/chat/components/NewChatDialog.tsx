'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCreateDirectChat } from '../hooks/useChats';
import type { Chat } from '../types/chat.types';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chat: Chat) => void;
}

export const NewChatDialog = ({
  open,
  onOpenChange,
  onChatCreated,
}: NewChatDialogProps) => {
  const { t } = useTranslation();
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const createChat = useCreateDirectChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      setError(t('chat.user_id_required', 'Please enter a user ID'));
      return;
    }

    try {
      const chat = await createChat.mutateAsync({ otherUserId: trimmedUserId });
      setUserId('');
      onOpenChange(false);
      onChatCreated(chat);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || t('chat.create_error', 'Failed to create chat');
      setError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[200]">
        <DialogHeader>
          <DialogTitle>{t('chat.new_chat_title', 'Start New Chat')}</DialogTitle>
          <DialogDescription className="sr-only">{t('chat.new_chat_title', 'Start New Chat')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">{t('chat.user_id', 'User ID')}</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={t('chat.user_id_placeholder', 'Enter user ID to chat with')}
              disabled={createChat.isPending}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createChat.isPending}
            >
              {t('chat.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={createChat.isPending}>
              {createChat.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('chat.creating', 'Creating...')}
                </>
              ) : (
                t('chat.start_chat', 'Start Chat')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
