import type { Metadata } from 'next';
import { GuideDetailsClient } from './GuideDetailsClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // Use internal API URL for server-side fetches (SSR runs on the server, not the browser)
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${apiUrl}/guides/${params.id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        title: 'Guide Not Found',
      };
    }

    const result = await response.json();
    const guide = result.data;

    const guideName = guide.user
      ? `${guide.user.firstName} ${guide.user.lastName}`
      : 'Tour Guide';

    const description = guide.bio || `Hire ${guideName} - Professional tour guide in the Caucasus. ${guide.languages?.join(', ')}`;
    const imageUrl = guide.coverUrl || '/default-covers/guide-cover.jpg';

    return {
      title: `${guideName} - Tour Guide`,
      description,
      openGraph: {
        title: `${guideName} - Tour Guide`,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: guideName,
          },
        ],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${guideName} - Tour Guide`,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Guide Details',
    };
  }
}

export default function GuideDetailsPage(): React.ReactElement {
  return <GuideDetailsClient />;
}
