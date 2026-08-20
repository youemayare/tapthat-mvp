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

function getTextColor(hexColor: string) {
  // Remove hash if present
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return 'text-black';
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? 'text-black' : 'text-white';
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

  const textColorClass = getTextColor(bgColor);

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
      <div 
        className="rounded-2xl overflow-hidden shadow-xl w-full max-w-xs mx-auto select-none border border-border/20"
        style={{ backgroundColor: bgColor }}
      >
        
        {/* ── Top header bar: logo + cardTitle ─────────────────────────────── */}
        <div className={`px-4 py-3 flex items-center gap-2.5 ${textColorClass}`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-white" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex-shrink-0" />
          )}
          <span className="text-xs font-medium leading-tight opacity-90">
            [TEST ONLY] Anoya Digital Business Card
          </span>
        </div>

        {/* ── Content: name, title ─────────────────────────────────────── */}
        <div className={`px-4 pt-2 pb-4 space-y-1 ${textColorClass}`}>
          {/* Subheader (job at company) */}
          <p className="text-xs leading-tight opacity-80">
            {subheader}
          </p>

          {/* Header — name (large) */}
          <p className="text-2xl font-normal leading-tight">
            {name || 'Your Name'}
          </p>
        </div>

        {/* ── QR placeholder ───────────────────────────────────────────── */}
        <div className={`flex justify-center py-2 ${textColorClass}`}>
          <div className="rounded-lg p-3 flex flex-col items-center justify-center bg-white">
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
        <p className={`text-sm font-medium text-center pb-6 mt-2 ${textColorClass}`}>
          Scan to connect
        </p>
        
        {/* ── Hero image (At BOTTOM, matching Google Wallet) ─────────────── */}
        {bannerUrl && (
          <div className="relative w-full bg-black" style={{ aspectRatio: '1032/400' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={bannerUrl} 
              alt="Banner" 
              className="absolute inset-0 w-full h-full object-cover z-10"
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