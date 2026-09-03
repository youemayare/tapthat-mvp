import type { Profile } from '@/lib/db/schema';
import { escapeVCard, safeVCardContentDisposition } from '@/lib/security';

/**
 * Generates an RFC 6350 (vCard 3.0) compliant .vcf string.
 *
 * All user-controlled field values are escaped via escapeVCard() before
 * emission to prevent injection via backslash, comma, semicolon, or newline.
 * Unicode names are preserved — only control characters and vCard structural
 * characters are escaped.
 *
 * Zero dependencies — runs at edge with no cold start penalty.
 */
export function generateVCard(profile: Profile): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  // Name — semicolon-delimited: Family;Given;Additional;Prefix;Suffix
  // Each component must be individually escaped
  const firstName = escapeVCard(profile.firstName ?? '');
  const lastName = escapeVCard(profile.lastName ?? '');
  lines.push(`N:${lastName};${firstName};;;`);
  lines.push(`FN:${[firstName, lastName].filter(Boolean).join(' ')}`);

  // Work info
  if (profile.companyName) lines.push(`ORG:${escapeVCard(profile.companyName)}`);
  if (profile.jobTitle)    lines.push(`TITLE:${escapeVCard(profile.jobTitle)}`);

  // Phone numbers
  if (profile.phone && profile.showPhone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCard(profile.phone)}`);
  }
  if (profile.whatsapp && profile.showWhatsapp && profile.whatsapp !== profile.phone) {
    lines.push(`TEL;TYPE=WORK:${escapeVCard(profile.whatsapp)}`);
  }

  // Email
  if (profile.email && profile.showEmail) lines.push(`EMAIL;TYPE=WORK:${escapeVCard(profile.email)}`);

  // URLs — escape the value but preserve the URL structure
  if (profile.websiteUrl && profile.showWebsite) lines.push(`URL:${escapeVCard(profile.websiteUrl)}`);
  if (profile.linkedinUrl && profile.showLinkedin) {
    lines.push(`X-SOCIALPROFILE;type=linkedin:${escapeVCard(profile.linkedinUrl)}`);
  }
  if (profile.instagramUrl && profile.showInstagram) {
    lines.push(`X-SOCIALPROFILE;type=instagram:${escapeVCard(profile.instagramUrl)}`);
  }

  // Profile photo (R2 public URL only)
  if (profile.profilePhotoUrl) {
    lines.push(`PHOTO;VALUE=URI:${escapeVCard(profile.profilePhotoUrl)}`);
  }

  // Bio / note
  if (profile.bio) lines.push(`NOTE:${escapeVCard(profile.bio)}`);

  lines.push('END:VCARD');

  // vCard spec requires CRLF line endings
  return lines.join('\r\n');
}

/**
 * Build a safe Content-Disposition header value for the vCard download.
 * Delegates to safeVCardContentDisposition which produces ASCII-only filenames
 * and always falls back to "contact.vcf" if the name is empty or non-ASCII.
 */
export function getVCardFilename(profile: Pick<Profile, 'firstName' | 'lastName'>): string {
  return safeVCardContentDisposition(profile.firstName, profile.lastName);
}
