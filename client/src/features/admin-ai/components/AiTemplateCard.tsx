'use client';

import { Settings, Coins, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminAiTemplate } from '../types/admin-ai.types';

interface AiTemplateCardProps {
  template: AdminAiTemplate;
  onEdit: (template: AdminAiTemplate) => void;
  onToggle: (id: string, isActive: boolean) => void;
  isToggling: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  TOUR_DESCRIPTION: 'Tour Description',
  TOUR_ITINERARY: 'Tour Itinerary',
  MARKETING_COPY: 'Marketing',
  BLOG_CONTENT: 'Blog',
};

export const AiTemplateCard = ({
  template,
  onEdit,
  onToggle,
  isToggling,
}: AiTemplateCardProps) => {
  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
        !template.isActive && 'opacity-60',
      )}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{template.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
          </div>
          <Switch
            checked={template.isActive}
            onCheckedChange={(checked) => onToggle(template.id, checked)}
            disabled={isToggling}
            aria-label={template.isActive ? 'Disable template' : 'Enable template'}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {TYPE_LABELS[template.type] ?? template.type}
          </Badge>
          {template.source === 'override' && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              Customized
            </Badge>
          )}
          {!template.isActive && (
            <Badge variant="destructive" className="text-xs">
              Disabled
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            {template.creditCost} credits
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5" />
            temp {template.temperature.toFixed(2)}
          </span>
          <span>{template.fields.length} fields</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onEdit(template)}
        >
          <Settings className="mr-1.5 h-3.5 w-3.5" />
          Configure
        </Button>
      </CardContent>
    </Card>
  );
};
