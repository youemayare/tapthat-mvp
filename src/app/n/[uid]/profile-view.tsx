'use client';

import type { Profile } from '@/lib/db/schema';
import { ClassicProfileLayout } from '@/components/profile/layouts/classic-profile-layout';
import { IdentityProfileLayout } from '@/components/profile/layouts/identity-profile-layout';
import { CanvasProfileLayout } from '@/components/profile/layouts/canvas-profile-layout';

interface Props {
  profile: Partial<Profile> & { id: string; userId: string };
  cardUid: string;
}

/**
 * ProfileView — public-facing profile card router.
 * Routes to Classic, Identity, or Canvas layout based on profile settings.
 */
export function ProfileView({ profile: rawProfile, cardUid }: Props) {
  // Apply visibility toggles: if a toggle is explicitly false, hide the field
  const profile = {
    ...rawProfile,
    phone: rawProfile.showPhone === false ? null : rawProfile.phone,
    whatsapp: rawProfile.showWhatsapp === false ? null : rawProfile.whatsapp,
    email: rawProfile.showEmail === false ? null : rawProfile.email,
    websiteUrl: rawProfile.showWebsite === false ? null : rawProfile.websiteUrl,
    linkedinUrl: rawProfile.showLinkedin === false ? null : rawProfile.linkedinUrl,
    instagramUrl: rawProfile.showInstagram === false ? null : rawProfile.instagramUrl,
  };

  if (profile.profileLayout === 'identity') {
    return <IdentityProfileLayout profile={profile as any} cardUid={cardUid} />;
  }
  
  if (profile.profileLayout === 'canvas') {
    return <CanvasProfileLayout profile={profile as any} cardUid={cardUid} />;
  }
  
  return <ClassicProfileLayout profile={profile as any} cardUid={cardUid} />;
}

