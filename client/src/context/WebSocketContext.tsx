'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { useAppSelector } from '@/store/hooks';
import { wsManager } from '@/lib/websocket/websocket.manager';
import type {
    ConnectionStatus,
    WebSocketMessage,
} from '@/lib/websocket/websocket.types';

interface WebSocketContextType {
    status: ConnectionStatus;
    connect: () => void;
    disconnect: () => void;
    send: (message: WebSocketMessage) => void;
    subscribe: (
        type: string,
        handler: (message: WebSocketMessage) => void
    ) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
    undefined
);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const { isAuthenticated, tokens } = useAppSelector((state) => state.auth);

    useEffect(() => {
        // Subscribe to status changes from the manager
        const unsubscribe = wsManager.onStatusChange(setStatus);
        return unsubscribe;
    }, []);

    useEffect(() => {
        // Auto-connect when authenticated
        if (isAuthenticated && tokens?.accessToken) {
            wsManager.connect();
        } else {
            wsManager.disconnect();
        }

        return () => {
            wsManager.disconnect();
        };
    }, [isAuthenticated, tokens?.accessToken]);

    const connect = useCallback(() => wsManager.connect(), []);
    const disconnect = useCallback(() => wsManager.disconnect(), []);
    const send = useCallback(
        (message: WebSocketMessage) => wsManager.send(message),
        []
    );
    const subscribe = useCallback(
        (type: string, handler: (message: WebSocketMessage) => void) =>
            wsManager.subscribe(type, handler),
        []
    );

    return (
        <WebSocketContext.Provider
            value={{ status, connect, disconnect, send, subscribe }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
