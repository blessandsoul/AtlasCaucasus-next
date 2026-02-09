export const formatCurrency = (amount: number, currency = 'GEL'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatDate = (date: string | Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
};

export const formatRelativeTime = (date: string | Date): string => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = (then.getTime() - now.getTime()) / 1000;

    const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
        { unit: 'year', seconds: 31536000 },
        { unit: 'month', seconds: 2592000 },
        { unit: 'day', seconds: 86400 },
        { unit: 'hour', seconds: 3600 },
        { unit: 'minute', seconds: 60 },
    ];

    for (const { unit, seconds } of units) {
        if (Math.abs(diffInSeconds) >= seconds) {
            return rtf.format(Math.round(diffInSeconds / seconds), unit);
        }
    }
    return rtf.format(Math.round(diffInSeconds), 'second');
};

export const truncate = (str: string, length: number): string => {
    return str.length > length ? `${str.substring(0, length)}...` : str;
};

/**
 * Format response time in minutes to a human-readable label.
 * Returns { label, variant } where variant indicates urgency color.
 */
export const formatResponseTime = (
    minutes: number | null | undefined
): { label: string; variant: 'success' | 'warning' | 'muted' } | null => {
    if (minutes === null || minutes === undefined) return null;

    if (minutes < 60) {
        return { label: `< 1 hour`, variant: 'success' };
    }
    if (minutes < 180) {
        return { label: `< 3 hours`, variant: 'success' };
    }
    if (minutes < 1440) {
        const hours = Math.round(minutes / 60);
        return { label: `< ${hours} hours`, variant: 'warning' };
    }
    const days = Math.round(minutes / 1440);
    return { label: `~ ${days} day${days > 1 ? 's' : ''}`, variant: 'muted' };
};
