'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, User, CheckCircle2, Archive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
}

interface Props {
  profiles: Profile[];
}

export function ProfileList({ profiles: initialProfiles }: Props) {
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
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> New Profile
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-card border border-indigo-500/30 rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-3">Create a new profile</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Give this profile a label (e.g., "Business", "Student", "Creator").
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
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!label.trim() || creating}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
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

      {/* Profile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profiles.map((p) => {
          const isArchived = !!p.archivedAt;
          return (
            <Link
              key={p.id}
              href={`/dashboard/profile?id=${p.id}`}
              className={`group bg-card border rounded-2xl p-5 hover:border-indigo-500/30 transition-all flex flex-col gap-2 ${isArchived ? 'border-border opacity-60' : 'border-border hover:bg-accent/20'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    {isArchived
                      ? <Archive className="w-5 h-5 text-muted-foreground" />
                      : <User className="w-5 h-5 text-indigo-400" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{getDisplayName(p)}</p>
                    {p.jobTitle && <p className="text-sm text-muted-foreground truncate">{p.jobTitle}</p>}
                  </div>
                </div>
                {p.isDefault && (
                  <span className="flex items-center gap-1 text-xs text-indigo-400 font-medium shrink-0">
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}
