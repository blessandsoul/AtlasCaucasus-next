'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Camera } from 'lucide-react';
import type { IUser } from '@/features/auth/types/auth.types';

interface ProfileGeneralProps {
    user: IUser;
}

export const ProfileGeneral = ({ user }: ProfileGeneralProps) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Avatar & Basic Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.general.avatar_title', 'Profile Picture')}</CardTitle>
                    <CardDescription>{t('profile.general.avatar_desc', 'Your profile picture and basic information')}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-2 border-border">
                            {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <button className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-not-allowed" title="Upload coming soon">
                            <Camera className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="space-y-1">
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
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{t('auth.first_name', 'First Name')}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="firstName" defaultValue={user.firstName} className="pl-9" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">{t('auth.last_name', 'Last Name')}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="lastName" defaultValue={user.lastName} className="pl-9" />
                            </div>
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
                            <Label htmlFor="phone">{t('auth.phone_number', 'Phone Number')}</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="phone" placeholder="+995 555 00 00 00" className="pl-9" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button>{t('profile.save_changes', 'Save Changes')}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
