import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ReceivedBookingsPage } from '@/features/bookings/components/ReceivedBookingsPage';

export default function ReceivedBookingsRoute(): React.ReactNode {
    return (
        <ErrorBoundary>
            <ReceivedBookingsPage />
        </ErrorBoundary>
    );
}
