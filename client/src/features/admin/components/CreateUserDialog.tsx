'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateUser } from '../hooks/useCreateUser';
import type { UserRole } from '@/features/auth/types/auth.types';

const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    role: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ROLES: UserRole[] = ['USER', 'COMPANY', 'ADMIN', 'TOUR_AGENT', 'GUIDE', 'DRIVER'];

export const CreateUserDialog = ({ open, onOpenChange }: CreateUserDialogProps) => {
    const { t } = useTranslation();
    const { mutate: createUser, isPending } = useCreateUser();

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
    });

    const onSubmit = (data: CreateUserFormData) => {
        createUser({
            ...data,
            role: data.role as UserRole | undefined,
        }, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('admin.users.createUser')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('common.email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="user@example.com"
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">{t('common.password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password')}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{t('common.firstName')}</Label>
                            <Input
                                id="firstName"
                                {...register('firstName')}
                                placeholder="John"
                            />
                            {errors.firstName && (
                                <p className="text-sm text-destructive">{errors.firstName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">{t('common.lastName')}</Label>
                            <Input
                                id="lastName"
                                {...register('lastName')}
                                placeholder="Doe"
                            />
                            {errors.lastName && (
                                <p className="text-sm text-destructive">{errors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">{t('common.role')} ({t('common.optional')})</Label>
                        <Select onValueChange={(value) => setValue('role', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('admin.users.selectRole')} />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? t('common.creating') : t('common.create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
