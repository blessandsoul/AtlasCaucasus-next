import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'Learn about AtlasCaucasus - your gateway to authentic travel experiences in the Caucasus region. Connecting travelers with local guides, tours, and unforgettable adventures.',
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
