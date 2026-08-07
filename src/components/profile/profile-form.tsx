'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Profile } from '@/lib/db/schema';
import { ImageUpload } from '@/components/profile/image-upload';
import { FileUpload } from '@/components/profile/file-upload';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ProfileView } from '@/app/n/[uid]/profile-view';
import { Eye } from 'lucide-react';

const profileSchema = z.object({
  profilePhotoUrl: z.string().optional().nullable().or(z.literal('')),
  companyLogoUrl: z.string().optional().nullable().or(z.literal('')),
  cvUrl: z.string().optional().nullable().or(z.literal('')),
  firstName: z.string().max(50, 'Max 50 characters').optional().nullable(),
  lastName: z.string().max(50, 'Max 50 characters').optional().nullable(),
  slug: z.string().max(50, 'Max 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens')
    .optional().nullable().or(z.literal('')),
  jobTitle: z.string().max(100, 'Max 100 characters').optional().nullable(),
  companyName: z.string().max(100, 'Max 100 characters').optional().nullable(),
  bio: z.string().max(500, 'Max 500 characters').optional().nullable(),
  phone: z.string().max(50, 'Max 50 characters').optional().nullable(),
  whatsapp: z.string().max(50, 'Max 50 characters').optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  instagramUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  isPublished: z.boolean(),
  label: z.string().max(50, 'Max 50 characters').optional().nullable()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: Partial<Profile> | null;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      profilePhotoUrl: initialData?.profilePhotoUrl || '',
      companyLogoUrl: initialData?.companyLogoUrl || '',
      cvUrl: initialData?.cvUrl || '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      slug: initialData?.slug || '',
      jobTitle: initialData?.jobTitle || '',
      companyName: initialData?.companyName || '',
      bio: initialData?.bio || '',
      phone: initialData?.phone || '',
      whatsapp: initialData?.whatsapp || '',
      email: initialData?.email || '',
      websiteUrl: initialData?.websiteUrl || '',
      linkedinUrl: initialData?.linkedinUrl || '',
      instagramUrl: initialData?.instagramUrl || '',
      isPublished: initialData?.isPublished ?? false,
      label: initialData?.label || '',
    }
  });

  const isPublished = watch('isPublished');
  const profilePhotoUrl = watch('profilePhotoUrl');
  const companyLogoUrl = watch('companyLogoUrl');
  const cvUrl = watch('cvUrl');

  const currentValues = watch();

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        ...(initialData?.id ? { profileId: initialData.id } : {})
      };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save profile');
      }

      toast.success('Profile saved successfully!');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.error('Form validation failed:', errors);
    toast.error('Please fix the errors in the form before saving.');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8 max-w-2xl">
      
      {/* ── Media ── */}
      <div className="bg-card text-card-foreground border border-border shadow-sm rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Profile Media</h2>
        <div className="flex flex-col sm:flex-row gap-8">
          <ImageUpload
            label="Profile Photo"
            type="avatar"
            currentUrl={profilePhotoUrl}
            onUploadSuccess={(url) => setValue('profilePhotoUrl', url, { shouldDirty: true })}
          />
          <ImageUpload
            label="Company Logo"
            type="logo"
            currentUrl={companyLogoUrl}
            onUploadSuccess={(url) => setValue('companyLogoUrl', url, { shouldDirty: true })}
          />
        </div>
        <div className="pt-4 border-t border-border">
          <FileUpload
            label="CV / Resume (PDF)"
            type="cv"
            currentUrl={cvUrl}
            onUploadSuccess={(url) => setValue('cvUrl', url, { shouldDirty: true })}
            onRemove={() => setValue('cvUrl', '', { shouldDirty: true })}
          />
        </div>
      </div>

      {/* ── Basic Info ── */}
      <div className="bg-card text-card-foreground border border-border shadow-sm rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register('firstName')} placeholder="Umar" />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register('lastName')} placeholder="Khan" />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" {...register('jobTitle')} placeholder="Founder & CEO" />
            {errors.jobTitle && <p className="text-sm text-red-500">{errors.jobTitle.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" {...register('companyName')} placeholder="TapThat" />
            {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            {...register('bio')} 
            placeholder="A short description about yourself and what you do..."
            className="h-24"
          />
          {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
        </div>
      </div>

      {/* ── Contact Info ── */}
      <div className="bg-card text-card-foreground border border-border shadow-sm rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Contact Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email">Public Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="hello@example.com" />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" {...register('phone')} placeholder="+971 50 123 4567" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input id="whatsapp" type="tel" {...register('whatsapp')} placeholder="971501234567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input id="websiteUrl" type="url" {...register('websiteUrl')} placeholder="https://tapthat.ae" />
            {errors.websiteUrl && <p className="text-sm text-red-500">{errors.websiteUrl.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input id="linkedinUrl" type="url" {...register('linkedinUrl')} placeholder="https://linkedin.com/in/umarkhan" />
            {errors.linkedinUrl && <p className="text-sm text-red-500">{errors.linkedinUrl.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input id="instagramUrl" type="url" {...register('instagramUrl')} placeholder="https://instagram.com/tapthat" />
            {errors.instagramUrl && <p className="text-sm text-red-500">{errors.instagramUrl.message}</p>}
          </div>
        </div>
      </div>

      {/* ── Profile Settings ── */}
      <div className="bg-card text-card-foreground border border-border shadow-sm rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
        
        <div className="space-y-2">
          <Label htmlFor="label">Internal Profile Name</Label>
          <Input 
            id="label" 
            {...register('label')} 
            placeholder="e.g. Business, Student, Creator" 
          />
          <p className="text-xs text-muted-foreground">This is just for you to identify this profile in your dashboard.</p>
          {errors.label && <p className="text-sm text-red-500">{errors.label.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Custom Profile URL (Username)</Label>
          <div className="flex items-center">
            <span className="bg-accent text-accent-foreground border border-r-0 border-border px-3 py-2 rounded-l-md text-muted-foreground text-sm">
              tapthat.ae/p/
            </span>
            <Input 
              id="slug" 
              {...register('slug')} 
              placeholder="umar-khan" 
              className="rounded-l-none"
            />
          </div>
          {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <div className="space-y-0.5">
            <Label className="text-base">Publish Profile</Label>
            <p className="text-sm text-muted-foreground">
              Make your profile visible when someone taps your card.
            </p>
          </div>
          <Switch 
            checked={isPublished} 
            onCheckedChange={(checked) => setValue('isPublished', checked)} 
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pb-12">
        <Sheet>
          <SheetTrigger>
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-8 w-full sm:w-auto">
              <Eye className="w-4 h-4 mr-2" />
              Preview Profile
            </div>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md p-0 bg-background border-l-white/10 overflow-y-auto overflow-x-hidden">
            {/* Render the actual public profile view with current form data */}
            <div className="scale-[0.85] sm:scale-100 origin-top h-full w-full">
              <ProfileView 
                profile={{
                  ...initialData,
                  ...currentValues,
                  id: initialData?.id || 'preview',
                  userId: initialData?.userId || 'preview',
                  createdAt: initialData?.createdAt || new Date(),
                  updatedAt: new Date(),
                } as Profile} 
                cardUid="PREVIEW-MODE"
                viewerUserId={initialData?.userId || null}
                isOwner={true}
                alreadySaved={false}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Button type="submit" disabled={isSaving} size="lg" className="w-full sm:w-auto">
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}
