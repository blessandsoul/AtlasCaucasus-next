// Get the API base URL without the /api/v1 suffix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '');

// Paths that should be served by Next.js from the public folder (not the backend)
const NEXTJS_PUBLIC_PATHS = ['/seed-assets/', '/hero-backgrounds/'];

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

    // Check if this is a Next.js public folder path (served by frontend, not backend)
    const isNextjsPublicPath = NEXTJS_PUBLIC_PATHS.some(path => url.startsWith(path));
    if (isNextjsPublicPath) {
        // Return as-is for Next.js to serve from public folder
        return url;
    }

    // Convert relative URL to absolute (for backend-served uploads)
    return `${SERVER_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
