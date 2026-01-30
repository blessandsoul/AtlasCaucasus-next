/**
 * SEO Utilities for Image Alt Text Generation
 *
 * Generates descriptive, keyword-rich alt text for images to improve:
 * - Google Image Search ranking
 * - Accessibility for screen readers
 * - Image context when image fails to load
 */

interface SafeMedia {
    filename?: string;
    originalName?: string;
}

/**
 * Generate alt text for tour images
 * @param tourTitle - Tour title
 * @param tourCity - Tour city/location
 * @param tourCategory - Tour category (e.g., "adventure", "cultural")
 * @param imageIndex - Index of image in gallery (0-based)
 * @param totalImages - Total number of images
 * @returns SEO-optimized alt text
 */
export function generateTourImageAlt(
    tourTitle: string,
    tourCity?: string | null,
    tourCategory?: string | null,
    imageIndex: number = 0,
    totalImages: number = 1
): string {
    const location = tourCity || 'Georgia';
    const category = tourCategory || 'tour';

    // For single image
    if (totalImages === 1) {
        return `${location} ${category} - ${tourTitle}`;
    }

    // For image gallery
    const position = imageIndex + 1;
    return `${location} ${category} - ${tourTitle} (image ${position} of ${totalImages})`;
}

/**
 * Generate alt text for company logos
 * @param companyName - Company name
 * @returns SEO-optimized alt text
 */
export function generateCompanyLogoAlt(companyName: string): string {
    return `${companyName} logo`;
}

/**
 * Generate alt text for guide photos
 * @param guideName - Guide full name
 * @param photoType - Type of photo (e.g., "profile", "action", "portrait")
 * @returns SEO-optimized alt text
 */
export function generateGuidePhotoAlt(
    guideName: string,
    photoType: string = 'profile'
): string {
    return `${guideName} - Guide ${photoType} photo`;
}

/**
 * Generate alt text for driver photos
 * @param driverName - Driver full name
 * @param photoType - Type of photo (e.g., "profile", "vehicle")
 * @returns SEO-optimized alt text
 */
export function generateDriverPhotoAlt(
    driverName: string,
    photoType: string = 'profile'
): string {
    if (photoType === 'vehicle') {
        return `${driverName} - Driver vehicle photo`;
    }
    return `${driverName} - Driver ${photoType} photo`;
}

/**
 * Generate alt text for user avatars
 * @param userName - User full name
 * @returns SEO-optimized alt text
 */
export function generateUserAvatarAlt(userName: string): string {
    return `${userName} avatar`;
}

/**
 * Extract descriptive keywords from media filename
 * Useful for generating dynamic alt text when entity data is not available
 * @param media - Media object with filename
 * @returns Array of descriptive keywords
 */
export function extractKeywordsFromFilename(media: SafeMedia): string[] {
    // Pattern: {entity-slug}-{uuid}-{descriptive-name}.{ext}
    // Example: "kazbegi-tour-abc123-mountain-view.jpg"

    const filename = media.filename || '';
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, ''); // Remove extension

    // Split by UUID pattern (8 alphanumeric chars)
    const parts = nameWithoutExt.split(/-[a-f0-9]{8}-/i);

    if (parts.length >= 2) {
        // Extract entity slug and descriptive name
        const entitySlug = parts[0]; // "kazbegi-tour"
        const descriptiveName = parts[1]; // "mountain-view"

        // Combine and split into keywords
        const allKeywords = `${entitySlug} ${descriptiveName}`
            .split('-')
            .filter((word) => word.length > 2) // Filter short words
            .filter(
                (word) =>
                    !['tour', 'company', 'guide', 'driver', 'user', 'image', 'photo', 'logo', 'avatar'].includes(word)
            ); // Filter generic terms

        return allKeywords;
    }

    // Fallback: split filename by hyphens
    return filename.split('-').filter((word) => word.length > 2);
}

/**
 * Generate generic alt text from media filename when entity data unavailable
 * @param media - Media object
 * @param entityType - Type of entity (optional)
 * @returns Alt text derived from filename
 */
export function generateAltFromFilename(
    media: SafeMedia,
    entityType?: 'tour' | 'company' | 'guide' | 'driver' | 'user'
): string {
    const keywords = extractKeywordsFromFilename(media);

    if (keywords.length > 0) {
        const description = keywords.join(' ');

        if (entityType) {
            const entityLabel = {
                tour: 'tour image',
                company: 'company logo',
                guide: 'guide photo',
                driver: 'driver photo',
                user: 'user avatar',
            }[entityType];

            return `${description} - ${entityLabel}`;
        }

        return description;
    }

    // Ultimate fallback
    return media.originalName || 'Image';
}

/**
 * Format location name for alt text (capitalize properly)
 * @param location - Location string
 * @returns Properly capitalized location
 */
export function formatLocationForAlt(location: string): string {
    return location
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
