'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace(ROUTES.ADMIN.USERS);
    }, [router]);

    return null;
}
