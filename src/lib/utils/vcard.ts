/**
 * Generates a "Slim vCard" string optimized for QR code offline sharing.
 * Strips out heavy fields (bios, images) to ensure QR remains readable.
 */

interface VCardProfile {
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  jobTitle?: string | null;
  job_title?: string | null;
  companyName?: string | null;
  company_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  mobileNumber?: string | null;
  mobile_number?: string | null;
  workNumber?: string | null;
  work_number?: string | null;
  personalEmail?: string | null;
  personal_email?: string | null;
  workEmail?: string | null;
  work_email?: string | null;
  websiteUrl?: string | null;
  website_url?: string | null;
}

function escapeVCardValue(val: string | null | undefined): string {
  if (!val) return '';
  return val.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
}

export function generateSlimVCard(profile: VCardProfile, profileUrl?: string): string {
  const lines: string[] = [];
  
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');

  const first = escapeVCardValue(profile.firstName || profile.first_name);
  const last = escapeVCardValue(profile.lastName || profile.last_name);
  
  // N: Last;First;Middle;Prefix;Suffix
  lines.push(`N:${last};${first};;;`);
  
  // FN: Formatted Name
  const fullName = [first, last].filter(Boolean).join(' ');
  if (fullName) {
    lines.push(`FN:${fullName}`);
  }

  const org = escapeVCardValue(profile.companyName || profile.company_name);
  if (org) {
    lines.push(`ORG:${org}`);
  }

  const title = escapeVCardValue(profile.jobTitle || profile.job_title);
  if (title) {
    lines.push(`TITLE:${title}`);
  }

  // Use the first available phone number
  const phone = escapeVCardValue(profile.phone || profile.whatsapp || profile.mobileNumber || profile.mobile_number || profile.workNumber || profile.work_number);
  if (phone) {
    lines.push(`TEL;TYPE=CELL:${phone}`);
  }

  // Use the first available email
  const email = escapeVCardValue(profile.email || profile.workEmail || profile.work_email || profile.personalEmail || profile.personal_email);
  if (email) {
    lines.push(`EMAIL;TYPE=WORK:${email}`);
  }

  // Prefer specific website URL, fallback to profile URL
  const url = escapeVCardValue(profile.websiteUrl || profile.website_url) || (profileUrl ? escapeVCardValue(profileUrl) : '');
  if (url) {
    lines.push(`URL:${url}`);
  }

  lines.push('END:VCARD');
  
  return lines.join('\r\n');
}
