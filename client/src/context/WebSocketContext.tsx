export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const useWebSocket = () => {
    return {
        subscribe: () => () => { },
    }
}
