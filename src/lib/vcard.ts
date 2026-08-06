import type { Profile } from '@/lib/db/schema';

/**
 * Generates a RFC 6350 (vCard 3.0) compliant .vcf string.
 * Zero dependencies — runs at edge with no cold start penalty.
 *
 * Usage:
 *   const vcf = generateVCard(profile);
 *   return new Response(vcf, {
 *     headers: {
 *       'Content-Type': 'text/vcard; charset=utf-8',
 *       'Content-Disposition': `attachment; filename="${profile.firstName}-${profile.lastName}.vcf"`,
 *     },
 *   });
 */
export function generateVCard(profile: Profile): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  // Name
  const firstName = profile.firstName ?? '';
  const lastName = profile.lastName ?? '';
  lines.push(`N:${lastName};${firstName};;;`);
  lines.push(`FN:${[firstName, lastName].filter(Boolean).join(' ')}`);

  // Work info
  if (profile.companyName) lines.push(`ORG:${escape(profile.companyName)}`);
  if (profile.jobTitle) lines.push(`TITLE:${escape(profile.jobTitle)}`);

  // Phone numbers
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${profile.phone}`);
  if (profile.whatsapp && profile.whatsapp !== profile.phone) {
    lines.push(`TEL;TYPE=WORK:${profile.whatsapp}`);
  }

  // Email
  if (profile.email) lines.push(`EMAIL;TYPE=WORK:${profile.email}`);

  // URLs
  if (profile.websiteUrl) lines.push(`URL:${profile.websiteUrl}`);
  if (profile.linkedinUrl) {
    lines.push(`X-SOCIALPROFILE;type=linkedin:${profile.linkedinUrl}`);
  }
  if (profile.instagramUrl) {
    lines.push(`X-SOCIALPROFILE;type=instagram:${profile.instagramUrl}`);
  }

  // Profile photo (if hosted on R2 public URL)
  if (profile.profilePhotoUrl) {
    lines.push(`PHOTO;VALUE=URI:${profile.profilePhotoUrl}`);
  }

  // Bio / note
  if (profile.bio) lines.push(`NOTE:${escape(profile.bio)}`);

  lines.push('END:VCARD');

  // vCard spec requires CRLF line endings
  return lines.join('\r\n');
}

/** Escape special characters in vCard field values */
function escape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

/** Build the filename for the vCard download */
export function getVCardFilename(profile: Profile): string {
  const name = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/\s+/g, '-');
  return `${name || 'contact'}.vcf`;
}
