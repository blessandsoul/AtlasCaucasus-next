'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatList } from '@/features/chat/components/ChatList';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { NewChatDialog } from '@/features/chat/components/NewChatDialog';
import { useChat } from '@/features/chat/hooks/useChats';
import type { Chat } from '@/features/chat/types/chat.types';

// Inner component that uses useSearchParams
function ChatsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = searchParams.get('chatId');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  // Fetch chat details if chatId is in URL
  const { data: chatFromUrl } = useChat(chatId || null);

  // Update selected chat when URL changes
  useEffect(() => {
    if (chatFromUrl) {
      setSelectedChat(chatFromUrl);
    }
  }, [chatFromUrl]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    router.push(`/chats?chatId=${chat.id}`);
  };

  const handleChatCreated = (chat: Chat) => {
    setSelectedChat(chat);
    router.push(`/chats?chatId=${chat.id}`);
  };

  return (
    <div className="container mx-auto px-4 pt-28 pb-6">
      <div className="h-[calc(100vh-10rem)]">
        <div className="flex h-full border border-border rounded-lg overflow-hidden">
          {/* Chat List Sidebar */}
          <div className="w-80 border-r border-border flex flex-col bg-background">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h1 className="font-semibold">Messages</h1>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewChatDialog(true)}
              >
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            </div>
            <ChatList
              selectedChatId={selectedChat?.id}
              onSelectChat={handleSelectChat}
            />
          </div>

          {/* Chat Window */}
          <div className="flex-1 bg-background">
            {selectedChat ? (
              <ChatWindow chat={selectedChat} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Chat Dialog */}
        <NewChatDialog
          open={showNewChatDialog}
          onOpenChange={setShowNewChatDialog}
          onChatCreated={handleChatCreated}
        />
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function ChatsLoading() {
  return (
    <div className="container mx-auto px-4 pt-28 pb-6">
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

// Main page component wrapped in Suspense for useSearchParams
export default function ChatsPage() {
  return (
    <Suspense fallback={<ChatsLoading />}>
      <ChatsContent />
    </Suspense>
  );
}
