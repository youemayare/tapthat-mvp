import jwt from 'jsonwebtoken';

interface ProfileData {
  id: string;
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  slug?: string | null;
  cardUid?: string; // Optional if we still want it
  profilePhotoUrl?: string | null;
  companyLogoUrl?: string | null;
}

export function getGoogleWalletSaveUrl(profile: ProfileData): string {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  // Handle escaped newlines in env variables for private keys and strip accidental quotes
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/(^"|"$)/g, '');

  if (!issuerId || !clientEmail || !privateKey) {
    console.warn('[Wallet] Google Wallet credentials missing. Using local mock mode.');
    return '#mock-google-wallet-link';
  }

  // 2. We use a v2 suffix to bust Google's aggressive caching of the old layout
  const classId = `${issuerId}.anoya_business_card_v2`;
  const objectId = `${issuerId}.${profile.id.replace(/-/g, '')}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anoya.com';
  const profileUrl = `${appUrl}/p/${profile.slug || profile.id}`;

  // Generic Class (The Template)
  const walletClass = {
    id: classId,
    // Removed classTemplateOverride so it uses the beautiful default Google Wallet layout
  };

  // Determine which logo to show (prefer company logo, fallback to profile photo, fallback to Anoya icon)
  const displayLogo = profile.companyLogoUrl || profile.profilePhotoUrl || 'https://i.imgur.com/4tGqO5C.png';

  // Construct the GenericObject payload
  const walletObject = {
    id: objectId,
    classId: classId,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#000000',
    logo: {
      sourceUri: {
        uri: displayLogo
      }
    },
    cardTitle: {
      defaultValue: {
        language: 'en',
        value: 'Anoya Digital Business Card'
      }
    },
    header: {
      defaultValue: {
        language: 'en',
        value: profile.name || 'Anonymous'
      }
    },
    subheader: {
      defaultValue: {
        language: 'en',
        value: [profile.jobTitle, profile.company].filter(Boolean).join(' at ') || 'Member'
      }
    },
    barcode: {
      type: 'QR_CODE',
      value: profileUrl,
      alternateText: 'Scan to connect'
    }
  };

  const claims = {
    iss: clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [],
    payload: {
      genericClasses: [walletClass],
      genericObjects: [walletObject]
    }
  };

  try {
    const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
  } catch (error) {
    console.error('[Wallet] Error signing JWT for Google Wallet:', error);
    return '#mock-google-wallet-link'; // Fallback so we don't break the UI
  }
}
