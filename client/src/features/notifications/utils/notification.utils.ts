import type { INotification, IGroupedNotification } from '../types/notification.types';

export const groupNotifications = (notifications: INotification[]): IGroupedNotification[] => {
    const groups: Record<string, IGroupedNotification> = {};
    const result: IGroupedNotification[] = [];

    notifications.forEach((notification) => {
        // Group only CHAT_MESSAGE types that have a chatId
        // We assume the list is sorted by date (newest first).
        const shouldGroup =
            notification.type === 'CHAT_MESSAGE' &&
            !!notification.data?.chatId;

        const groupKey = shouldGroup
            ? `CHAT_${notification.data!.chatId}`
            : `SINGLE_${notification.id}`;

        if (shouldGroup && groups[groupKey]) {
            // Add to existing group (found a newer one earlier)
            const group = groups[groupKey];
            group.count += 1;
            group.childIds.push(notification.id);

            // If the current one is unread, ensure the group is marked unread
            if (!notification.isRead && group.isRead) {
                group.isRead = false;
            }
        } else if (shouldGroup) {
            // New group (this is the head)
            groups[groupKey] = {
                ...notification,
                count: 1,
                childIds: [notification.id],
            };
            result.push(groups[groupKey]);
        } else {
            // Not grouped
            result.push({
                ...notification,
                count: 1,
                childIds: [notification.id],
            });
        }
    });

    return result;
};
