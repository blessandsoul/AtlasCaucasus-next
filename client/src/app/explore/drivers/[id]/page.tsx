import type { Metadata } from 'next';
import { DriverDetailsClient } from './DriverDetailsClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${apiUrl}/drivers/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        title: 'Driver Not Found',
      };
    }

    const result = await response.json();
    const driver = result.data;

    const driverName = driver.user
      ? `${driver.user.firstName} ${driver.user.lastName}`
      : 'Professional Driver';

    const vehicleInfo = `${driver.vehicleMake} ${driver.vehicleModel}`;
    const description = driver.bio || `Hire ${driverName} - Professional driver with ${vehicleInfo}. ${driver.languages?.join(', ')}`;
    const imageUrl = driver.coverUrl || '/default-covers/driver-cover.jpg';

    return {
      title: `${driverName} - Driver (${vehicleInfo})`,
      description,
      openGraph: {
        title: `${driverName} - Driver`,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: driverName,
          },
        ],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${driverName} - Driver`,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Driver Details',
    };
  }
}

export default function DriverDetailsPage(): React.ReactElement {
  return <DriverDetailsClient />;
}
