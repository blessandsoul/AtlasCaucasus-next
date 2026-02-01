'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Loader2 } from 'lucide-react';
import type { IUser } from '@/features/auth/types/auth.types';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { AvatarUpload } from './AvatarUpload';

const profileSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileGeneralProps {
    user: IUser;
}

export const ProfileGeneral = ({ user }: ProfileGeneralProps) => {
    const { t } = useTranslation();
    const { mutate: updateProfile, isPending } = useUpdateProfile();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber || '',
        },
    });

    const onSubmit = (data: ProfileFormData) => {
        updateProfile(data);
    };

    return (
        <div className="space-y-6">
            {/* Avatar & Basic Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.general.avatar_title', 'Profile Picture')}</CardTitle>
                    <CardDescription>{t('profile.general.avatar_desc', 'Your profile picture and basic information')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                    <AvatarUpload
                        currentAvatarUrl={user.avatarUrl}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        size="lg"
                    />
                    <div className="space-y-1 text-center sm:text-left">
                        <h3 className="font-semibold text-lg">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{user.roles.join(' • ')}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Information Form */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.general.personal_info', 'Personal Information')}</CardTitle>
                    <CardDescription>{t('profile.general.personal_info_desc', 'Update your personal details')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">{t('auth.first_name', 'First Name')}</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="firstName"
                                        {...register('firstName')}
                                        className="pl-9"
                                        aria-invalid={!!errors.firstName}
                                    />
                                </div>
                                {errors.firstName && (
                                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">{t('auth.last_name', 'Last Name')}</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="lastName"
                                        {...register('lastName')}
                                        className="pl-9"
                                        aria-invalid={!!errors.lastName}
                                    />
                                </div>
                                {errors.lastName && (
                                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('auth.email', 'Email')}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" value={user.email} className="pl-9 bg-muted/50" readOnly />
                                    {user.emailVerified && (
                                        <span className="absolute right-3 top-2.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            {t('profile.verified', 'Verified')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">{t('auth.phone_number', 'Phone Number')}</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phoneNumber"
                                        {...register('phoneNumber')}
                                        placeholder="+995 555 00 00 00"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending || !isDirty}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('profile.save_changes', 'Save Changes')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
