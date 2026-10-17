import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { getGoogleWalletSaveUrl, patchGoogleWalletObject } from '@/lib/wallet/google';
import { publicProfileRatelimit } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { logError, generateRequestId } from '@/lib/security';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const requestId = generateRequestId();

  try {
    const { profileId } = await params;

    if (!profileId || profileId.length > 100) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isUUID = UUID_RE.test(profileId);
    if (!isUUID && !/^[a-zA-Z0-9_-]+$/.test(profileId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Rate limit per IP (uses fail-open publicProfileRatelimit so Redis hiccups never break UX)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
    const { success: allowed, reset } = await publicProfileRatelimit.limit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
        }
      );
    }

    // Fetch non-archived profile by UUID or slug
    const profile = await db.query.profiles.findFirst({
      where: and(
        isUUID ? eq(profiles.id, profileId) : eq(profiles.slug, profileId),
        isNull(profiles.archivedAt)
      ),
    });

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Enforce published status for public visitors; allow the authenticated owner to preview their own draft pass
    if (!profile.isPublished) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== profile.userId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'My Profile';

    const walletProfileData = {
      id: profile.id,
      name,
      jobTitle: profile.jobTitle,
      company: profile.companyName,
      slug: profile.slug,
      profilePhotoUrl: profile.profilePhotoUrl,
      companyLogoUrl: profile.companyLogoUrl,
      walletThemeColor: profile.walletThemeColor,
      walletHeroImageUrl: profile.walletHeroImageUrl,
      phone: profile.phone,
      email: profile.email,
      websiteUrl: profile.websiteUrl,
      linkedinUrl: profile.linkedinUrl,
      whatsapp: profile.whatsapp,
      updatedAt: profile.updatedAt,
    };

    // Ensure any already-created object on Google's servers reflects the latest profile data
    await patchGoogleWalletObject(walletProfileData);

    const saveUrl = getGoogleWalletSaveUrl(walletProfileData);

    // In local dev without Google Wallet credentials, getGoogleWalletSaveUrl returns '#mock-google-wallet-link'
    if (saveUrl.startsWith('#')) {
      return NextResponse.redirect(
        new URL(`/p/${profile.slug || profile.id}${saveUrl}`, request.url)
      );
    }

    return NextResponse.redirect(saveUrl);
  } catch (error: unknown) {
    logError({ operation: 'wallet.google.GET', requestId, error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
