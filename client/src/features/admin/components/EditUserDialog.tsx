'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useUpdateUser } from '@/features/users/hooks/useUpdateUser';
import { useUpdateUserRole } from '@/features/users/hooks/useUpdateUserRole';
import { useRemoveUserRole } from '@/features/users/hooks/useRemoveUserRole';
import type { IUser, UserRole } from '@/features/auth/types/auth.types';

interface EditUserDialogProps {
    user: IUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ALL_ROLES: UserRole[] = ['USER', 'COMPANY', 'ADMIN', 'TOUR_AGENT', 'GUIDE', 'DRIVER'];

export const EditUserDialog = ({ user, open, onOpenChange }: EditUserDialogProps) => {
    const { t } = useTranslation();
    const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
    const { mutateAsync: updateRole, isPending: isAddingRole } = useUpdateUserRole();
    const { mutateAsync: removeRole, isPending: isRemovingRole } = useRemoveUserRole();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [currentRoles, setCurrentRoles] = useState<UserRole[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');

    const isPending = isUpdating || isAddingRole || isRemovingRole;

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setEmail(user.email);
            setIsActive(user.isActive);
            setCurrentRoles([...user.roles]);
        }
    }, [user]);

    const handleAddRole = () => {
        if (selectedRole && !currentRoles.includes(selectedRole as UserRole)) {
            setCurrentRoles([...currentRoles, selectedRole as UserRole]);
            setSelectedRole('');
        }
    };

    const handleRemoveRole = (role: UserRole) => {
        setCurrentRoles(currentRoles.filter((r) => r !== role));
    };

    const handleSubmit = async () => {
        if (!user) return;

        try {
            // Update profile fields
            await updateUser({
                userId: user.id,
                data: { firstName, lastName, email, isActive },
            });

            // Calculate role changes
            const originalRoles = new Set(user.roles);
            const newRoles = new Set(currentRoles);

            const rolesToAdd = currentRoles.filter((r) => !originalRoles.has(r));
            const rolesToRemove = user.roles.filter((r) => !newRoles.has(r));

            // Add new roles
            await Promise.all(
                rolesToAdd.map((role) => updateRole({ userId: user.id, role }))
            );

            // Remove roles
            await Promise.all(
                rolesToRemove.map((role) => removeRole({ userId: user.id, role }))
            );

            onOpenChange(false);
        } catch (error) {
            // Errors are handled by the hooks
        }
    };

    const availableRoles = ALL_ROLES.filter((role) => !currentRoles.includes(role));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('admin.users.editUser')}</DialogTitle>
                    <DialogDescription className="sr-only">{t('admin.users.editUser')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{t('common.firstName')}</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">{t('common.lastName')}</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">{t('common.email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isActive"
                            checked={isActive}
                            onCheckedChange={(checked) => setIsActive(checked as boolean)}
                        />
                        <Label htmlFor="isActive">{t('admin.users.isActive')}</Label>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('admin.users.roles')}</Label>
                        <div className="flex flex-wrap gap-2">
                            {currentRoles.map((role) => (
                                <Badge key={role} variant="secondary" className="gap-1">
                                    {role}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRole(role)}
                                        className="ml-1 hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {availableRoles.length > 0 && (
                        <div className="flex gap-2">
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={t('admin.users.selectRole')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddRole}
                                disabled={!selectedRole}
                            >
                                {t('admin.users.addRole')}
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? t('common.saving') : t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
