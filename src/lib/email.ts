import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@tapthat.vercel.app';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tapthat.vercel.app';

/** Send welcome email after signup */
export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to TapThat 👋',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 8px;">Welcome, ${name}! 🎉</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Your TapThat account is ready. Set up your profile and start sharing your professional identity with one tap.
        </p>
        <a href="${APP_URL}/dashboard/profile"
           style="display: inline-block; margin-top: 24px; padding: 12px 24px;
                  background: #0f172a; color: white; text-decoration: none;
                  border-radius: 8px; font-weight: 600;">
          Set Up Your Profile →
        </a>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 32px;">
          TapThat — Professional Identity, One Tap Away
        </p>
      </div>
    `,
  });
}

/** Send card registration confirmation */
export async function sendCardRegisteredEmail(to: string, name: string, cardUid: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your TapThat card is active! 🎴',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 8px;">Card Activated! ✅</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Hey ${name}, your TapThat card (<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${cardUid}</code>) 
          is now linked to your profile and ready to use.
        </p>
        <a href="${APP_URL}/dashboard"
           style="display: inline-block; margin-top: 24px; padding: 12px 24px;
                  background: #0f172a; color: white; text-decoration: none;
                  border-radius: 8px; font-weight: 600;">
          View Dashboard →
        </a>
      </div>
    `,
  });
}
