/**
 * Generates a "Slim vCard" string optimized for QR code offline sharing.
 * Strips out heavy fields (bios, images) to ensure QR remains readable.
 */

interface VCardProfile {
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  mobileNumber?: string | null;
  workNumber?: string | null;
  personalEmail?: string | null;
  workEmail?: string | null;
  websiteUrl?: string | null;
}

function escapeVCardValue(val: string | null | undefined): string {
  if (!val) return '';
  return val.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
}

export function generateSlimVCard(profile: VCardProfile, profileUrl?: string): string {
  const lines: string[] = [];
  
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');

  const first = escapeVCardValue(profile.firstName);
  const last = escapeVCardValue(profile.lastName);
  
  // N: Last;First;Middle;Prefix;Suffix
  lines.push(`N:${last};${first};;;`);
  
  // FN: Formatted Name
  const fullName = [first, last].filter(Boolean).join(' ');
  if (fullName) {
    lines.push(`FN:${fullName}`);
  }

  const org = escapeVCardValue(profile.companyName);
  if (org) {
    lines.push(`ORG:${org}`);
  }

  const title = escapeVCardValue(profile.jobTitle);
  if (title) {
    lines.push(`TITLE:${title}`);
  }

  // Use the first available phone number
  const phone = escapeVCardValue(profile.mobileNumber || profile.workNumber);
  if (phone) {
    lines.push(`TEL;TYPE=CELL:${phone}`);
  }

  // Use the first available email
  const email = escapeVCardValue(profile.workEmail || profile.personalEmail);
  if (email) {
    lines.push(`EMAIL;TYPE=WORK:${email}`);
  }

  // Prefer specific website URL, fallback to profile URL
  const url = escapeVCardValue(profile.websiteUrl) || (profileUrl ? escapeVCardValue(profileUrl) : '');
  if (url) {
    lines.push(`URL:${url}`);
  }

  lines.push('END:VCARD');
  
  return lines.join('\r\n');
}
