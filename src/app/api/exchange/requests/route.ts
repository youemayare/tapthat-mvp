import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contactExchanges, profiles } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get pending requests received by the user
  const requests = await db
    .select({
      exchange: contactExchanges,
      sourceProfile: profiles, // The person who sent the request
    })
    .from(contactExchanges)
    .leftJoin(profiles, eq(contactExchanges.sourceProfileId, profiles.id))
    .where(
      and(
        eq(contactExchanges.recipientUserId, user.id),
        eq(contactExchanges.status, 'pending')
      )
    )
    .orderBy(desc(contactExchanges.createdAt));

  return NextResponse.json({ requests });
}
