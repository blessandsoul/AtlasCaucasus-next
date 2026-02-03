---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Forms & Validation

## Form Handling Options in Next.js

### 1. React Hook Form + Zod (Client Components)
Best for complex forms with real-time validation.

### 2. Server Actions with FormData
Best for simple forms with server-side processing.

### 3. Hybrid Approach
Client-side validation + Server Action submission.

## React Hook Form + Zod (Client Component)

### Basic Form Pattern

```tsx
'use client';

// features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Validation schema (matches backend)
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isSubmitting: boolean;
}

export const LoginForm = ({ onSubmit, isSubmitting }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};
```

## Server Actions Form (Next.js Native)

### Simple Form with Server Action

```tsx
// features/tours/actions/tour.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { tourService } from '../services/tour.service';

const createTourSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  price: z.coerce.number().min(0, 'Price must be positive'),
  city: z.string().optional(),
});

export async function createTour(prevState: any, formData: FormData) {
  const validatedFields = createTourSchema.safeParse({
    title: formData.get('title'),
    price: formData.get('price'),
    city: formData.get('city'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields',
    };
  }

  try {
    const tour = await tourService.createTour(validatedFields.data);
    revalidatePath('/tours');
    redirect(`/tours/${tour.id}`);
  } catch (error) {
    return {
      message: 'Failed to create tour',
    };
  }
}
```

### Form Component with useFormState

```tsx
'use client';

// features/tours/components/CreateTourForm.tsx
import { useFormState, useFormStatus } from 'react-dom';
import { createTour } from '../actions/tour.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating...' : 'Create Tour'}
    </Button>
  );
}

export const CreateTourForm = () => {
  const [state, formAction] = useFormState(createTour, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required />
        {state?.errors?.title && (
          <p className="text-sm text-destructive mt-1">
            {state.errors.title[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="price">Price *</Label>
        <Input id="price" name="price" type="number" step="0.01" required />
        {state?.errors?.price && (
          <p className="text-sm text-destructive mt-1">
            {state.errors.price[0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" />
      </div>

      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  );
};
```

## Hybrid Approach (Recommended)

Client-side validation for UX, Server Action for submission:

```tsx
'use client';

// features/tours/components/CreateTourForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStatus } from 'react-dom';
import { createTour } from '../actions/tour.actions';
import { toast } from 'sonner';

const tourSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  price: z.coerce.number().min(0, 'Price must be positive'),
  city: z.string().optional(),
});

type TourFormData = z.infer<typeof tourSchema>;

export const CreateTourForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
  });

  const onSubmit = async (data: TourFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const result = await createTour(null, formData);

    if (result?.message) {
      toast.error(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="price">Price *</Label>
        <Input id="price" type="number" step="0.01" {...register('price')} />
        {errors.price && (
          <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" {...register('city')} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Tour'}
      </Button>
    </form>
  );
};
```

## Form with Select/Dropdown

```tsx
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Controller } from 'react-hook-form';

const { control } = useForm<TourFormData>({
  resolver: zodResolver(tourSchema),
});

<Controller
  name="city"
  control={control}
  render={({ field }) => (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger>
        <SelectValue placeholder="Select a city" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tbilisi">Tbilisi</SelectItem>
        <SelectItem value="batumi">Batumi</SelectItem>
        <SelectItem value="kutaisi">Kutaisi</SelectItem>
      </SelectContent>
    </Select>
  )}
/>;
```

## Common Validation Schemas

```tsx
// lib/schemas/validation.ts
import { z } from 'zod';

// Email
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

// Password
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number');

// Confirm password
export const confirmPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Price
export const priceSchema = z.coerce
  .number()
  .min(0, 'Price must be positive')
  .max(1000000, 'Price is too high');

// URL
export const urlSchema = z
  .string()
  .url('Invalid URL')
  .optional()
  .or(z.literal(''));
```

## Form with File Upload

```tsx
'use client';

// features/tours/components/TourImageUpload.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { uploadImages } from '../actions/tour.actions';
import { toast } from 'sonner';

export const TourImageUpload = ({ tourId }: { tourId: string }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('tourId', tourId);

    const result = await uploadImages(formData);

    if (result.success) {
      toast.success('Images uploaded!');
      setFiles([]);
    } else {
      toast.error(result.error || 'Upload failed');
    }

    setIsUploading(false);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />

      <label htmlFor="image-upload">
        <Button type="button" variant="outline" asChild>
          <span>Choose Images</span>
        </Button>
      </label>

      {files.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground">
            {files.length} file(s) selected
          </p>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
};
```

## Dynamic Form Fields

```tsx
'use client';

import { useFieldArray } from 'react-hook-form';

const { control, register } = useForm<{
  title: string;
  highlights: { value: string }[];
}>();

const { fields, append, remove } = useFieldArray({
  control,
  name: 'highlights',
});

return (
  <div>
    {fields.map((field, index) => (
      <div key={field.id} className="flex gap-2">
        <Input {...register(`highlights.${index}.value`)} />
        <Button type="button" onClick={() => remove(index)}>
          Remove
        </Button>
      </div>
    ))}
    <Button type="button" onClick={() => append({ value: '' })}>
      Add Highlight
    </Button>
  </div>
);
```

## Form Best Practices

### Do's
- ✅ Match backend validation (use same Zod schemas if possible)
- ✅ Show field-level errors immediately
- ✅ Disable submit button during submission
- ✅ Use Server Actions for form submission when possible
- ✅ Handle API errors separately from validation errors
- ✅ Use aria-invalid for accessibility
- ✅ Provide clear error messages
- ✅ Use useFormStatus for pending states

### Don'ts
- ❌ Don't show errors before user interaction
- ❌ Don't submit without validation
- ❌ Don't trust client-side validation alone
- ❌ Don't forget loading states
- ❌ Don't ignore API validation errors

---

**Last Updated**: January 2025
