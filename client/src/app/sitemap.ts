import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore/tours`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore/guides`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore/drivers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Fetch active tours
    const toursResponse = await fetch(`${apiUrl}/tours?limit=1000`, {
      cache: 'no-store',
    });
    const toursData = await toursResponse.json();
    const tours: MetadataRoute.Sitemap = (toursData.data?.items || []).map((tour: { id: string; updatedAt: string }) => ({
      url: `${baseUrl}/explore/tours/${tour.id}`,
      lastModified: new Date(tour.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Fetch active guides
    const guidesResponse = await fetch(`${apiUrl}/guides?limit=1000`, {
      cache: 'no-store',
    });
    const guidesData = await guidesResponse.json();
    const guides: MetadataRoute.Sitemap = (guidesData.data?.items || []).map((guide: { id: string; updatedAt: string }) => ({
      url: `${baseUrl}/explore/guides/${guide.id}`,
      lastModified: new Date(guide.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Fetch active drivers
    const driversResponse = await fetch(`${apiUrl}/drivers?limit=1000`, {
      cache: 'no-store',
    });
    const driversData = await driversResponse.json();
    const drivers: MetadataRoute.Sitemap = (driversData.data?.items || []).map((driver: { id: string; updatedAt: string }) => ({
      url: `${baseUrl}/explore/drivers/${driver.id}`,
      lastModified: new Date(driver.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Fetch active companies
    const companiesResponse = await fetch(`${apiUrl}/companies?limit=1000`, {
      cache: 'no-store',
    });
    const companiesData = await companiesResponse.json();
    const companies: MetadataRoute.Sitemap = (companiesData.data?.items || []).map((company: { id: string; updatedAt: string }) => ({
      url: `${baseUrl}/explore/companies/${company.id}`,
      lastModified: new Date(company.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...tours, ...guides, ...drivers, ...companies];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if API fetch fails
    return staticPages;
  }
}
