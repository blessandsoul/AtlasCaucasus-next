'use client';

import { useTranslation } from 'react-i18next';
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
import { useDeleteUser } from '@/features/users/hooks/useDeleteUser';
import type { IUser } from '@/features/auth/types/auth.types';

interface DeleteUserDialogProps {
    user: IUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DeleteUserDialog = ({ user, open, onOpenChange }: DeleteUserDialogProps) => {
    const { t } = useTranslation();
    const { mutate: deleteUser, isPending } = useDeleteUser();

    const handleDelete = () => {
        if (!user) return;

        deleteUser(user.id, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('admin.users.deleteUser', 'Delete User')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            'admin.users.deleteConfirm',
                            'Are you sure you want to delete {{name}}? This action cannot be undone.',
                            { name: user ? `${user.firstName} ${user.lastName}` : '' }
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                        {t('common.cancel', 'Cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
