'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StarRating } from './StarRating';
import { formatRelativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { Review } from '../types/review.types';

interface ReviewCardProps {
  review: Review;
  showActions?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  isDeleting?: boolean;
  className?: string;
}

export const ReviewCard = ({
  review,
  showActions = false,
  onEdit,
  onDelete,
  isDeleting = false,
  className,
}: ReviewCardProps) => {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { user, rating, comment, createdAt } = review;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.(review);
  };

  return (
    <>
      <div className={cn('flex gap-4 py-4', className)}>
        {/* Avatar */}
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-sm font-medium">
            {getInitials(user.firstName, user.lastName)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating rating={rating} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(createdAt)}
                </span>
              </div>
            </div>

            {/* Actions menu */}
            {showActions && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    disabled={isDeleting}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">
                      {t('reviews.actions')}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(review)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment */}
          {comment && (
            <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap">
              {comment}
            </p>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('reviews.delete_confirm_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'reviews.delete_confirm_description'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
