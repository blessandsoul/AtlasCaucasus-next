import type { Metadata } from 'next';
import { CompanyDetailsClient } from './CompanyDetailsClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${apiUrl}/companies/${params.id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        title: 'Company Not Found',
      };
    }

    const result = await response.json();
    const company = result.data;

    const description = company.description || `${company.companyName} - Professional tour operator in the Caucasus region.`;
    const imageUrl = company.coverUrl || company.logoUrl || '/default-covers/company-cover.jpg';

    return {
      title: `${company.companyName} - Tour Company`,
      description,
      openGraph: {
        title: company.companyName,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: company.companyName,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: company.companyName,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Company Details',
    };
  }
}

export default function CompanyDetailsPage(): React.ReactElement {
  return <CompanyDetailsClient />;
}
