// Get the API base URL without the /api/v1 suffix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '');

/**
 * Convert a relative media URL to an absolute URL
 * @param url - Relative URL from the API (e.g., "/uploads/tours/image.jpg")
 * @returns Absolute URL (e.g., "http://localhost:3000/uploads/tours/image.jpg")
 */
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) {
        return 'https://placehold.co/800x600?text=No+Image';
    }

    // If already absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Convert relative URL to absolute
    return `${SERVER_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
