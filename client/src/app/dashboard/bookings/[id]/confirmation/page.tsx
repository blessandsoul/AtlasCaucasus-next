import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { BookingConfirmation } from '@/features/bookings/components/BookingConfirmation';

export default function BookingConfirmationRoute(): React.ReactNode {
    return (
        <ErrorBoundary>
            <BookingConfirmation />
        </ErrorBoundary>
    );
}
