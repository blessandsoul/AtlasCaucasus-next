'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ROUTES } from '@/lib/constants/routes';
import { createCompanyRegisterSchema, type CompanyRegisterFormData } from '../schemas/validation';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useCompanyRegister } from '../hooks/useCompanyRegister';

export const CompanyRegisterForm = () => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const registerMutation = useCompanyRegister();

    const registerSchema = createCompanyRegisterSchema(t);

    const form = useForm<CompanyRegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            companyName: "",
            description: "",
            registrationNumber: "",
            websiteUrl: "",
            phoneNumber: "",
            agreeToTerms: undefined as unknown as true,
        },
    });

    const password = form.watch('password');

    const onSubmit = async (data: CompanyRegisterFormData) => {
        const { agreeToTerms: _, ...requestData } = data;
        registerMutation.mutate(requestData);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('auth.first_name')}</FormLabel>
                                <FormControl>
                                    <Input autoComplete="given-name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('auth.last_name')}</FormLabel>
                                <FormControl>
                                    <Input autoComplete="family-name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('auth.company_name')}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="registrationNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('auth.registration_number')}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('auth.email')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder={t('auth.email_placeholder')}
                                        autoComplete="email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('auth.phone_number')}</FormLabel>
                                <FormControl>
                                    <Input type="tel" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('auth.website_url')}</FormLabel>
                            <FormControl>
                                <Input type="url" placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('auth.description')}</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('auth.password')}</FormLabel>
                            <div className="relative">
                                <FormControl>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={t('auth.password_placeholder')}
                                        autoComplete="new-password"
                                        className="pr-10"
                                        {...field}
                                    />
                                </FormControl>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                            <FormMessage />
                            <PasswordStrengthIndicator password={password} />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value === true}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                                    {t('auth.agree_to')}{' '}
                                    <Link href={ROUTES.LEGAL.TERMS} className="text-primary hover:underline" target="_blank">
                                        {t('header.footer.terms_of_service')}
                                    </Link>
                                    {' '}{t('auth.and')}{' '}
                                    <Link href={ROUTES.LEGAL.PRIVACY} className="text-primary hover:underline" target="_blank">
                                        {t('header.footer.privacy_policy')}
                                    </Link>
                                </FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={registerMutation.isPending}
                >
                    {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.sign_up')}
                </Button>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">{t('auth.has_account')} </span>
                    <Link
                        href={ROUTES.LOGIN}
                        className="font-medium text-primary hover:text-primary/90"
                    >
                        {t('auth.sign_in')}
                    </Link>
                </div>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">{t('auth.are_you_user')} </span>
                    <Link
                        href={ROUTES.REGISTER}
                        className="font-medium text-primary hover:text-primary/90"
                    >
                        {t('auth.register_as_user_link')}
                    </Link>
                </div>
            </form>
        </Form>
    );
};
