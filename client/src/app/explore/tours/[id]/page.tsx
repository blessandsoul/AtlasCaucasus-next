import type { Metadata } from 'next';
import { TourDetailsClient } from './TourDetailsClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${apiUrl}/tours/${params.id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        title: 'Tour Not Found',
      };
    }

    const result = await response.json();
    const tour = result.data;

    const description = tour.summary || `Book ${tour.title} - starting from ${tour.price} ${tour.currency}`;
    const imageUrl = tour.images?.[0]?.url || '/atlascaucasus.png';

    return {
      title: tour.title,
      description,
      openGraph: {
        title: tour.title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: tour.title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: tour.title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Tour Details',
    };
  }
}

export default function TourDetailsPage(): React.ReactElement {
  return <TourDetailsClient />;
}
