'use client';

import { useState } from 'react';
import { Wallet, CheckCircle2, User, ExternalLink, X } from 'lucide-react';

export interface WalletProfileOption {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  profilePhotoUrl: string | null;
  isPublished: boolean;
  isDefault: boolean;
  isActiveOnCard: boolean;
  walletUrl: string;
}

interface GoogleWalletActionProps {
  profiles: WalletProfileOption[];
  defaultSelectedId?: string | null;
}

export function GoogleWalletAction({
  profiles,
  defaultSelectedId,
}: GoogleWalletActionProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultSelectedId ?? profiles[0]?.id ?? null
  );

  const selectedProfile =
    profiles.find((p) => p.id === selectedId) ?? profiles[0] ?? null;

  function getProfileDisplayName(p: WalletProfileOption) {
    const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
    if (p.label && fullName) {
      return `${p.label} (${fullName})`;
    }
    return p.label || fullName || 'Unnamed Profile';
  }

  function getProfileSubtitle(p: WalletProfileOption) {
    return [p.jobTitle, p.companyName].filter(Boolean).join(' at ');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!selectedId && profiles[0]) {
            setSelectedId(defaultSelectedId ?? profiles[0].id);
          }
          setOpen(true);
        }}
        className="group text-left bg-card text-card-foreground border border-border rounded-2xl p-5 hover:bg-primary/8 hover:border-brand-500/30 transition-all cursor-pointer"
      >
        <Wallet className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
        <h3 className="text-foreground font-semibold mb-1">Save to Google Wallet</h3>
        <p className="text-muted-foreground text-sm">
          Add your digital business card to your mobile wallet.
        </p>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-brand-400" />
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  Save to Google Wallet
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground text-sm mb-5">
              Select which profile you want to add to your Google Wallet.
            </p>

            {profiles.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">
                  You don&apos;t have any profiles set up yet. Create your profile first to generate a Google Wallet pass.
                </p>
                <a
                  href="/dashboard/profile"
                  className="inline-flex items-center justify-center py-2.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all"
                >
                  Set Up Profile
                </a>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
                  {profiles.map((p) => {
                    const isSelected = selectedProfile?.id === p.id;
                    const subtitle = getProfileSubtitle(p);

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-500/60 bg-brand-500/10'
                            : 'border-border hover:border-brand-500/30 hover:bg-accent/30'
                        }`}
                      >
                        {p.profilePhotoUrl ? (
                          <img
                            src={p.profilePhotoUrl}
                            alt={getProfileDisplayName(p)}
                            className="w-10 h-10 rounded-xl object-cover border border-border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-brand-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground text-sm truncate">
                              {getProfileDisplayName(p)}
                            </p>
                            {p.isActiveOnCard && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                Active on Card
                              </span>
                            )}
                            {!p.isPublished && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                Draft
                              </span>
                            )}
                          </div>
                          {subtitle && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {subtitle}
                            </p>
                          )}
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-3 px-4 rounded-2xl border border-border text-muted-foreground hover:bg-accent transition-all text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <a
                    href={selectedProfile ? `/api/wallet/google/${selectedProfile.id}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all"
                  >
                    Continue <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
