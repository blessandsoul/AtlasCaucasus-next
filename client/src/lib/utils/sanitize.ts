export const sanitizeString = (input: string): string => {
    return input.trim().replace(/[<>]/g, '').slice(0, 1000);
};

export const sanitizeEmail = (email: string): string => {
    return email.toLowerCase().trim().slice(0, 255);
};

export const sanitizeFileName = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 255);
};

export const isSafeUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
    } catch {
        return false;
    }
};

export const maskEmail = (email: string): string => {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

export const maskPhone = (phone: string): string => {
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
};
