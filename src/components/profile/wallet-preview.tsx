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

  return (
    <div className="space-y-2">
      {/* Google Wallet pass approximation (Matches ACTUAL Google Wallet layout) */}
      <div className="rounded-2xl overflow-hidden shadow-xl w-full max-w-xs mx-auto select-none border border-border/20 bg-white">
        
        {/* ── Top header bar: logo + cardTitle ─────────────────────────────── */}
        <div className="px-4 py-3 flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
          )}
          <span className="text-xs font-medium text-gray-800 leading-tight">
            [TEST ONLY] Anoya Digital Business Card
          </span>
        </div>

        {/* ── Content: name, title ─────────────────────────────────────── */}
        <div className="px-4 pt-2 pb-4 space-y-1">
          {/* Subheader (job at company) */}
          <p className="text-xs leading-tight text-gray-800">
            {subheader}
          </p>

          {/* Header — name (large) */}
          <p className="text-2xl font-normal leading-tight text-black">
            {name || 'Your Name'}
          </p>
        </div>

        {/* ── QR placeholder ───────────────────────────────────────────── */}
        <div className="flex justify-center py-2">
          <div className="rounded-lg p-2 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-40 h-40 text-black" fill="currentColor">
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
        <p className="text-sm font-medium text-black text-center pb-6">
          Scan to connect
        </p>
        
        {/* ── Hero image (At BOTTOM, matching Google Wallet) ─────────────── */}
        {bannerUrl && (
          <div className="relative w-full" style={{ aspectRatio: '1032/400' }}>
            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center text-white/50 text-xs">
              Loading image...
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={bannerUrl} 
              alt="Banner" 
              className="absolute inset-0 w-full h-full object-cover z-10"
              style={{ backgroundColor: bgColor }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Preview approximation. Matches actual Google Wallet rendering constraints.
      </p>
    </div>
  );
}