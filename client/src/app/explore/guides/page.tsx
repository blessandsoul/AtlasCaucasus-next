import type { Metadata } from 'next';
import { ExploreGuidesClient } from './ExploreGuidesClient';

export const metadata: Metadata = {
  title: 'Explore Tour Guides in the Caucasus',
  description: 'Find professional tour guides in Georgia, Armenia, Azerbaijan, and Turkey. Browse experienced local guides with verified credentials and reviews.',
  keywords: ['tour guides', 'Caucasus guides', 'Georgia guides', 'local guides', 'professional tour guides', 'travel guides'],
};

export default function ExploreGuidesPage(): React.ReactElement {
  return <ExploreGuidesClient />;
}
