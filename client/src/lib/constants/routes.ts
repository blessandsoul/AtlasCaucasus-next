export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  TOURS: {
    LIST: '/tours',
    DETAILS: (id: string) => `/tours/${id}`,
    MY_TOURS: '/my-tours',
    CREATE: '/tours/create',
    EDIT: (id: string) => `/tours/${id}/edit`,
  },
  COMPANIES: {
    LIST: '/companies',
    DETAILS: (id: string) => `/companies/${id}`,
  },
  GUIDES: {
    LIST: '/guides',
    DETAILS: (id: string) => `/guides/${id}`,
  },
  DRIVERS: {
    LIST: '/drivers',
    DETAILS: (id: string) => `/drivers/${id}`,
  },
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    LOCATIONS: '/admin/locations',
  },
} as const;
