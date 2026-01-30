// User presence from REST API
export interface IUserPresence {
    userId: string;
    isOnline: boolean;
    lastSeen: string; // ISO date string
}

// Online users response from GET /presence/online/all
export interface IOnlineUsersResponse {
    userIds: string[];
    count: number;
}

// Connection stats response from GET /presence/stats
export interface IConnectionStats {
    totalConnections: number;
    uniqueUsers: number;
    connectedUserIds: string[];
}

// Request type for POST /presence/multiple
export interface IMultiplePresenceRequest {
    userIds: string[];
}
