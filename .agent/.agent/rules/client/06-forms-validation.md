---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# Forms & Validation

## Form Handling with React Hook Form + Zod

### Basic Form Pattern

```tsx
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

export const LoginForm = ({ onSubmit, isSubmitting }) => {
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
          <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};
```

### Complete Form Example

```tsx
// features/tours/components/CreateTourForm.tsx
const tourSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  summary: z.string().max(1000).optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  city: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  maxPeople: z.coerce.number().int().positive().optional(),
});

type TourFormData = z.infer<typeof tourSchema>;

export const CreateTourForm = ({ onSubmit, isSubmitting, defaultValues }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
    defaultValues,
  });
  
  const handleFormSubmit = (data: TourFormData) => {
    onSubmit(data);
    reset();
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" {...register('summary')} rows={4} />
        {errors.summary && (
          <p className="text-sm text-destructive mt-1">{errors.summary.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
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
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Tour'}
      </Button>
    </form>
  );
};
```

## Form with File Upload

```tsx
// features/tours/components/TourImageUpload.tsx
export const TourImageUpload = ({ onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const uploadMutation = useUploadImages();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleUpload = () => {
    uploadMutation.mutate(files, {
      onSuccess: (data) => {
        onSuccess(data);
        setFiles([]);
      },
    });
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
          <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
};
```

## Form with Select/Dropdown

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
/>
```

## Form Validation Patterns

### Common Validation Schemas

```tsx
// features/auth/schemas/validation.ts
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
export const confirmPasswordSchema = (passwordField: string) =>
  z.object({
    [passwordField]: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data[passwordField] === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Price
export const priceSchema = z
  .coerce
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

### Conditional Validation

```tsx
const tourSchema = z.object({
  title: z.string().min(1),
  price: z.coerce.number(),
  isPremium: z.boolean(),
  premiumDescription: z.string().optional(),
}).refine(
  (data) => {
    if (data.isPremium) {
      return data.premiumDescription && data.premiumDescription.length > 0;
    }
    return true;
  },
  {
    message: 'Premium description required for premium tours',
    path: ['premiumDescription'],
  }
);
```

## Form with API Error Handling

```tsx
// features/tours/pages/CreateTourPage.tsx
export const CreateTourPage = () => {
  const createTour = useCreateTour();
  
  const handleSubmit = async (data: TourFormData) => {
    try {
      await createTour.mutateAsync(data);
    } catch (error) {
      // Handle field-specific errors
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as any, { message });
        });
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };
  
  return <CreateTourForm onSubmit={handleSubmit} isSubmitting={createTour.isPending} />;
};
```

## Dynamic Form Fields

```tsx
// Form with dynamic array fields
import { useFieldArray } from 'react-hook-form';

const { control, register } = useForm<{
  tour: { title: string };
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
        <Button type="button" onClick={() => remove(index)}>Remove</Button>
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
- ✅ Clear form on successful submission
- ✅ Handle API errors separately from validation errors
- ✅ Use aria-invalid for accessibility
- ✅ Provide clear error messages

### Don'ts
- ❌ Don't show errors before user interaction
- ❌ Don't submit without validation
- ❌ Don't trust client-side validation alone
- ❌ Don't forget loading states
- ❌ Don't ignore API validation errors

---

**Last Updated**: January 2, 2025
