'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/lib/constants/routes';
import { CreateAgentForm } from '@/features/companies/components/CreateAgentForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect } from 'react';

export default function CreateAgentPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
    } else if (!user?.roles?.includes('COMPANY')) {
      router.push(ROUTES.HOME);
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user?.roles?.includes('COMPANY')) {
    return null;
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('auth.create_agent', 'Create Agent')}</h2>
        <p className="text-muted-foreground">
          {t('auth.create_agent_desc', 'Create a new tour agent account for your company')}
        </p>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{t('auth.create_agent', 'Create Agent')}</CardTitle>
              <CardDescription>
                {t('auth.create_agent_form_desc', 'Fill in the details to create a new tour agent')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CreateAgentForm />
        </CardContent>
      </Card>
    </div>
  );
}
