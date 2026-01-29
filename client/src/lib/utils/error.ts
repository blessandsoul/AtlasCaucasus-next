import axios from 'axios';

export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        if (apiError?.error?.message) {
            return apiError.error.message;
        }
        if (error.code === 'ERR_NETWORK') {
            return 'Network error. Check your connection.';
        }
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred';
};

export const getErrorCode = (error: unknown): string | undefined => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.error?.code;
    }
    return undefined;
};

export const isErrorCode = (error: unknown, code: string): boolean => {
    return getErrorCode(error) === code;
};
