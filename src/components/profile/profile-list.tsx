'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, User, CheckCircle2, Archive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Profile {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  slug: string | null;
  isPublished: boolean;
  isDefault: boolean;
  archivedAt: Date | null;
  profilePhotoUrl: string | null;
}

interface Props {
  profiles: Profile[];
  hasCards?: boolean;
}

export function ProfileList({ profiles: initialProfiles, hasCards = true }: Props) {
  const router = useRouter();
  const [profiles] = useState<Profile[]>(initialProfiles);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [label, setLabel] = useState('');

  function getDisplayName(p: Profile): string {
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
    return p.label ?? name ?? 'Unnamed Profile';
  }

  async function handleCreate() {
    if (!label.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to create profile');
        return;
      }

      const data = await res.json();
      toast.success(`"${label.trim()}" profile created!`);
      setLabel('');
      setShowCreateForm(false);
      router.push(`/dashboard/profile?id=${data.profile.id}`);
      router.refresh();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {hasCards && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> New Profile
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && hasCards && (
        <div className="bg-card border border-brand-500/30 rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-3">Create a new profile</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Give this profile a label (e.g., &quot;Business&quot;, &quot;Student&quot;, &quot;Creator&quot;).
            You&apos;ll set the profile content after creating it.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreateForm(false); }}
              placeholder="e.g. Business"
              maxLength={50}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!label.trim() || creating}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setLabel(''); }}
              className="px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:bg-accent text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty States */}
      {profiles.length === 0 && !hasCards && (
        <div className="mt-8 flex flex-col items-center justify-center p-12 bg-card/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl text-center">
          <div className="w-16 h-16 bg-black/5 dark:bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex items-center justify-center mb-6">
            <User className="w-8 h-8 text-foreground/70" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-3">Profile Locked</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            No cards found. Get a Anoya card to unlock your digital profile and start sharing your contact info with a simple tap.
          </p>
          <a
            href="https://tapthat.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-xl transition-colors"
          >
            Get My Card
          </a>
        </div>
      )}

      {profiles.length > 0 && !hasCards && (
        <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">To create additional profiles, add a Anoya card to your account.</p>
          <a
            href="https://tapthat.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground hover:text-brand-400 transition-colors"
          >
            Get a Card
          </a>
        </div>
      )}

      {/* Profile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profiles.map((p) => {
          const isArchived = !!p.archivedAt;
          return (
            <Link
              key={p.id}
              href={`/dashboard/profile?id=${p.id}`}
              className="block outline-none"
            >
              <motion.div
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className={`group bg-card border rounded-2xl p-5 hover:border-brand-500/30 transition-colors flex flex-col gap-2 h-full ${isArchived ? 'border-border opacity-60' : 'border-border hover:bg-accent/20'}`}
              >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.profilePhotoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={p.profilePhotoUrl} 
                        alt={getDisplayName(p)} 
                        className={`w-full h-full object-cover ${isArchived ? 'grayscale opacity-60' : ''}`} 
                      />
                    ) : isArchived ? (
                      <Archive className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <User className="w-5 h-5 text-brand-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{getDisplayName(p)}</p>
                    {p.jobTitle && <p className="text-sm text-muted-foreground truncate">{p.jobTitle}</p>}
                  </div>
                </div>
                {p.isDefault && (
                  <span className="flex items-center gap-1 text-xs text-brand-400 font-medium shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Default
                  </span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isArchived
                  ? 'bg-gray-500/10 text-gray-400'
                  : p.isPublished
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                  {isArchived ? 'Archived' : p.isPublished ? 'Published' : 'Draft'}
                </span>
                {p.slug && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground font-mono">
                    /p/{p.slug}
                  </span>
                )}
              </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
