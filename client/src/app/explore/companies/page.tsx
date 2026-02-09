import type { Metadata } from 'next';
import { ExploreCompaniesClient } from './ExploreCompaniesClient';

export const metadata: Metadata = {
  title: 'Explore Tour Companies in the Caucasus',
  description: 'Discover verified tour companies in Georgia, Armenia, Azerbaijan, and Turkey. Browse professional tour operators with authentic experiences.',
  keywords: ['tour companies', 'Caucasus tour operators', 'Georgia tour companies', 'travel agencies', 'tour operators', 'tourism companies'],
};

export default function ExploreCompaniesPage(): React.ReactElement {
  return <ExploreCompaniesClient />;
}
