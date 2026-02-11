'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getMediaUrl } from '@/lib/utils/media';

import type { UserRole } from '@/features/auth/types/auth.types';

const ROLE_LABELS: Record<UserRole, string> = {
    USER: 'User',
    COMPANY: 'Company',
    ADMIN: 'Admin',
    GUIDE: 'Guide',
    DRIVER: 'Driver',
    TOUR_AGENT: 'Agent',
};

function getPrimaryRole(roles: UserRole[] | undefined): UserRole {
    if (!roles || roles.length === 0) return 'USER';
    const priority: UserRole[] = ['ADMIN', 'COMPANY', 'GUIDE', 'DRIVER', 'TOUR_AGENT', 'USER'];
    return priority.find((r) => roles.includes(r)) || 'USER';
}

interface DashboardSidebarUserProps {
    isCollapsed: boolean;
}

export const DashboardSidebarUser = ({ isCollapsed }: DashboardSidebarUserProps): React.ReactNode => {
    const { user } = useAuth();

    if (!user) return null;

    const primaryRole = getPrimaryRole(user.roles as UserRole[] | undefined);
    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
    const fullName = `${user.firstName} ${user.lastName}`;

    const avatar = (
        <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary overflow-hidden flex items-center justify-center">
            {user.avatarUrl ? (
                <img
                    src={getMediaUrl(user.avatarUrl)}
                    alt={fullName}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="text-sm font-semibold">{initials}</span>
            )}
        </div>
    );

    if (isCollapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex justify-center px-3 py-4 border-b border-border">
                            {avatar}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex flex-col gap-0.5">
                        <p className="font-semibold">{fullName}</p>
                        <p className="text-xs text-muted-foreground">{ROLE_LABELS[primaryRole]}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            {avatar}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                <Badge variant="secondary" className="text-[10px] mt-0.5 px-1.5 py-0">
                    {ROLE_LABELS[primaryRole]}
                </Badge>
            </div>
        </div>
    );
};
