'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateDirectChat } from '../hooks/useChats';
import { selectChat } from '../store/chatSlice';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  otherUserId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  showIcon?: boolean;
}

export const ChatButton = ({
  otherUserId,
  className,
  variant = 'default',
  size = 'default',
  label = 'Chat',
  showIcon = true,
}: ChatButtonProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const createChat = useCreateDirectChat();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please log in to start a chat');
      router.push('/login');
      return;
    }

    // Check if trying to chat with themselves
    if (user?.id === otherUserId) {
      toast.error("You can't chat with yourself");
      return;
    }

    setIsLoading(true);

    try {
      const chat = await createChat.mutateAsync({ otherUserId });
      dispatch(selectChat(chat.id));
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, otherUserId, createChat, dispatch, router]);

  const isDisabled = isLoading || createChat.isPending;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn('gap-2', className)}
    >
      {isDisabled ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : showIcon ? (
        <MessageCircle className="w-4 h-4" />
      ) : null}
      {label}
    </Button>
  );
};
