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

function isNativeWalletImage(url?: string | null): url is string {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    url.startsWith('https://') &&
    (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg'))
  );
}

function isWebpImage(url?: string | null): url is string {
  if (!url) return false;
  return url.startsWith('https://') && url.toLowerCase().includes('.webp');
}

function withVersion(url: string, updatedAt?: Date | null): string {
  const ts  = updatedAt ? updatedAt.getTime() : Date.now();
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${ts}`;
}

function resolveAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://tapthat.vercel.app')
  ).replace(/\/$/, '');
}

function buildWalletObjectPayload(
  profile: WalletProfileData,
  classId: string,
  objectId: string
): Record<string, unknown> {
  const appUrl     = resolveAppUrl();
  const profileUrl = `${appUrl}/p/${profile.slug || profile.id}`;
  const ts         = profile.updatedAt ? profile.updatedAt.getTime() : Date.now();

  // Prioritize profilePhotoUrl first (matching WalletPreview 1-for-1), then companyLogoUrl.
  // If the stored URL is .webp, serve it through our PNG conversion endpoint so Google Wallet accepts it.
  const preferredLogoSource = profile.profilePhotoUrl || profile.companyLogoUrl;
  let displayLogo = `${appUrl}/tayz-logo-qr.png`;

  if (isNativeWalletImage(preferredLogoSource)) {
    displayLogo = withVersion(preferredLogoSource, profile.updatedAt);
  } else if (isWebpImage(preferredLogoSource)) {
    displayLogo = `${appUrl}/api/wallet/logo/${profile.id}?v=${ts}&ext=.png`;
  } else if (isNativeWalletImage(profile.companyLogoUrl)) {
    displayLogo = withVersion(profile.companyLogoUrl, profile.updatedAt);
  } else if (isWebpImage(profile.companyLogoUrl)) {
    displayLogo = `${appUrl}/api/wallet/logo/${profile.id}?v=${ts}&ext=.png`;
  }

  const bgColor =
    profile.walletThemeColor && /^#[0-9A-Fa-f]{6}$/.test(profile.walletThemeColor)
      ? profile.walletThemeColor
      : '#0f0f19';

  const walletObject: Record<string, unknown> = {
    id: objectId,
    classId,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: bgColor,
    logo: { sourceUri: { uri: displayLogo } },
    cardTitle: { defaultValue: { language: 'en', value: 'Tayz Digital Business Card' } },
    header: { defaultValue: { language: 'en', value: profile.name || 'Anonymous' } },
    subheader: {
      defaultValue: {
        language: 'en',
        value: [profile.jobTitle, profile.company].filter(Boolean).join(' at ') || 'Member',
      },
    },
    barcode: { type: 'QR_CODE', value: profileUrl, alternateText: 'Scan to connect' },
  };

  // Use the wallet hero image URL directly at the bottom of the pass (matching WalletPreview).
  if (isNativeWalletImage(profile.walletHeroImageUrl)) {
    walletObject.heroImage = {
      sourceUri: { uri: withVersion(profile.walletHeroImageUrl, profile.updatedAt) },
    };
  }

  return walletObject;
}

function getIds(issuerId: string, profileId: string) {
  const classId  = `${issuerId}.tayz_business_card_v2`;
  const objectId = `${issuerId}.${profileId.replace(/-/g, '')}_v3`;
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
