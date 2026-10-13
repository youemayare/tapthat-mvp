import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { resend } from '@/lib/email';
import { Redis } from '@upstash/redis';

function getAdminSessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET?.trim()) {
    return process.env.ADMIN_SESSION_SECRET.trim();
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  }
  // Deterministically derive a 256-bit secret from ADMIN_PASSWORD or ADMIN_SECURITY_PIN if set
  const baseSecret = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECURITY_PIN;
  if (baseSecret?.trim()) {
    return crypto
      .createHmac('sha256', 'tayz-admin-session-salt-2026')
      .update(baseSecret.trim())
      .digest('hex');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[CRITICAL] ADMIN_PASSWORD or ADMIN_SESSION_SECRET must be configured.');
  }
  return 'dev-ephemeral-session-secret-change-in-env';
}

const ADMIN_COOKIE_NAME = 'tayz_admin_session';

// ─── Redis / Memory Fallback for 2FA OTP Storage ──────────────────────────────
const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL.startsWith('https://') &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis ? Redis.fromEnv() : null;

// In-memory fallback map (stores email -> { otp: string, expiresAt: number })
// Global declaration ensures persistence across hot-reloads in Next.js dev
const globalForAdminOtp = globalThis as unknown as {
  _adminOtpStore?: Map<string, { otp: string; expiresAt: number }>;
};
const memoryOtpStore =
  globalForAdminOtp._adminOtpStore ?? new Map<string, { otp: string; expiresAt: number }>();
if (process.env.NODE_ENV !== 'production') {
  globalForAdminOtp._adminOtpStore = memoryOtpStore;
}

// ─── Step 1: Verify Email and Password ────────────────────────────────────────
export function verifyAdminCredentials(email: string, pass: string): boolean {
  if (!email || !pass) return false;

  const targetEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const targetPass = process.env.ADMIN_PASSWORD?.trim();

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

// ─── Step 2: Generate and Send 2FA OTP ────────────────────────────────────────
export async function createAndSendAdminOtp(email: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // If a static security PIN is configured via environment variables, bypass dynamic OTP dispatch
  const staticPin = process.env.ADMIN_SECURITY_PIN?.trim();
  if (staticPin) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🔑 ========================================================');
      console.log('🔑 [TAYZ ADMIN]: Static Security PIN active from ADMIN_SECURITY_PIN');
      console.log(`🔑 [DESTINATION]:         ${normalizedEmail}`);
      console.log('🔑 ========================================================\n');
    }
    return { success: true };
  }

  // Generate 6-digit numeric OTP (Future dynamic OTP flow)
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP
  if (redis) {
    try {
      await redis.set(`admin:otp:${normalizedEmail}`, otp, { ex: 600 });
    } catch (err) {
      console.warn('Failed to store OTP in Redis, falling back to in-memory store:', err);
      memoryOtpStore.set(normalizedEmail, { otp, expiresAt });
    }
  } else {
    memoryOtpStore.set(normalizedEmail, { otp, expiresAt });
  }

  // Always log to terminal console for instant dev accessibility
  console.log('\n🔑 ========================================================');
  console.log(`🔑 [TAYZ ADMIN 2FA OTP]:  ${otp}`);
  console.log(`🔑 [DESTINATION]:         ${normalizedEmail}`);
  console.log('🔑 [EXPIRATION]:          10 minutes');
  console.log('🔑 ========================================================\n');

  // Attempt sending email via Resend
  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'noreply@tayz.app';
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your-resend-api-key')) {
      await resend.emails.send({
        from: fromAddress,
        to: normalizedEmail,
        subject: `${otp} is your Tayz Admin verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background: #09090b; color: #ffffff; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #ffffff; margin: 0;">TAYZ ADMIN</h1>
            </div>
            <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px 24px; text-align: center;">
              <p style="font-size: 15px; color: #a1a1aa; margin: 0 0 20px 0;">Your one-time hardware inventory security code is:</p>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #ffffff; padding: 16px 24px; background: #09090b; border-radius: 8px; border: 1px solid #3f3f46; display: inline-block; font-family: monospace;">
                ${otp}
              </div>
              <p style="font-size: 13px; color: #71717a; margin: 24px 0 0 0;">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
            </div>
          </div>
        `,
        text: `Your Tayz Admin security code is: ${otp}. It expires in 10 minutes.`,
      });
    }
  } catch (emailErr) {
    console.warn('⚠️ Could not dispatch email via Resend (use console OTP):', emailErr);
  }

  return { success: true };
}

// ─── Step 3: Verify OTP or Static PIN ─────────────────────────────────────────
export async function verifyAdminOtp(email: string, inputOtp: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanInput = inputOtp.trim();

  // Enforce strict 6-digit numeric pattern
  if (!cleanInput || cleanInput.length !== 6 || !/^\d{6}$/.test(cleanInput)) {
    return false;
  }

  // 1. If static security PIN is configured via environment variables, verify using constant-time check
  const staticPin = process.env.ADMIN_SECURITY_PIN?.trim();
  if (staticPin) {
    const staticBuffer = Buffer.from(staticPin);
    const inputBuffer = Buffer.from(cleanInput);

    if (staticBuffer.length === inputBuffer.length && crypto.timingSafeEqual(staticBuffer, inputBuffer)) {
      return true;
    }
    return false;
  }

  let storedOtp: string | null = null;

  if (redis) {
    try {
      storedOtp = await redis.get<string>(`admin:otp:${normalizedEmail}`);
    } catch {
      // Fallback to memory
      storedOtp = null;
    }
  }

  if (!storedOtp) {
    const memoryRecord = memoryOtpStore.get(normalizedEmail);
    if (memoryRecord && memoryRecord.expiresAt > Date.now()) {
      storedOtp = memoryRecord.otp;
    }
  }

  if (!storedOtp) {
    return false;
  }

  const storedBuffer = Buffer.from(storedOtp);
  const inputBuffer = Buffer.from(cleanInput);

  if (storedBuffer.length !== inputBuffer.length) {
    return false;
  }

  const isValid = crypto.timingSafeEqual(storedBuffer, inputBuffer);

  if (isValid) {
    // Burn OTP immediately so it cannot be reused
    if (redis) {
      await redis.del(`admin:otp:${normalizedEmail}`).catch(() => {});
    }
    memoryOtpStore.delete(normalizedEmail);
    return true;
  }

  return false;
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
