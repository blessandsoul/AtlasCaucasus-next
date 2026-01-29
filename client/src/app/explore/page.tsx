import { redirect } from 'next/navigation';

/**
 * Redirect /explore to /explore/tours by default
 */
export default function ExplorePage() {
    redirect('/explore/tours');
}
