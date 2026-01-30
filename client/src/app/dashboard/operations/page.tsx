import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

export default function OperationsPage() {
    redirect(ROUTES.OPERATIONS.AGENTS);
}
