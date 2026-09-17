import { createClient } from '@/lib/supabase/server';
import { FloatingShareButton } from './floating-share-button';

export async function FloatingShareWrapper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch the default profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('isDefault', true)
    .single();

  // Fetch the user's custom handle if they have one
  const { data: userData } = await supabase
    .from('users')
    .select('handle')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return <FloatingShareButton activeProfile={profile} handle={userData?.handle} />;
}
