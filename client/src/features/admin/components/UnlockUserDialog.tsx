'use client';

import { useTranslation } from 'react-i18next';
import { Unlock, Loader2 } from 'lucide-react';
import { useUnlockUser } from '@/features/users/hooks/useUnlockUser';
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

interface UnlockUserDialogProps {
  user: IUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UnlockUserDialog = ({
  user,
  open,
  onOpenChange,
}: UnlockUserDialogProps) => {
  const { t } = useTranslation();
  const unlockMutation = useUnlockUser();

  const handleUnlock = async () => {
    if (!user) return;

    await unlockMutation.mutateAsync(user.id);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-amber-600" />
            {t('admin.users.unlock_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'admin.users.unlock_description',
              { name: `${user.firstName} ${user.lastName}` }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={unlockMutation.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnlock}
            disabled={unlockMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {unlockMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('admin.users.unlocking')}
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                {t('admin.users.unlock')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
