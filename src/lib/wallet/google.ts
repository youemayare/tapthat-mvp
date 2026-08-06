import jwt from 'jsonwebtoken';

interface ProfileData {
  id: string;
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  cardUid: string; // The public UID for the QR code
}

/**
 * Generates a Google Wallet "Save to Wallet" URL containing a signed JWT.
 * If Google Wallet credentials are not configured, returns a mock URL for development.
 */
export function getGoogleWalletSaveUrl(profile: ProfileData): string {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Handle escaped newlines in env variables for private keys
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Local Mock Mode
  if (!issuerId || !clientEmail || !privateKey) {
    console.warn('[Wallet] Google Wallet credentials missing. Using local mock mode.');
    return '#mock-google-wallet-link';
  }

  const classId = `${issuerId}.tapthat_contact`;
  const objectId = `${issuerId}.${profile.id.replace(/-/g, '')}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tapthat.app';

  // Construct the GenericObject payload
  const walletObject = {
    id: objectId,
    classId: classId,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#000000',
    logo: {
      sourceUri: {
        uri: 'https://cdn-icons-png.flaticon.com/512/1055/1055661.png' // A generic contact icon for now
      }
    },
    cardTitle: {
      defaultValue: {
        language: 'en',
        value: 'TapThat Contact Card'
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
        value: [profile.jobTitle, profile.company].filter(Boolean).join(' at ') || 'TapThat Member'
      }
    },
    barcode: {
      type: 'QR_CODE',
      value: `${appUrl}/n/${profile.cardUid}`,
      alternateText: 'Scan to view profile'
    }
  };

  const claims = {
    iss: clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [],
    payload: {
      genericObjects: [walletObject]
    }
  };

  // Sign the JWT
  const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });

  return `https://pay.google.com/gp/v/save/${token}`;
}
