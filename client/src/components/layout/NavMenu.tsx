'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavMenuItem {
    title: string;
    description?: string;
    href?: string;
    icon?: React.ReactNode;
}

interface NavMenuProps {
    trigger: React.ReactNode;
    items: NavMenuItem[];
    className?: string;
}

export const NavMenu = ({ trigger, items, className }: NavMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={cn("relative h-full flex items-center", className)}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div className="cursor-pointer h-full flex items-center">
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 pt-2 w-80 z-50"
                    >
                        <div className="bg-background rounded-xl shadow-lg border p-2 overflow-hidden">
                            <div className="flex flex-col gap-1">
                                {items.map((item, index) => {
                                    const content = (
                                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer group">
                                            {item.icon && (
                                                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-[#22d3ee]/10 text-[#22d3ee] group-hover:bg-[#22d3ee] group-hover:text-white transition-colors">
                                                    {item.icon}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold text-foreground">
                                                        {item.title}
                                                    </h4>
                                                </div>
                                                {item.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );

                                    return item.href ? (
                                        <Link key={index} href={item.href}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={index}>{content}</div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
