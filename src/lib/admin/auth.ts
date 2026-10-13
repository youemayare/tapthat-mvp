import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

function getAdminSessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET?.trim()) {
    return process.env.ADMIN_SESSION_SECRET.trim();
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  }
  // Deterministically derive a 256-bit secret from ADMIN_PASSWORD or ADMIN_SECURITY_PIN if set
  const baseSecret = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECURITY_PIN || '').trim();
  if (baseSecret) {
    return crypto
      .createHmac('sha256', 'tayz-admin-session-salt-2026')
      .update(baseSecret)
      .digest('hex');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[CRITICAL] ADMIN_PASSWORD or ADMIN_SESSION_SECRET must be configured.');
  }
  return 'dev-ephemeral-session-secret-change-in-env';
}

const ADMIN_COOKIE_NAME = 'tayz_admin_session';

// ─── Step 1: Verify Email and Password ────────────────────────────────────────
export function verifyAdminCredentials(email: string, pass: string): boolean {
  if (!email || !pass) return false;

  const targetEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const targetPass = String(process.env.ADMIN_PASSWORD || '').trim();

  if (!targetEmail || !targetPass) {
    console.error('⚠️ [ADMIN AUTH] ADMIN_EMAIL or ADMIN_PASSWORD is not configured in environment variables.');
    return false;
  }

  const inputEmail = email.trim().toLowerCase();
  const inputPass = pass.trim();

  const emailBuffer = Buffer.from(inputEmail);
  const targetEmailBuffer = Buffer.from(targetEmail);
  const passBuffer = Buffer.from(inputPass);
  const targetPassBuffer = Buffer.from(targetPass);

  const isEmailMatch =
    emailBuffer.length === targetEmailBuffer.length &&
    crypto.timingSafeEqual(emailBuffer, targetEmailBuffer);

  const isPassMatch =
    passBuffer.length === targetPassBuffer.length &&
    crypto.timingSafeEqual(passBuffer, targetPassBuffer);

  return isEmailMatch && isPassMatch;
}

// ─── Step 2: Verification Transition (No dynamic OTP generated) ───────────────
export async function createAndSendAdminOtp(_email: string): Promise<{ success: boolean; error?: string }> {
  // Pure static PIN verification — zero dynamic PINs generated or dispatched
  return { success: true };
}

// ─── Step 3: Verify Static Security PIN ───────────────────────────────────────
export async function verifyAdminOtp(_email: string, inputOtp: string): Promise<boolean> {
  const rawEnvPin = process.env.ADMIN_SECURITY_PIN;
  if (!rawEnvPin) {
    console.error('⚠️ [ADMIN AUTH] ADMIN_SECURITY_PIN is not configured in environment variables.');
    return false;
  }

  const targetPin = String(rawEnvPin).trim();
  const cleanInput = String(inputOtp ?? '').trim();

  if (!cleanInput || cleanInput.length === 0) {
    return false;
  }

  const targetBuffer = Buffer.from(targetPin, 'utf-8');
  const inputBuffer = Buffer.from(cleanInput, 'utf-8');

  if (targetBuffer.length !== inputBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(targetBuffer, inputBuffer);
}

// ─── Step 4: Admin Session Cookie Management ─────────────────────────────────
export async function createAdminSession(email: string): Promise<void> {
  const sessionSecret = getAdminSessionSecret();
  const token = jwt.sign(
    {
      role: 'tayz_admin',
      email: email.trim().toLowerCase(),
    },
    sessionSecret,
    { expiresIn: '8h' }
  );

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours
  });
}

export async function verifyAdminSession(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) {
      return { authenticated: false };
    }

    const sessionSecret = getAdminSessionSecret();
    const decoded = jwt.verify(token, sessionSecret) as {
      role: string;
      email: string;
    };

    if (decoded && decoded.role === 'tayz_admin') {
      return { authenticated: true, email: decoded.email };
    }

    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
