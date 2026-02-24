'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, MessageSquarePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { NewChatDialog } from './NewChatDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Chat } from '../types/chat.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeDrawer, selectChat, clearSelectedChat } from '../store/chatSlice';
import { useChat } from '../hooks/useChats';

export const ChatDrawer = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const dispatch = useAppDispatch();
    const { isDrawerOpen, selectedChatId } = useAppSelector((state) => state.chat);
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Fetch details if we have an ID (direct link or selection)
    const { data: chatData } = useChat(selectedChatId);

    // Handle client-side mounting for portal
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isAuthenticated && isDrawerOpen) {
            dispatch(closeDrawer());
        }
    }, [isAuthenticated, isDrawerOpen, dispatch]);

    const handleSelectChat = (chat: Chat) => {
        dispatch(selectChat(chat.id));
    };

    const handleBackToList = () => {
        dispatch(clearSelectedChat());
    };

    const handleChatCreated = (chat: Chat) => {
        dispatch(selectChat(chat.id));
        setShowNewChatDialog(false);
    };

    const handleClose = () => {
        dispatch(closeDrawer());
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-y-0 right-0 z-[101] w-full sm:w-[500px] bg-background shadow-xl border-l border-border flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            {selectedChatId ? (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={handleBackToList}>
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <h2 className="font-semibold">{t('chat.detail_title', 'Chat')}</h2>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h2 className="font-semibold text-lg">{t('chat.drawer_title', 'Messages')}</h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="ml-2"
                                        onClick={() => setShowNewChatDialog(true)}
                                    >
                                        <MessageSquarePlus className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                            <Button variant="ghost" size="icon" onClick={handleClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden relative">
                            {selectedChatId ? (
                                chatData ? (
                                    <ChatWindow chat={chatData} />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        {t('chat.loading', 'Loading...')}
                                    </div>
                                )
                            ) : (
                                <ChatList
                                    selectedChatId={selectedChatId || undefined}
                                    onSelectChat={handleSelectChat}
                                />
                            )}
                        </div>

                        {/* New Chat Dialog */}
                        <NewChatDialog
                            open={showNewChatDialog}
                            onOpenChange={setShowNewChatDialog}
                            onChatCreated={handleChatCreated}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
