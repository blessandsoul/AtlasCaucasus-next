'use client';

import { useWebSocket } from '@/context/WebSocketContext';

export const useConnectionStatus = () => {
    const { status, connect, disconnect } = useWebSocket();

    return {
        status,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        isDisconnected: status === 'disconnected',
        isError: status === 'error',
        connect,
        disconnect,
    };
};
