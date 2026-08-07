'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export function SessionManager() {
  const router = useRouter();
  const [isSigningOutLocal, setIsSigningOutLocal] = useState(false);
  const [isSigningOutGlobal, setIsSigningOutGlobal] = useState(false);

  async function handleSignOut(scope: 'local' | 'global') {
    if (scope === 'local') setIsSigningOutLocal(true);
    else setIsSigningOutGlobal(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.signOut({ scope });
      if (error) throw new Error(error.message);
      
      router.push('/login');
      router.refresh(); // clear cached pages
    } catch (err: any) {
      toast.error(err.message || 'Error signing out');
      setIsSigningOutLocal(false);
      setIsSigningOutGlobal(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 mt-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Sessions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your active sessions and devices.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg bg-background">
          <div>
            <p className="font-medium text-foreground">Sign out of this device</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ends your session on this browser only.</p>
          </div>
          <button
            onClick={() => handleSignOut('local')}
            disabled={isSigningOutLocal || isSigningOutGlobal}
            className="mt-3 sm:mt-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center min-w-[120px]"
          >
            {isSigningOutLocal ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" /> Sign Out</>}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-red-200/50 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-950/20">
          <div>
            <p className="font-medium text-red-600 dark:text-red-400">Sign out everywhere</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">Ends all active sessions across all your devices.</p>
          </div>
          <button
            onClick={() => handleSignOut('global')}
            disabled={isSigningOutLocal || isSigningOutGlobal}
            className="mt-3 sm:mt-0 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center min-w-[150px]"
          >
            {isSigningOutGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldAlert className="w-4 h-4 mr-2" /> Sign Out All</>}
          </button>
        </div>
      </div>
    </div>
  );
}
