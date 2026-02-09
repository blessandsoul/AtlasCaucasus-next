import type { Metadata } from 'next';
import { ExploreToursClient } from './ExploreToursClient';

export const metadata: Metadata = {
  title: 'Explore Tours in the Caucasus',
  description: 'Discover the best tours, experiences, and adventures in Georgia, Armenia, Azerbaijan, and Turkey. Book authentic tours with local guides.',
  keywords: ['Caucasus tours', 'Georgia tours', 'Armenia tours', 'Azerbaijan tours', 'Turkey tours', 'travel experiences', 'tour packages'],
};

export default function ExploreToursPage(): React.ReactElement {
  return <ExploreToursClient />;
}
