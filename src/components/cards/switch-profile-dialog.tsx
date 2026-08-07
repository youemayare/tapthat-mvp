'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ChevronRight, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileOption {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  isPublished: boolean;
  isDefault: boolean;
}

interface Props {
  cardId: string;
  cardUid: string;
  cardType: string | null;
  currentProfileId: string | null;
  profiles: ProfileOption[];
  onSuccess: (newProfileId: string) => void;
  onClose: () => void;
}

type Step = 'select' | 'confirm' | 'done';

export function SwitchProfileDialog({
  cardId,
  cardUid,
  cardType,
  currentProfileId,
  profiles,
  onSuccess,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>('select');
  const [selectedProfile, setSelectedProfile] = useState<ProfileOption | null>(null);
  const [switching, setSwitching] = useState(false);

  // Only show published, non-archived profiles that aren't the current one
  const eligible = profiles.filter(
    (p) => p.isPublished && p.id !== currentProfileId
  );

  const cardLabel = `${cardType ?? 'Card'} ···· ${cardUid.slice(-4).toUpperCase()}`;

  async function handleSwitch() {
    if (!selectedProfile || switching) return;
    setSwitching(true);
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: selectedProfile.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to switch profile');
        setSwitching(false);
        return;
      }

      setStep('done');
      onSuccess(selectedProfile.id);
    } catch {
      toast.error('Network error. Please try again.');
      setSwitching(false);
    }
  }

  function getProfileDisplayName(p: ProfileOption) {
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
    return p.label ?? name ?? 'Unnamed Profile';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl">

        {/* ── Step 1: Select a profile ── */}
        {step === 'select' && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-1">Switch Active Profile</h2>
            <p className="text-muted-foreground text-sm mb-5">
              Select which profile should appear when{' '}
              <span className="text-foreground font-medium">{cardLabel}</span> is tapped.
            </p>

            {eligible.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No other published profiles available.{' '}
                  Publish another profile first, then come back to switch.
                </p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {eligible.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfile(p)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                      selectedProfile?.id === p.id
                        ? 'border-indigo-500/60 bg-indigo-500/10'
                        : 'border-border hover:border-indigo-500/30 hover:bg-accent/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{getProfileDisplayName(p)}</p>
                      {p.jobTitle && (
                        <p className="text-sm text-muted-foreground truncate">{p.jobTitle}</p>
                      )}
                    </div>
                    {selectedProfile?.id === p.id && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-border text-muted-foreground hover:bg-accent transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedProfile}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Confirm ── */}
        {step === 'confirm' && selectedProfile && (
          <>
            <div className="flex items-start gap-3 mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300 leading-relaxed">
                <strong>Switch this card to the {getProfileDisplayName(selectedProfile)} profile?</strong>
                <br />
                Future taps will show this profile instead. People who already saved your
                previous profile will continue to see that profile — their connection won&apos;t change.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{getProfileDisplayName(selectedProfile)}</p>
                  {selectedProfile.jobTitle && (
                    <p className="text-sm text-muted-foreground">{selectedProfile.jobTitle}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                disabled={switching}
                className="flex-1 py-3 px-4 rounded-2xl border border-border text-muted-foreground hover:bg-accent transition-all text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSwitch}
                disabled={switching}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold transition-all"
              >
                {switching ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Switching…</>
                ) : (
                  'Confirm Switch'
                )}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && selectedProfile && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Profile Switched!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              <span className="font-medium text-foreground">{cardLabel}</span> now shows the{' '}
              <span className="font-medium text-foreground">{getProfileDisplayName(selectedProfile)}</span> profile.
              Future taps will see this persona.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-card border border-border text-foreground hover:bg-accent transition-all text-sm font-semibold"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
