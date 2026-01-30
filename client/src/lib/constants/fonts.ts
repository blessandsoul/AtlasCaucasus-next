export const FONTS = {
    primary: {
        name: 'Outfit',
        weights: [300, 400, 500, 600, 700],
        googleUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
    },
    secondary: {
        name: 'Inter',
        weights: [400, 600, 700],
        googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    },
    mono: {
        name: 'JetBrains Mono',
        weights: [400, 500, 700],
        googleUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
    },
} as const;

export const FONT_WEIGHTS = {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
} as const;
