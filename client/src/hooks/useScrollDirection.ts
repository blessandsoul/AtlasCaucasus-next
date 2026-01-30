'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect scroll direction and position
 *
 * @returns {Object} scrollDirection - 'up' | 'down' | null
 * @returns {boolean} isTop - true if scrollY < 100
 *
 * Usage:
 * const { scrollDirection, isTop } = useScrollDirection();
 */
export const useScrollDirection = () => {
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const [isTop, setIsTop] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let lastScrollY = window.scrollY;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;

            // Check if we're at the top of the page
            setIsTop(scrollY < 100);

            // Determine scroll direction
            if (scrollY > lastScrollY && scrollY > 100) {
                setScrollDirection('down');
            } else if (scrollY < lastScrollY) {
                setScrollDirection('up');
            }

            lastScrollY = scrollY;
        };

        // Add scroll event listener
        window.addEventListener('scroll', updateScrollDirection, { passive: true });

        // Cleanup
        return () => window.removeEventListener('scroll', updateScrollDirection);
    }, []);

    return { scrollDirection, isTop };
};
