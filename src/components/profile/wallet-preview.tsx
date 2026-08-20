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

/** Determines if a URL points to a Google Wallet-compatible image (not WebP). */
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
  const bgColor = walletThemeColor && /^#[0-9A-Fa-f]{6}$/.test(walletThemeColor)
    ? walletThemeColor
    : '#1c1c1e';

  const logoUrl = isValidWalletImage(companyLogoUrl)
    ? companyLogoUrl
    : isValidWalletImage(profilePhotoUrl)
    ? profilePhotoUrl
    : null;

  const subheader = [jobTitle, company].filter(Boolean).join(' at ') || 'Member';

  return (
    <div className="space-y-2">
      {/* The preview card */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl w-full max-w-xs mx-auto select-none"
        style={{ backgroundColor: bgColor }}
      >
        {/* Hero image */}
        {isValidWalletImage(walletHeroImageUrl) && (
          <div className="w-full" style={{ aspectRatio: '1032/812' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={walletHeroImageUrl}
              alt="Wallet hero"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Card body */}
        <div className="p-4 space-y-3">
          {/* Header row: logo + card title */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex-shrink-0" />
            )}
            <span className="text-white/60 text-xs font-medium leading-tight">
              Anoya Digital Business Card
            </span>
          </div>

          {/* Name + subheader */}
          <div>
            <p className="text-white/60 text-xs">{subheader}</p>
            <p className="text-white font-semibold text-lg leading-tight">{name || 'Your Name'}</p>
          </div>

          {/* QR placeholder */}
          <div className="flex items-center justify-center bg-white rounded-xl p-3 mt-2">
            <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-16 h-16 text-gray-400" fill="currentColor">
                <rect x="0" y="0" width="26" height="26" rx="2"/>
                <rect x="38" y="0" width="26" height="26" rx="2"/>
                <rect x="0" y="38" width="26" height="26" rx="2"/>
                <rect x="5" y="5" width="16" height="16" rx="1" fill="white"/>
                <rect x="43" y="5" width="16" height="16" rx="1" fill="white"/>
                <rect x="5" y="43" width="16" height="16" rx="1" fill="white"/>
                <rect x="8" y="8" width="10" height="10" rx="1"/>
                <rect x="46" y="8" width="10" height="10" rx="1"/>
                <rect x="8" y="46" width="10" height="10" rx="1"/>
                <rect x="38" y="38" width="6" height="6"/>
                <rect x="46" y="38" width="6" height="6"/>
                <rect x="38" y="46" width="6" height="6"/>
                <rect x="58" y="38" width="6" height="6"/>
                <rect x="46" y="50" width="6" height="6"/>
                <rect x="54" y="46" width="10" height="4"/>
              </svg>
            </div>
          </div>
          <p className="text-white/50 text-xs text-center">Scan to connect</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Preview approximation. Final appearance may vary in Google Wallet.
      </p>
    </div>
  );
}
