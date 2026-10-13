'use server';

import { redirect } from 'next/navigation';
import {
  verifyAdminCredentials,
  createAndSendAdminOtp,
  verifyAdminOtp,
  createAdminSession,
  clearAdminSession,
  verifyAdminSession,
} from '@/lib/admin/auth';
import {
  ingestCardsBatch,
  parseUidInput,
  IngestBatchResult,
} from '@/lib/cards/provisioning';

export async function adminLoginStepOneAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const { headers } = await import('next/headers');
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

    try {
      const { authRouteRatelimit } = await import('@/lib/ratelimit');
      const { success: allowed } = await authRouteRatelimit.limit(`admin:step1:${ip}`);
      if (!allowed && process.env.UPSTASH_REDIS_REST_URL) {
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }
    } catch (rlErr) {
      console.warn('Rate limiter warning in step 1:', rlErr);
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const isValid = verifyAdminCredentials(email, password);
    if (!isValid) {
      return { success: false, error: 'Invalid admin credentials.' };
    }

    const otpResult = await createAndSendAdminOtp(email);
    if (!otpResult.success) {
      return { success: false, error: otpResult.error || 'Failed to dispatch verification code.' };
    }

    return { success: true, email: email.trim().toLowerCase() };
  } catch (err: unknown) {
    console.error('adminLoginStepOneAction error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred during authentication.',
    };
  }
}

export async function adminLoginStepTwoAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { headers } = await import('next/headers');
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

    try {
      const { authRouteRatelimit } = await import('@/lib/ratelimit');
      const { success: allowed } = await authRouteRatelimit.limit(`admin:step2:${ip}`);
      if (!allowed && process.env.UPSTASH_REDIS_REST_URL) {
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }
    } catch (rlErr) {
      console.warn('Rate limiter warning in step 2:', rlErr);
    }

    const email = formData.get('email') as string;
    const otp = formData.get('otp') as string;

    if (!email || !otp) {
      return { success: false, error: 'Email and verification code are required.' };
    }

    const otpResult = await verifyAdminOtp(email, otp);
    if (!otpResult.valid) {
      return { success: false, error: otpResult.error || 'Invalid security PIN. Please try again.' };
    }

    await createAdminSession(email);
    return { success: true };
  } catch (err: unknown) {
    console.error('adminLoginStepTwoAction error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred during verification.',
    };
  }
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect('/admin/login');
}

export async function adminProvisionSingleCardAction(payload: {
  uid: string;
  cardType: string;
  label?: string;
}): Promise<IngestBatchResult | { error: string }> {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    return { error: 'Unauthorized. Admin session required.' };
  }

  if (!payload.uid) {
    return { error: 'Card UID is required.' };
  }

  const result = await ingestCardsBatch(
    [{ uid: payload.uid, cardType: payload.cardType, label: payload.label }],
    payload.cardType
  );

  return result;
}

export async function adminProvisionBatchAction(payload: {
  rawContent: string;
  defaultCardType: string;
}): Promise<IngestBatchResult | { error: string }> {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    return { error: 'Unauthorized. Admin session required.' };
  }

  if (!payload.rawContent || !payload.rawContent.trim()) {
    return { error: 'No content provided to ingest.' };
  }

  const parsedItems = parseUidInput(payload.rawContent, payload.defaultCardType);
  if (parsedItems.length === 0) {
    return { error: 'Could not detect any valid lines in the input.' };
  }

  const result = await ingestCardsBatch(parsedItems, payload.defaultCardType);
  return result;
}
