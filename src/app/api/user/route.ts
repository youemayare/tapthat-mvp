import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName } = await req.json();

    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const trimmedName = fullName.trim().slice(0, 50);

    // Update the database securely using the authenticated user's ID
    await db
      .update(users)
      .set({ fullName: trimmedName, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Optionally update Supabase auth metadata to stay in sync
    await supabase.auth.updateUser({
      data: { full_name: trimmedName }
    });

    return NextResponse.json({ success: true, fullName: trimmedName });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
