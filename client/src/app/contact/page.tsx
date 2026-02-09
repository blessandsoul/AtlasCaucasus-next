'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Send, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { apiClient } from '@/lib/api/axios.config';
import { getErrorMessage } from '@/lib/utils/error';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/contact', data);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      form.reset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: t('contact.faq.items.q1.question'),
      answer: t('contact.faq.items.q1.answer'),
    },
    {
      question: t('contact.faq.items.q2.question'),
      answer: t('contact.faq.items.q2.answer'),
    },
    {
      question: t('contact.faq.items.q3.question'),
      answer: t('contact.faq.items.q3.answer'),
    },
    {
      question: t('contact.faq.items.q4.question'),
      answer: t('contact.faq.items.q4.answer'),
    },
    {
      question: t('contact.faq.items.q5.question'),
      answer: t('contact.faq.items.q5.answer'),
    },
    {
      question: t('contact.faq.items.q6.question'),
      answer: t('contact.faq.items.q6.answer'),
    },
    {
      question: t('contact.faq.items.q7.question'),
      answer: t('contact.faq.items.q7.answer'),
    },
    {
      question: t('contact.faq.items.q8.question'),
      answer: t('contact.faq.items.q8.answer'),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:20px_20px]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
              {t('contact.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border bg-card shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">{t('contact.form.title')}</h2>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('contact.form.name')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('contact.form.name_placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('contact.form.email')}</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder={t('contact.form.email_placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contact.form.subject')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('contact.form.subject_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('contact.form.message')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('contact.form.message_placeholder')}
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('contact.form.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {t('contact.form.send')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              {/* Contact Details Card */}
              <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-6">
                <h3 className="text-lg font-bold">{t('contact.info.title')}</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">{t('contact.info.email')}</p>
                      <a
                        href="mailto:info@atlascaucasus.com"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@atlascaucasus.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">{t('contact.info.phone')}</p>
                      <a
                        href="tel:+995555123456"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        +995 555 123 456
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">{t('contact.info.address')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('contact.info.address_value')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours Card */}
              <div className="rounded-2xl border bg-card shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">{t('contact.info.hours.title')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contact.info.hours.mon_fri')}</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contact.info.hours.sat')}</span>
                    <span className="font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contact.info.hours.sun')}</span>
                    <span className="font-medium">{t('contact.info.hours.closed')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('contact.faq.title')}</h2>
              <p className="text-muted-foreground text-lg">
                {t('contact.faq.subtitle')}
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Collapsible
                  key={index}
                  open={openFaq === index}
                  onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <CollapsibleTrigger className="w-full p-6 flex items-center justify-between gap-4 text-left hover:bg-muted/50 transition-colors">
                      <span className="font-semibold">{faq.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''
                          }`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-6 pb-6 pt-2">
                        <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Optional) */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2978.141989396996!2d44.79366831545516!3d41.69425997923684!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40440cd7e64f626b%3A0x4f907964122d4ac2!2sRustaveli%20Ave%2C%20Tbilisi%2C%20Georgia!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="AtlasCaucasus Office Location"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
