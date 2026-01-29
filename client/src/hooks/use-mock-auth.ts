export const useMockAuth = () => {
    return {
        isAuthenticated: false,
        user: {
            firstName: 'User',
            lastName: 'Name',
            email: 'user@example.com',
            roles: [] as string[],
        } as any, // Cast to any or define proper user type
        logout: () => console.log('Mock logout'),
    };
};
