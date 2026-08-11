'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ZapOff, Play, ShieldAlert, CreditCard, RefreshCw, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SwitchProfileDialog } from './switch-profile-dialog';

interface Card {
  id: string;
  cardType: string | null;
  cardUid: string;
  status: string;
  profileId: string | null;
  activatedAt: Date | null;
}

interface ProfileOption {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  isPublished: boolean;
  isDefault: boolean;
}

interface CardListProps {
  initialCards: Card[];
  /** Only provided when MULTI_PROFILE_ENABLED=true */
  profiles?: ProfileOption[];
  multiProfileEnabled?: boolean;
}

export function CardList({ initialCards, profiles = [], multiProfileEnabled = false }: CardListProps) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // Status change dialog
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    cardId: string;
    action: 'active' | 'deactivated' | 'revoked';
    title: string;
    message: string;
    confirmText: string;
    isDestructive?: boolean;
  } | null>(null);

  // Profile switch dialog
  const [switchingCard, setSwitchingCard] = useState<Card | null>(null);

  // ─── Status Change ──────────────────────────────────────────────────────────

  async function executeStatusChange(cardId: string, newStatus: 'active' | 'deactivated' | 'revoked') {
    setIsUpdatingId(cardId);
    setDialogConfig(null);

    const previousCards = [...cards];
    setCards(current =>
      current.map(card => card.id === cardId ? { ...card, status: newStatus } : card)
    );

    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update card status');
      }

      toast.success(`Card status updated to ${newStatus}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
      setCards(previousCards);
    } finally {
      setIsUpdatingId(null);
    }
  }

  function handleDeactivateClick(cardId: string) {
    setDialogConfig({
      isOpen: true, cardId, action: 'deactivated',
      title: 'Deactivate this card?',
      message: 'This card will stop working temporarily. You can activate it again later.',
      confirmText: 'Deactivate card',
    });
  }

  function handleActivateClick(cardId: string) {
    setDialogConfig({
      isOpen: true, cardId, action: 'active',
      title: 'Activate this card?',
      message: 'This card will become usable again and its NFC link will be restored.',
      confirmText: 'Activate card',
    });
  }

  function handleRevokeClick(cardId: string) {
    setDialogConfig({
      isOpen: true, cardId, action: 'revoked',
      title: 'Permanently revoke this card?',
      message: 'This action cannot be undone. The card will remain unusable permanently. If you need a replacement, contact support.',
      confirmText: 'Revoke permanently',
      isDestructive: true,
    });
  }

  // ─── Profile Switch (multi-profile only) ───────────────────────────────────

  function handleSwitchProfileClick(card: Card) {
    setSwitchingCard(card);
  }

  function handleProfileSwitchSuccess(cardId: string, newProfileId: string) {
    setCards(current =>
      current.map(card => card.id === cardId ? { ...card, profileId: newProfileId } : card)
    );
    router.refresh();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function getActiveProfileLabel(profileId: string | null): string {
    if (!profileId) return 'No profile set';
    const p = profiles.find(p => p.id === profileId);
    if (!p) return 'Unknown profile';
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
    return p.label ?? name ?? 'Unnamed Profile';
  }

  if (cards.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center p-12 bg-card/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl text-center">
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6">
          <CreditCard className="w-8 h-8 text-foreground/70" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">No Cards Found</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-2 leading-relaxed">
          You don&apos;t have any registered cards yet.
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
          Tap your physical TapThat card to claim it, or purchase a new one to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <a
            href="https://tapthat.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-xl transition-colors"
          >
            Purchase Card
          </a>
          <button
            onClick={() => router.push('/claim')}
            className="inline-flex items-center justify-center px-6 py-3 bg-white/5 border border-white/10 text-foreground hover:bg-white/10 font-medium rounded-xl transition-colors"
          >
            Claim Card
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const isPending = isUpdatingId === card.id;
          const maskedUid = `•••• ${card.cardUid.slice(-4)}`;

          let statusBadgeColor = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
          if (card.status === 'active') statusBadgeColor = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
          if (card.status === 'deactivated') statusBadgeColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400';
          if (card.status === 'revoked') statusBadgeColor = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';

          return (
            <div key={card.id} className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground capitalize">
                        {card.cardType === 'metal' ? 'Premium Metal Card' : `${card.cardType || 'Standard'} Card`}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">UID: {maskedUid}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadgeColor}`}>
                    {card.status}
                  </span>
                </div>

                {/* Active profile indicator (multi-profile only) */}
                {multiProfileEnabled && card.status !== 'revoked' && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-muted/40 rounded-lg">
                    <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Active profile: <span className="text-foreground font-medium">{getActiveProfileLabel(card.profileId)}</span>
                    </span>
                  </div>
                )}

                {card.activatedAt && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Activated on: {new Date(card.activatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {/* Switch Profile button — only when multi-profile is enabled and card is active/deactivated */}
                {multiProfileEnabled && card.status !== 'revoked' && profiles.length > 1 && (
                  <button
                    onClick={() => handleSwitchProfileClick(card)}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mb-1"
                  >
                    <RefreshCw className="w-4 h-4" /> Switch Profile
                  </button>
                )}

                {card.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleDeactivateClick(card.id)}
                      disabled={isPending}
                      className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <ZapOff className="w-4 h-4 mr-2" /> Deactivate
                    </button>
                    <button
                      onClick={() => handleRevokeClick(card.id)}
                      disabled={isPending}
                      className="flex-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" /> Revoke
                    </button>
                  </>
                )}

                {card.status === 'deactivated' && (
                  <>
                    <button
                      onClick={() => handleActivateClick(card.id)}
                      disabled={isPending}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 mr-2" /> Activate
                    </button>
                    <button
                      onClick={() => handleRevokeClick(card.id)}
                      disabled={isPending}
                      className="flex-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" /> Revoke
                    </button>
                  </>
                )}

                {card.status === 'revoked' && (
                  <div className="w-full text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 mr-2" /> Permanently Revoked
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Change Confirmation Dialog */}
      {dialogConfig && dialogConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-foreground mb-2">{dialogConfig.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{dialogConfig.message}</p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => setDialogConfig(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => executeStatusChange(dialogConfig.cardId, dialogConfig.action)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  dialogConfig.isDestructive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {dialogConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Profile Dialog (multi-profile only) */}
      {switchingCard && (
        <SwitchProfileDialog
          cardId={switchingCard.id}
          cardUid={switchingCard.cardUid}
          cardType={switchingCard.cardType}
          currentProfileId={switchingCard.profileId}
          profiles={profiles}
          onSuccess={(newProfileId) => handleProfileSwitchSuccess(switchingCard.id, newProfileId)}
          onClose={() => setSwitchingCard(null)}
        />
      )}
    </>
  );
}
