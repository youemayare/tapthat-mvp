import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getGoogleWalletSaveUrl } from '@/lib/wallet/google';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // Fetch the profile
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Construct the payload
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

    const saveUrl = getGoogleWalletSaveUrl({
      id: profile.id,
      name,
      jobTitle: profile.jobTitle,
      company: profile.companyName,
      slug: profile.slug,
    });

    // Redirect the user to the Google Wallet save link
    return NextResponse.redirect(saveUrl);
  } catch (error) {
    console.error('[Google Wallet] Error generating link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
