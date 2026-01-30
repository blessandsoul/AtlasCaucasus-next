export const APP_NAME = 'Tourism Georgia';

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
} as const;

export const USER_ROLES = {
    USER: 'USER',
    COMPANY: 'COMPANY',
    ADMIN: 'ADMIN',
    TOUR_AGENT: 'TOUR_AGENT',
    GUIDE: 'GUIDE',
    DRIVER: 'DRIVER',
} as const;

export const CURRENCIES = {
    GEL: 'GEL',
    USD: 'USD',
    EUR: 'EUR',
} as const;
