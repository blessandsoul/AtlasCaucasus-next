export interface DashboardStat {
    label: string;
    value: number;
    icon: React.ElementType;
    href: string;
    color: string;
    description?: string;
}

export interface QuickAction {
    label: string;
    href: string;
    icon: React.ElementType;
    description: string;
}
