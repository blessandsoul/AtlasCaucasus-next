import type { Metadata } from 'next';
import { ExploreDriversClient } from './ExploreDriversClient';

export const metadata: Metadata = {
  title: 'Explore Drivers in the Caucasus',
  description: 'Find professional drivers in Georgia, Armenia, Azerbaijan, and Turkey. Browse verified drivers with safe vehicles for your travel needs.',
  keywords: ['drivers', 'Caucasus drivers', 'Georgia drivers', 'professional drivers', 'car rental with driver', 'chauffeur service'],
};

export default function ExploreDriversPage(): React.ReactElement {
  return <ExploreDriversClient />;
}
