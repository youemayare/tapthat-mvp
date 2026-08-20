'use client';

interface WalletPreviewProps {
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  profilePhotoUrl?: string | null;
  companyLogoUrl?: string | null;
  walletThemeColor?: string | null;
  walletHeroImageUrl?: string | null;
}

function isValidWalletImage(url?: string | null): url is string {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg');
}

export function WalletPreview({
  name,
  jobTitle,
  company,
  profilePhotoUrl,
  companyLogoUrl,
  walletThemeColor,
  walletHeroImageUrl,
}: WalletPreviewProps) {
  const bgColor =
    walletThemeColor && /^#[0-9A-Fa-f]{6}$/.test(walletThemeColor)
      ? walletThemeColor
      : '#0f0f19';

  const logoUrl = isValidWalletImage(companyLogoUrl)
    ? companyLogoUrl
    : isValidWalletImage(profilePhotoUrl)
    ? profilePhotoUrl
    : null;

  const subheader = [jobTitle, company].filter(Boolean).join(' at ') || 'Member';
  const bannerUrl = isValidWalletImage(walletHeroImageUrl) ? walletHeroImageUrl : null;
  const pfpUrl = isValidWalletImage(profilePhotoUrl) ? profilePhotoUrl : null;

  // Show the composite hero (banner + PFP) only when there is something to show
  const showHero = bannerUrl || pfpUrl;

  return (
    <div className="space-y-2">
      {/* Google Wallet pass approximation */}
      <div className="rounded-2xl overflow-hidden shadow-xl w-full max-w-xs mx-auto select-none border border-border/20">
        
        {/* ── Top header bar: logo + cardTitle ─────────────────────────────── */}
        <div className="bg-white dark:bg-neutral-900 px-4 py-3 flex items-center gap-2.5 border-b border-border/10">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
          )}
          <span className="text-xs font-medium text-gray-500 leading-tight">
            Anoya Digital Business Card
          </span>
        </div>

        {/* ── Hero composite: banner + overlapping circular PFP ─────────────── */}
        {showHero && (
          <div className="relative">
            {/* Banner */}
            <div
              className="w-full"
              style={{ backgroundColor: bgColor, aspectRatio: '1032/400' }}
            >
              {bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Circular PFP overlapping the banner */}
            {pfpUrl && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2"
                style={{ zIndex: 10 }}
              >
                <div className="rounded-full border-4 border-white dark:border-neutral-900 overflow-hidden shadow-lg"
                  style={{ width: 64, height: 64 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Content: name, title, QR ─────────────────────────────────────── */}
        <div
          className="px-4 pt-10 pb-4 space-y-1 text-center"
          style={{ backgroundColor: showHero ? '#ffffff' : bgColor }}
        >
          {/* Subheader (job at company) */}
          <p
            className="text-xs leading-tight"
            style={{ color: showHero ? '#6b7280' : 'rgba(255,255,255,0.6)' }}
          >
            {subheader}
          </p>

          {/* Header — name (large) */}
          <p
            className="text-lg font-bold leading-tight"
            style={{ color: showHero ? '#111827' : '#ffffff' }}
          >
            {name || 'Your Name'}
          </p>

          {/* QR placeholder */}
          <div className="flex justify-center py-3">
            <div
              className="rounded-lg p-2 flex items-center justify-center"
              style={{ backgroundColor: showHero ? '#f9fafb' : 'rgba(255,255,255,0.1)' }}
            >
              <svg viewBox="0 0 48 48" className="w-14 h-14" style={{ color: showHero ? '#1f2937' : 'rgba(255,255,255,0.7)' }} fill="currentColor">
                <rect x="0" y="0" width="20" height="20" rx="2"/>
                <rect x="28" y="0" width="20" height="20" rx="2"/>
                <rect x="0" y="28" width="20" height="20" rx="2"/>
                <rect x="4" y="4" width="12" height="12" rx="1" fill="white"/>
                <rect x="32" y="4" width="12" height="12" rx="1" fill="white"/>
                <rect x="4" y="32" width="12" height="12" rx="1" fill="white"/>
                <rect x="7" y="7" width="6" height="6" rx="0.5"/>
                <rect x="35" y="7" width="6" height="6" rx="0.5"/>
                <rect x="7" y="35" width="6" height="6" rx="0.5"/>
                <rect x="28" y="28" width="5" height="5"/>
                <rect x="34" y="28" width="5" height="5"/>
                <rect x="28" y="34" width="5" height="5"/>
                <rect x="43" y="28" width="5" height="5"/>
                <rect x="34" y="37" width="5" height="5"/>
                <rect x="40" y="34" width="8" height="4"/>
              </svg>
            </div>
          </div>
          <p
            className="text-xs"
            style={{ color: showHero ? '#9ca3af' : 'rgba(255,255,255,0.4)' }}
          >
            Scan to connect
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Preview approximation. Final appearance may vary in Google Wallet.
      </p>
    </div>
  );
}