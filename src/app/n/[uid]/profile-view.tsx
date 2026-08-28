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
export function ProfileView({ profile, cardUid }: Props) {
  if (profile.profileLayout === 'identity') {
    return <IdentityProfileLayout profile={profile} cardUid={cardUid} />;
  }
  
  if (profile.profileLayout === 'canvas') {
    return <CanvasProfileLayout profile={profile} cardUid={cardUid} />;
  }
  
  return <ClassicProfileLayout profile={profile} cardUid={cardUid} />;
}
