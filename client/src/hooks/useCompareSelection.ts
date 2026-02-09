'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLocalStorage } from './useLocalStorage';

export interface CompareItem {
  id: string;
  label: string;
  imageUrl: string | null;
}

export interface UseCompareSelectionReturn {
  selectedItems: CompareItem[];
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string, meta: { label: string; imageUrl: string | null }) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  isFull: boolean;
}

export const useCompareSelection = (
  storageKey: string,
  maxItems: number,
  entityLabel: string = 'items'
): UseCompareSelectionReturn => {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useLocalStorage<CompareItem[]>(storageKey, []);

  const selectedIds = useMemo(
    () => selectedItems.map((item) => item.id),
    [selectedItems]
  );

  const count = selectedItems.length;
  const isFull = count >= maxItems;

  const isSelected = useCallback(
    (id: string): boolean => selectedIds.includes(id),
    [selectedIds]
  );

  const toggle = useCallback(
    (id: string, meta: { label: string; imageUrl: string | null }): void => {
      const exists = selectedItems.some((item) => item.id === id);

      if (exists) {
        setSelectedItems((prev) => prev.filter((item) => item.id !== id));
        toast(t('compare.removed'));
        return;
      }

      if (selectedItems.length >= maxItems) {
        toast.error(t('compare.max_reached', { max: maxItems, entity: entityLabel }));
        return;
      }

      setSelectedItems((prev) => [...prev, { id, label: meta.label, imageUrl: meta.imageUrl }]);
      toast(t('compare.added'));
    },
    [selectedItems, maxItems, setSelectedItems, t, entityLabel]
  );

  const remove = useCallback(
    (id: string): void => {
      setSelectedItems((prev) => prev.filter((item) => item.id !== id));
    },
    [setSelectedItems]
  );

  const clear = useCallback((): void => {
    setSelectedItems([]);
  }, [setSelectedItems]);

  return {
    selectedItems,
    selectedIds,
    isSelected,
    toggle,
    remove,
    clear,
    count,
    isFull,
  };
};
