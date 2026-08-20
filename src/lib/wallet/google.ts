import jwt from 'jsonwebtoken';
import { GoogleAuth } from 'google-auth-library';

export interface WalletProfileData {
  id: string;
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  slug?: string | null;
  profilePhotoUrl?: string | null;
  companyLogoUrl?: string | null;
  walletThemeColor?: string | null;
  walletHeroImageUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  whatsapp?: string | null;
  updatedAt?: Date | null;
}

function getCredentials() {
  const issuerId    = process.env.GOOGLE_WALLET_ISSUER_ID;
  const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  const privateKey  = process.env.GOOGLE_WALLET_PRIVATE_KEY
    ?.replace(/\\n/g, '\n')
    .replace(/(^"|"$)/g, '');
  return { issuerId, clientEmail, privateKey };
}

function hasCredentials() {
  const { issuerId, clientEmail, privateKey } = getCredentials();
  return Boolean(issuerId && clientEmail && privateKey);
}

function isValidWalletImage(url?: string | null): url is string {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    url.startsWith('https://') &&
    (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg'))
  );
}

function withVersion(url: string, updatedAt?: Date | null): string {
  const ts  = updatedAt ? updatedAt.getTime() : Date.now();
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${ts}`;
}

function buildWalletObjectPayload(
  profile: WalletProfileData,
  classId: string,
  objectId: string
): Record<string, unknown> {
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://anoya.com';
  const profileUrl = `${appUrl}/p/${profile.slug || profile.id}`;

  let displayLogo = 'https://i.imgur.com/4tGqO5C.png';
  if (isValidWalletImage(profile.companyLogoUrl)) {
    displayLogo = profile.companyLogoUrl;
  } else if (isValidWalletImage(profile.profilePhotoUrl)) {
    displayLogo = profile.profilePhotoUrl;
  }

  const walletObject: Record<string, unknown> = {
    id: objectId,
    classId,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    logo: { sourceUri: { uri: displayLogo } },
    cardTitle: { defaultValue: { language: 'en', value: 'Anoya Digital Business Card' } },
    header: { defaultValue: { language: 'en', value: profile.name || 'Anonymous' } },
    subheader: {
      defaultValue: {
        language: 'en',
        value: [profile.jobTitle, profile.company].filter(Boolean).join(' at ') || 'Member',
      },
    },
    barcode: { type: 'QR_CODE', value: profileUrl, alternateText: 'Scan to connect' },
  };

  if (profile.walletThemeColor && /^#[0-9A-Fa-f]{6}$/.test(profile.walletThemeColor)) {
    walletObject.hexBackgroundColor = profile.walletThemeColor;
  }

  // Use the raw wallet hero image URL directly as requested by the user,
  // bypassing the composite circular PFP logic.
  if (isValidWalletImage(profile.walletHeroImageUrl)) {
    walletObject.heroImage = {
      sourceUri: { uri: withVersion(profile.walletHeroImageUrl, profile.updatedAt) },
    };
  }

  return walletObject;
}

function getIds(issuerId: string, profileId: string) {
  const classId  = `${issuerId}.anoya_business_card_v2`;
  const objectId = `${issuerId}.${profileId.replace(/-/g, '')}_v2`;
  return { classId, objectId };
}

export function getGoogleWalletSaveUrl(profile: WalletProfileData): string {
  if (!hasCredentials()) {
    console.warn('[Wallet] Google Wallet credentials missing. Using local mock mode.');
    return '#mock-google-wallet-link';
  }

  const { issuerId, clientEmail, privateKey } = getCredentials();
  const { classId, objectId } = getIds(issuerId!, profile.id);

  const walletClass  = { id: classId };
  const walletObject = buildWalletObjectPayload(profile, classId, objectId);

  const claims = {
    iss: clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [],
    payload: { genericClasses: [walletClass], genericObjects: [walletObject] },
  };

  try {
    const token = jwt.sign(claims, privateKey!, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
  } catch (error) {
    console.error('[Wallet] Error signing JWT:', error);
    return '#mock-google-wallet-link';
  }
}

export async function patchGoogleWalletObject(profile: WalletProfileData): Promise<void> {
  if (!hasCredentials()) {
    console.warn('[Wallet] Skipping Wallet PATCH — credentials not configured.');
    return;
  }

  const { issuerId, clientEmail, privateKey } = getCredentials();
  const { classId, objectId } = getIds(issuerId!, profile.id);

  try {
    const auth = new GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const client      = await auth.getClient();
    const tokenResult = await client.getAccessToken();
    const accessToken = typeof tokenResult === 'string' ? tokenResult : tokenResult?.token;
    if (!accessToken) throw new Error('Could not obtain access token');

    const patchBody = buildWalletObjectPayload(profile, classId, objectId);
    const url = `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${encodeURIComponent(objectId)}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patchBody),
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.info('[Wallet] Pass not yet saved by user — PATCH skipped (404).');
        return;
      }
      const errText = await res.text();
      throw new Error(`Google Wallet PATCH failed (${res.status}): ${errText}`);
    }

    console.info(`[Wallet] GenericObject ${objectId} patched successfully.`);
  } catch (error) {
    console.error('[Wallet] PATCH error (non-fatal):', error);
  }
}
