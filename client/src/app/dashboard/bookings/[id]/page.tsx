import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { BookingDetailPage } from '@/features/bookings/components/BookingDetailPage';

export default function BookingDetailRoute(): React.ReactNode {
    return (
        <ErrorBoundary>
            <BookingDetailPage />
        </ErrorBoundary>
    );
}
