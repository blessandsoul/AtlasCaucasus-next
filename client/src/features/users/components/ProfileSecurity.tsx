'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Key, LogOut, Laptop } from 'lucide-react';
import { useLogoutAll } from '@/features/auth/hooks/useLogoutAll';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { toast } from 'sonner';
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProfileSecurityProps {
    user: IUser;
}

export const ProfileSecurity = ({ user }: ProfileSecurityProps) => {
    const { t } = useTranslation();
    const logoutAll = useLogoutAll();
    const forgotPassword = useForgotPassword();

    const handleResetPassword = () => {
        if (!user?.email) return;
        forgotPassword.mutate({ email: user.email }, {
            onSuccess: () => {
                toast.success(t('auth.recovery_instructions_sent', `Password reset instructions sent to ${user.email}`));
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Password Section */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.security.password_title', 'Password')}</CardTitle>
                    <CardDescription>{t('profile.security.password_desc', 'Manage your password and account security')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">•••••••••••••</p>
                            <p className="text-sm text-muted-foreground">{t('profile.security.last_changed_never', 'Last changed: Never')}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleResetPassword} disabled={forgotPassword.isPending} className="w-full sm:w-auto">
                        {t('auth.change_password', 'Change Password')}
                    </Button>
                </CardContent>
            </Card>

            {/* Sessions Section */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.security.sessions_title', 'Active Sessions')}</CardTitle>
                    <CardDescription>{t('profile.security.sessions_desc', 'Manage your active sessions across devices')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                                <Laptop className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium">{t('profile.security.current_session', 'Current Session')}</p>
                                <p className="text-sm text-muted-foreground text-emerald-600">{t('profile.active', 'Active')}</p>
                            </div>
                        </div>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full sm:w-auto">
                                <LogOut className="w-4 h-4 mr-2" />
                                {t('profile_page.logout_all_sessions', 'Logout All Sessions')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('profile_page.logout_all_dialog.title', 'Logout from all devices?')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('profile_page.logout_all_dialog.description', 'This will log you out from all devices including this one. You will need to log in again.')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('profile_page.logout_all_dialog.cancel', 'Cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => logoutAll.mutate()}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {logoutAll.isPending ? t('profile_page.logout_all_dialog.logging_out', 'Logging out...') : t('profile_page.logout_all_dialog.confirm', 'Logout All')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
};
