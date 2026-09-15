import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contactExchanges, profiles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get requests sent by the user
  const sent = await db
    .select({
      exchange: contactExchanges,
      targetProfile: profiles, // The person they sent it to
    })
    .from(contactExchanges)
    .leftJoin(profiles, eq(contactExchanges.recipientProfileId, profiles.id))
    .where(eq(contactExchanges.sourceUserId, user.id))
    .orderBy(desc(contactExchanges.createdAt));

  return NextResponse.json({ sent });
}
