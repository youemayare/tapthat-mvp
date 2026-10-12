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
}

export async function adminLoginStepTwoAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = formData.get('email') as string;
  const otp = formData.get('otp') as string;

  if (!email || !otp) {
    return { success: false, error: 'Email and verification code are required.' };
  }

  const isOtpValid = await verifyAdminOtp(email, otp);
  if (!isOtpValid) {
    return { success: false, error: 'Invalid or expired 6-digit code. Please try again.' };
  }

  await createAdminSession(email);
  return { success: true };
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
