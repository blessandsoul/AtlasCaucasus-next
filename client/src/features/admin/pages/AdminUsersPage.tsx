'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, RotateCcw, Unlock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/common/StatusIndicator';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import type { ColumnDef } from '@/components/common/DataTable';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { OnlineIndicator } from '@/components/common/OnlineIndicator';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useOnlineUsers } from '@/features/presence';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { EditUserDialog } from '../components/EditUserDialog';
import { DeleteUserDialog } from '../components/DeleteUserDialog';
import { RestoreUserDialog } from '../components/RestoreUserDialog';
import { UnlockUserDialog } from '../components/UnlockUserDialog';
import { UserDetailsModal } from '../components/UserDetailsModal';
import { formatDate } from '@/lib/utils/format';
import type { IUser } from '@/features/auth/types/auth.types';

const ITEMS_PER_PAGE = 10;

export const AdminUsersPage = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<IUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
    const [userToRestore, setUserToRestore] = useState<IUser | null>(null);
    const [userToUnlock, setUserToUnlock] = useState<IUser | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const { data, isLoading, error } = useUsers({
        page,
        limit: ITEMS_PER_PAGE,
        includeDeleted: true,
    });

    const { isUserOnline, onlineCount } = useOnlineUsers();

    const users = data?.items || [];
    const pagination = data?.pagination;

    const columns: ColumnDef<IUser>[] = useMemo(() => [
        {
            header: t('admin.users.table.name', 'Name'),
            cell: (user) => (
                <div className="font-medium">
                    {user.firstName} {user.lastName}
                </div>
            ),
            className: "w-[250px]"
        },
        {
            header: t('admin.users.table.online', 'Online'),
            cell: (user) => (
                <div className="flex justify-center">
                    <OnlineIndicator
                        isOnline={isUserOnline(user.id)}
                    />
                </div>
            ),
            className: "w-[100px] text-center"
        },
        {
            header: t('admin.users.table.email', 'Email'),
            accessorKey: 'email'
        },
        {
            header: t('admin.users.table.roles', 'Roles'),
            cell: (user) => (
                <div className="flex gap-1 flex-wrap">
                    {(user.roles || []).map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                        </Badge>
                    ))}
                </div>
            )
        },
        {
            header: t('admin.users.table.status', 'Status'),
            cell: (user) => {
                const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
                return (
                    <div className="flex justify-center items-center gap-2">
                        {user.deletedAt ? (
                            <>
                                <Badge variant="destructive" className="text-xs">
                                    {t('admin.users.deleted', 'Deleted')}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUserToRestore(user);
                                    }}
                                    title={t('admin.users.restore', 'Restore')}
                                    className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            </>
                        ) : isLocked ? (
                            <>
                                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                                    {t('admin.users.locked', 'Locked')}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUserToUnlock(user);
                                    }}
                                    title={t('admin.users.unlock', 'Unlock')}
                                    className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                >
                                    <Unlock className="h-3.5 w-3.5" />
                                </Button>
                            </>
                        ) : (
                            <StatusIndicator isActive={user.isActive} />
                        )}
                    </div>
                );
            },
            className: "w-[150px] text-center"
        },
        {
            header: t('admin.users.table.joined', 'Joined'),
            cell: (user) => (
                <div className="text-muted-foreground whitespace-nowrap">
                    {formatDate(user.createdAt)}
                </div>
            )
        }
    ], [t, isUserOnline]);

    if (error) {
        return <ErrorMessage error={error} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t('admin.users.title', 'Users')}
                    </h2>
                    <p className="text-muted-foreground">
                        {t('admin.users.subtitle', 'Manage users and roles.')}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground order-2 sm:order-1">
                        {onlineCount > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                                <span>
                                    {t('admin.users.online_count', '{{count}} online', {
                                        count: onlineCount,
                                    })}
                                </span>
                            </div>
                        )}
                        {pagination && (
                            <p>
                                {t('admin.users.showing_count', 'Showing {{count}} of {{total}} users', {
                                    count: users.length,
                                    total: pagination.totalItems,
                                })}
                            </p>
                        )}
                    </div>
                    <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto order-1 sm:order-2">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('admin.users.createUser', 'Create User')}
                    </Button>
                </div>
            </div>

            <DataTable
                data={users}
                columns={columns}
                isLoading={isLoading}
                onRowClick={(user) => setSelectedUserId(user.id)}
                onEdit={setUserToEdit}
                onDelete={setUserToDelete}
                pagination={pagination && {
                    page: pagination.page,
                    totalPages: pagination.totalPages,
                    onPageChange: setPage,
                    hasPreviousPage: pagination.hasPreviousPage,
                    hasNextPage: pagination.hasNextPage,
                    totalItems: pagination.totalItems
                }}
                emptyState={{
                    icon: Users,
                    title: t('admin.users.empty_state', 'No users found.')
                }}
            />

            <CreateUserDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />

            <EditUserDialog
                user={userToEdit}
                open={!!userToEdit}
                onOpenChange={(open) => !open && setUserToEdit(null)}
            />

            <DeleteUserDialog
                user={userToDelete}
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
            />

            <RestoreUserDialog
                user={userToRestore}
                open={!!userToRestore}
                onOpenChange={(open) => !open && setUserToRestore(null)}
            />

            <UnlockUserDialog
                user={userToUnlock}
                open={!!userToUnlock}
                onOpenChange={(open) => !open && setUserToUnlock(null)}
            />

            <UserDetailsModal
                userId={selectedUserId}
                open={!!selectedUserId}
                onOpenChange={(open) => !open && setSelectedUserId(null)}
            />
        </div>
    );
};
