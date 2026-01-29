export interface UserPresence {
    userId: string;
    isOnline: boolean;
    lastSeen: Date;
}

export interface OnlineUser {
    userId: string;
    connectionId: string;
    connectedAt: Date;
}
