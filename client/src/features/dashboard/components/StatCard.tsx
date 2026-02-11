'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: number | string;
    href: string;
    color: string;
    description?: string;
    isLoading?: boolean;
}

export const StatCard = ({ icon: Icon, label, value, href, color, description, isLoading }: StatCardProps): React.ReactNode => {
    return (
        <Link
            href={href}
            className="group rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2 rounded-lg', color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
            </div>
            {isLoading ? (
                <div className="space-y-2">
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
            ) : (
                <>
                    <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
                    )}
                </>
            )}
        </Link>
    );
};
