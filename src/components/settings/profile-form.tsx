'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProfileFormProps {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [name, setName] = useState(initialName || '');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Name cannot be empty');
      return;
    }
    if (trimmedName.length > 50) {
      toast.error('Name must be 50 characters or less');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: trimmedName }),
      });

      if (!res.ok) throw new Error('Failed to update name');
      
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Something went wrong updating your profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            placeholder="John Doe"
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 flex justify-between">
            <span>Email</span>
            <span className="text-xs text-muted-foreground font-normal">Read-only</span>
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-muted-foreground cursor-not-allowed opacity-70"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Email changes are temporarily unavailable. Contact support if you need to update your account email.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving || name.trim() === initialName}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
