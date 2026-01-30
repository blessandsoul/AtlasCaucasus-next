'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Building, MapPin, Car } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/features/users/hooks/useUsers';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface UserDetailsModalProps {
    userId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const UserDetailsModal = ({ userId, open, onOpenChange }: UserDetailsModalProps) => {
    const { t } = useTranslation();
    const { data: user, isLoading } = useUser(userId);
    const [activeTab, setActiveTab] = useState('overview');

    const formatDate = (date: string) => {
        try {
            return format(new Date(date), 'PPP');
        } catch {
            return date;
        }
    };

    const parseLanguages = (languages: string | string[] | null | undefined): string => {
        if (!languages) return 'N/A';
        if (Array.isArray(languages)) return languages.join(', ');
        try {
            const parsed = JSON.parse(languages);
            return Array.isArray(parsed) ? parsed.join(', ') : languages;
        } catch {
            return languages;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('admin.users.userDetails', 'User Details')}</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : user ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">{t('common.overview', 'Overview')}</TabsTrigger>
                            <TabsTrigger value="company" disabled={!user.companyProfile}>
                                <Building className="h-4 w-4 mr-1" />
                                {t('common.company', 'Company')}
                            </TabsTrigger>
                            <TabsTrigger value="guide" disabled={!user.guideProfile}>
                                <MapPin className="h-4 w-4 mr-1" />
                                {t('common.guide', 'Guide')}
                            </TabsTrigger>
                            <TabsTrigger value="driver" disabled={!user.driverProfile}>
                                <Car className="h-4 w-4 mr-1" />
                                {t('common.driver', 'Driver')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('common.name', 'Name')}</p>
                                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('common.email', 'Email')}</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-2">{t('admin.users.roles', 'Roles')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {user.roles.map((role) => (
                                        <Badge key={role} variant="secondary">
                                            {role}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('admin.users.status', 'Status')}</p>
                                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                        {user.isActive ? t('admin.users.active', 'Active') : t('admin.users.inactive', 'Inactive')}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('admin.users.emailVerified', 'Email Verified')}</p>
                                    <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                                        {user.emailVerified ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('admin.users.joined', 'Joined')}</p>
                                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('admin.users.lastUpdated', 'Last Updated')}</p>
                                    <p className="font-medium">{formatDate(user.updatedAt)}</p>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="company" className="space-y-4 mt-4">
                            {user.companyProfile ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('company.name', 'Company Name')}</p>
                                            <p className="font-medium">{user.companyProfile.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('company.registrationNumber', 'Registration Number')}</p>
                                            <p className="font-medium">{user.companyProfile.registrationNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('company.website', 'Website')}</p>
                                            <p className="font-medium">{user.companyProfile.websiteUrl || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('company.phone', 'Phone')}</p>
                                            <p className="font-medium">{user.companyProfile.phoneNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('company.verified', 'Verified')}</p>
                                        <Badge variant={user.companyProfile.isVerified ? 'default' : 'secondary'}>
                                            {user.companyProfile.isVerified ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                        </Badge>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground">{t('admin.users.noCompanyProfile', 'No company profile')}</p>
                            )}
                        </TabsContent>

                        <TabsContent value="guide" className="space-y-4 mt-4">
                            {user.guideProfile ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('guide.languages', 'Languages')}</p>
                                            <p className="font-medium">{parseLanguages(user.guideProfile.languages)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('guide.experience', 'Years of Experience')}</p>
                                            <p className="font-medium">{user.guideProfile.yearsOfExperience || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('guide.phone', 'Phone')}</p>
                                            <p className="font-medium">{user.guideProfile.phoneNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('guide.available', 'Available')}</p>
                                            <Badge variant={user.guideProfile.isAvailable ? 'default' : 'secondary'}>
                                                {user.guideProfile.isAvailable ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('guide.bio', 'Bio')}</p>
                                        <p className="font-medium">{user.guideProfile.bio || 'N/A'}</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground">{t('admin.users.noGuideProfile', 'No guide profile')}</p>
                            )}
                        </TabsContent>

                        <TabsContent value="driver" className="space-y-4 mt-4">
                            {user.driverProfile ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('driver.vehicleType', 'Vehicle Type')}</p>
                                            <p className="font-medium">{user.driverProfile.vehicleType || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('driver.capacity', 'Capacity')}</p>
                                            <p className="font-medium">{user.driverProfile.vehicleCapacity || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('driver.vehicle', 'Vehicle')}</p>
                                            <p className="font-medium">
                                                {user.driverProfile.vehicleMake} {user.driverProfile.vehicleModel} ({user.driverProfile.vehicleYear})
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('driver.license', 'License Number')}</p>
                                            <p className="font-medium">{user.driverProfile.licenseNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('driver.phone', 'Phone')}</p>
                                            <p className="font-medium">{user.driverProfile.phoneNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('driver.available', 'Available')}</p>
                                            <Badge variant={user.driverProfile.isAvailable ? 'default' : 'secondary'}>
                                                {user.driverProfile.isAvailable ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('driver.bio', 'Bio')}</p>
                                        <p className="font-medium">{user.driverProfile.bio || 'N/A'}</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground">{t('admin.users.noDriverProfile', 'No driver profile')}</p>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                    <p className="text-muted-foreground text-center py-8">
                        {t('admin.users.userNotFound', 'User not found')}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
};
