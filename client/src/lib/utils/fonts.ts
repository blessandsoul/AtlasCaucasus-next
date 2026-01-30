/**
 * Font utility classes for consistent typography across the application
 *
 * Usage:
 * import { fontClasses } from '@/lib/utils/fonts';
 * <div className={fontClasses.h1}>Heading</div>
 */

export const fontClasses = {
    // Font families
    body: 'font-sans',
    heading: 'font-heading',
    mono: 'font-mono',
    serif: 'font-serif',

    // Font weights
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',

    // Common heading combinations
    h1: 'font-heading font-bold text-4xl md:text-5xl',
    h2: 'font-heading font-semibold text-3xl md:text-4xl',
    h3: 'font-heading font-semibold text-2xl md:text-3xl',
    h4: 'font-heading font-semibold text-xl md:text-2xl',
    h5: 'font-heading font-medium text-lg md:text-xl',
    h6: 'font-heading font-medium text-base md:text-lg',

    // Common text combinations
    bodyText: 'font-sans font-normal text-base',
    bodyLarge: 'font-sans font-normal text-lg',
    bodySmall: 'font-sans font-normal text-sm',
    caption: 'font-sans font-normal text-xs text-muted-foreground',

    // Button text
    button: 'font-sans font-medium',
    buttonLarge: 'font-sans font-semibold text-lg',

    // Special text
    label: 'font-sans font-medium text-sm',
    code: 'font-mono text-sm',
} as const;

/**
 * Get font class by weight
 */
export const getFontWeight = (weight: 300 | 400 | 500 | 600 | 700 | 800): string => {
    const weightMap = {
        300: 'font-light',
        400: 'font-normal',
        500: 'font-medium',
        600: 'font-semibold',
        700: 'font-bold',
        800: 'font-extrabold',
    };
    return weightMap[weight];
};
