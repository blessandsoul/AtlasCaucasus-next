'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useUpdateUserRole } from '@/features/users/hooks/useUpdateUserRole';
import type { IUser, UserRole } from '@/features/auth/types/auth.types';

interface UpdateRoleDialogProps {
    user: IUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ALL_ROLES: UserRole[] = ['USER', 'COMPANY', 'ADMIN', 'TOUR_AGENT', 'GUIDE', 'DRIVER'];

export const UpdateRoleDialog = ({ user, open, onOpenChange }: UpdateRoleDialogProps) => {
    const { t } = useTranslation();
    const { mutate: updateRole, isPending } = useUpdateUserRole();
    const [selectedRole, setSelectedRole] = useState<string>('');

    const handleSubmit = () => {
        if (!user || !selectedRole) return;

        updateRole(
            { userId: user.id, role: selectedRole },
            {
                onSuccess: () => {
                    setSelectedRole('');
                    onOpenChange(false);
                },
            }
        );
    };

    const availableRoles = ALL_ROLES.filter((role) => !user?.roles.includes(role));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{t('admin.users.addRole', 'Add Role')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        {t('admin.users.currentRoles', 'Current roles')}: {user?.roles.join(', ')}
                    </div>

                    <div className="space-y-2">
                        <Label>{t('admin.users.selectNewRole', 'Select new role')}</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('admin.users.selectRole', 'Select a role')} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending || !selectedRole}>
                        {isPending ? t('common.adding', 'Adding...') : t('common.add', 'Add')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
