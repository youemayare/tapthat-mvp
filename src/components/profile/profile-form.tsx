'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Profile } from '@/lib/db/schema';
import { ImageUpload } from '@/components/profile/image-upload';
import { FileUpload } from '@/components/profile/file-upload';
import { WalletHeroUpload } from '@/components/profile/wallet-hero-upload';
import { WalletPreview } from '@/components/profile/wallet-preview';
import { WalletColorPicker } from '@/components/profile/wallet-color-picker';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ProfileView } from '@/app/n/[uid]/profile-view';
import { Eye, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  label: z.string().max(50, 'Max 50 characters').optional().nullable(),
    profileLayout: z.enum(['classic', 'identity', 'canvas']).default('classic'),
    layoutBackgroundColor: z.string().optional().nullable().or(z.literal('')),
    layoutBackgroundImageUrl: z.string().optional().nullable().or(z.literal('')),
  // Google Wallet Appearance
  walletThemeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color, e.g. #1a1a2e')
    .optional()
    .nullable()
    .or(z.literal('')),
  walletHeroImageUrl: z.string().optional().nullable().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: Partial<Profile> | null;
  isMultiProfile?: boolean;
}

export function ProfileForm({ initialData, isMultiProfile }: ProfileFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet'>('profile');

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm({
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
      profileLayout: initialData?.profileLayout || 'classic',
        layoutBackgroundColor: initialData?.layoutBackgroundColor || '',
        layoutBackgroundImageUrl: initialData?.layoutBackgroundImageUrl || '',
      label: initialData?.label || '',
      walletThemeColor: initialData?.walletThemeColor || '',
      walletHeroImageUrl: initialData?.walletHeroImageUrl || '',
    }
  });

  const isPublished = useWatch({ control, name: 'isPublished' });
  const profilePhotoUrl = useWatch({ control, name: 'profilePhotoUrl' });
  const companyLogoUrl = useWatch({ control, name: 'companyLogoUrl' });
  const cvUrl = useWatch({ control, name: 'cvUrl' });
    const profileLayout = useWatch({ control, name: 'profileLayout' });
    const layoutBackgroundColor = useWatch({ control, name: 'layoutBackgroundColor' });
    const layoutBackgroundImageUrl = useWatch({ control, name: 'layoutBackgroundImageUrl' });
  const walletThemeColor = useWatch({ control, name: 'walletThemeColor' });
  const walletHeroImageUrl = useWatch({ control, name: 'walletHeroImageUrl' });
  const firstName = useWatch({ control, name: 'firstName' });
  const lastName = useWatch({ control, name: 'lastName' });
  const jobTitle = useWatch({ control, name: 'jobTitle' });
  const companyName = useWatch({ control, name: 'companyName' });

  const currentValues = useWatch({ control });

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = (errors: unknown) => {
    console.error('Form validation failed:', errors);
    toast.error('Please fix the errors in the form before saving.');
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/profile?id=${initialData.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete profile');
      toast.success('Profile deleted successfully');
      router.push('/dashboard/profile');
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8 max-w-2xl">
      
      {/* Header & Tabs */}
      <div className="space-y-4">
        {isMultiProfile && (
          <div className="flex items-center justify-between">
            <a
              href="/dashboard/profile"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              â† All profiles
            </a>
            
            <div className="flex items-center p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'profile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'wallet' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Google Wallet
              </button>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isMultiProfile 
              ? (initialData?.label ?? 'Edit Profile') 
              : 'My Profile'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeTab === 'wallet' 
              ? ''
              : (isMultiProfile 
                  ? 'This is what people see when you tap your card.'
                  : 'Manage your professional profile â€” this is what people see when they tap your card.')}
          </p>
        </div>
      </div>

      <div className={activeTab === 'profile' ? 'space-y-8' : 'hidden'}>
        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Profile Style</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ` + (profileLayout === 'classic' ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500/50')}>
              <input type="radio" value="classic" {...register('profileLayout')} className="sr-only" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">Classic</span>
                <span className="text-sm text-muted-foreground">Clean and information-first</span>
              </div>
            </label>
            <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ` + (profileLayout === 'identity' ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500/50')}>
              <input type="radio" value="identity" {...register('profileLayout')} className="sr-only" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">Identity</span>
                  <span className="text-sm text-muted-foreground">Immersive and photo-led</span>
                </div>
              </label>
              <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ` + 
(profileLayout === 'canvas' ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500/50')}>
                <input type="radio" value="canvas" {...register('profileLayout')} className="sr-only" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">Canvas</span>
                  <span className="text-sm text-muted-foreground">Customizable background</span>
                </div>
              </label>
            </div>

            {profileLayout === 'canvas' && (
              <div className="mt-6 space-y-6 pt-6 border-t border-border">
                <h3 className="text-lg font-medium text-foreground">Canvas Settings</h3>
                <div className="space-y-4">
                  <div>
                    <div className="mt-2">
                      <FileUpload
                        label="Background Image (Optional)"
                        type="background"
                        currentUrl={layoutBackgroundImageUrl}
                        onUploadSuccess={(url) => setValue('layoutBackgroundImageUrl', url, { shouldDirty: true })}
                        onRemove={() => setValue('layoutBackgroundImageUrl', '', { shouldDirty: true })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Background Color</Label>
                    <div className="mt-2">
                      <WalletColorPicker
                        value={layoutBackgroundColor || ''}
                        onChange={(hex) => setValue('layoutBackgroundColor', hex, { shouldDirty: true })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        {/* â”€â”€ Media â”€â”€ */}
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

      {/* â”€â”€ Basic Info â”€â”€ */}
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
            <Input id="companyName" {...register('companyName')} placeholder="Anoya" />
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

      {/* â”€â”€ Contact Info â”€â”€ */}
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
            <Input id="websiteUrl" type="url" {...register('websiteUrl')} placeholder="https://anoya.ae" />
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
            <Input id="instagramUrl" type="url" {...register('instagramUrl')} placeholder="https://instagram.com/anoya" />
            {errors.instagramUrl && <p className="text-sm text-red-500">{errors.instagramUrl.message}</p>}
          </div>
        </div>
      </div>

      {/* â”€â”€ Profile Settings â”€â”€ */}
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
                anoya.ae/p/
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
      </div>

      <div className={activeTab === 'wallet' ? 'space-y-8' : 'hidden'}>
      {/* â”€â”€ Google Wallet Appearance â”€â”€ */}
      <div className="bg-card text-card-foreground border border-border shadow-sm rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Google Wallet Appearance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize how your card looks in Google Wallet. All fields are optional.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="walletThemeColor">Background Color</Label>
              <WalletColorPicker
                value={walletThemeColor || ''}
                onChange={(hex) => setValue('walletThemeColor', hex, { shouldDirty: true })}
              />
              <p className="text-xs text-muted-foreground">
                When not set, Google Wallet uses an automatic dominant-color fallback.
              </p>
              {errors.walletThemeColor && (
                <p className="text-sm text-red-500">{errors.walletThemeColor.message}</p>
              )}
            </div>

            {/* Hero Image */}
            <div className="space-y-2">
              <Label>Wallet Image</Label>
              <p className="text-xs text-muted-foreground">
                Optional. Add an image that appears on your Google Wallet pass. PNG is recommended.
              </p>
              <WalletHeroUpload
                currentUrl={walletHeroImageUrl}
                onUploadSuccess={(url) => setValue('walletHeroImageUrl', url, { shouldDirty: true })}
                onRemove={() => setValue('walletHeroImageUrl', '', { shouldDirty: true })}
              />
            </div>
          </div>

          {/* Live preview */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Live Preview</p>
            <WalletPreview
              name={[firstName, lastName].filter(Boolean).join(' ') || initialData?.firstName || 'Your Name'}
              jobTitle={jobTitle || initialData?.jobTitle}
              company={companyName || initialData?.companyName}
              profilePhotoUrl={profilePhotoUrl || initialData?.profilePhotoUrl}
              companyLogoUrl={companyLogoUrl || initialData?.companyLogoUrl}
              walletThemeColor={walletThemeColor || undefined}
              walletHeroImageUrl={walletHeroImageUrl || undefined}
            />
          </div>
        </div>
      </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-12">
        <div className="w-full sm:w-auto">
          {initialData?.id && !initialData.isDefault && (
            <Dialog>
              <DialogTrigger className={buttonVariants({ variant: 'ghost', className: 'text-red-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto' })}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Profile
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete this profile, including all of its analytics, history, and connections.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose className={buttonVariants({ variant: 'outline' })} disabled={isDeleting}>
                    Cancel
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row gap-4 w-full sm:w-auto">
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
                />
              </div>
            </SheetContent>
          </Sheet>

          <Button type="submit" disabled={isSaving} size="lg" className="w-full sm:w-auto">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </form>
  );
}







