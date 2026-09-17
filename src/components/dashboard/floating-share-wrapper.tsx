import { createClient } from '@/lib/supabase/server';
import { FloatingShareButton } from './floating-share-button';

export async function FloatingShareWrapper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch all published profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_published', true); // Note: column is is_published

  // Fetch the user's custom handle
  const { data: userData } = await supabase
    .from('users')
    .select('handle')
    .eq('id', user.id)
    .single();

  if (!profiles || profiles.length === 0) return null;

  return <FloatingShareButton profiles={profiles} handle={userData?.handle} />;
}
