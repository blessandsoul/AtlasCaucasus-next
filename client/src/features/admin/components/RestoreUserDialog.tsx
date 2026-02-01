'use client';

import { useTranslation } from 'react-i18next';
import { RotateCcw, Loader2 } from 'lucide-react';
import { useRestoreUser } from '../hooks/useAuditLogs';
import type { IUser } from '@/features/auth/types/auth.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RestoreUserDialogProps {
  user: IUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RestoreUserDialog = ({
  user,
  open,
  onOpenChange,
}: RestoreUserDialogProps) => {
  const { t } = useTranslation();
  const restoreMutation = useRestoreUser();

  const handleRestore = async () => {
    if (!user) return;

    await restoreMutation.mutateAsync(user.id);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-600" />
            {t('admin.users.restore_title', 'Restore User')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'admin.users.restore_description',
              'Are you sure you want to restore the user "{{name}}"? This will reactivate their account and they will be able to log in again.',
              { name: `${user.firstName} ${user.lastName}` }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={restoreMutation.isPending}>
            {t('common.cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRestore}
            disabled={restoreMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {restoreMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('admin.users.restoring', 'Restoring...')}
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('admin.users.restore', 'Restore')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
