'use client';

import { useMockTranslation } from '@/hooks/use-mock-translation';
import { Star } from 'lucide-react';

interface Testimonial {
    text: string;
    author: string;
    location: string;
}

const testimonials: Testimonial[] = [
    { text: "review_1", author: "Sarah M.", location: "UK" },
    { text: "review_2", author: "James D.", location: "USA" },
    { text: "review_3", author: "Elena K.", location: "Germany" },
    { text: "review_4", author: "Michael R.", location: "Canada" },
];

export const TestimonialsSection = () => {
    const { t } = useMockTranslation();

    return (
        <section className="py-20 overflow-hidden bg-background relative">
            {/* Floating Decorations */}
            <div className="floating-blob w-64 h-64 bg-primary/30 top-10 -left-20" />
            <div className="floating-blob w-48 h-48 bg-cyan-400/30 bottom-10 -right-10" style={{ animationDelay: '2s' }} />

            <div className="container mx-auto px-4 mb-10 text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gradient leading-tight pb-2">{t('home.testimonials.title')}</h2>
            </div>

            <div className="relative flex overflow-x-hidden">
                <div className="animate-marquee whitespace-nowrap flex gap-8 py-4">
                    {[...testimonials, ...testimonials].map((review, i) => (
                        <div key={i} className="inline-flex flex-col w-[350px] p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-primary/10 mx-4 whitespace-normal shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex gap-1 mb-4 text-amber-400">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                            </div>
                            <p className="text-muted-foreground italic mb-4 flex-1">"{t(`home.testimonials.${review.text}`)}"</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center font-bold text-white ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                                    {review.author.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{review.author}</p>
                                    <p className="text-xs text-muted-foreground">{review.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Duplicate for seamless loop - CSS animation handles the movement */}
                <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-8 py-4">
                    {[...testimonials, ...testimonials].map((review, i) => (
                        <div key={`dup-${i}`} className="inline-flex flex-col w-[350px] p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-primary/10 mx-4 whitespace-normal shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex gap-1 mb-4 text-amber-400">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                            </div>
                            <p className="text-muted-foreground italic mb-4 flex-1">"{t(`home.testimonials.${review.text}`)}"</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center font-bold text-white ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                                    {review.author.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{review.author}</p>
                                    <p className="text-xs text-muted-foreground">{review.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};
