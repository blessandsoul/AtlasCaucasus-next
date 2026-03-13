'use client';

import { useState, useEffect, useCallback, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavSection {
  id: string;
  label: string;
  ref: RefObject<HTMLDivElement | null>;
}

interface StickyNavBarProps {
  sections: NavSection[];
  price: string;
  ctaLabel: string;
  onReserve: () => void;
  showAfterOffset: number;
}

export const StickyNavBar = ({
  sections,
  price,
  ctaLabel,
  onReserve,
  showAfterOffset,
}: StickyNavBarProps): React.ReactElement => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? '');

  // Show/hide based on scroll position
  useEffect(() => {
    const handleScroll = (): void => {
      setIsVisible(window.scrollY > showAfterOffset);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterOffset]);

  // Active section detection via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      if (!section.ref.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section.id);
          }
        },
        { rootMargin: '-80px 0px -75% 0px' }
      );

      observer.observe(section.ref.current);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [sections]);

  const scrollToSection = useCallback((section: NavSection): void => {
    section.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-40 hidden lg:flex items-center h-14',
        'bg-background/95 backdrop-blur-sm border-b border-border shadow-sm',
        'transition-transform duration-300',
        isVisible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between h-full">
        {/* Left: Section tabs */}
        <nav className="flex items-center h-full gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section)}
              className={cn(
                'relative px-4 h-full flex items-center text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {section.label}
              {activeSection === section.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Price + Reserve button */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            From{' '}
            <span className="text-base font-bold text-foreground">{price}</span>
          </span>
          <Button
            size="sm"
            className="rounded-full font-semibold px-6"
            onClick={onReserve}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
