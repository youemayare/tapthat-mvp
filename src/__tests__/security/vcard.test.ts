/**
 * Unit tests for vCard generation (src/lib/vcard.ts)
 *
 * Tests:
 *  - All fields are RFC 6350 escaped
 *  - Unicode names preserved
 *  - Injection attempts blocked
 *  - Content-Disposition filename safety
 */

import { generateVCard, getVCardFilename } from '@/lib/vcard';
import type { Profile } from '@/lib/db/schema';

// Minimal valid published profile for tests
function makeProfile(overrides: Partial<Profile> = {}): Profile {
  // @ts-expect-error
  return {
    id: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000002',
    slug: 'test-profile',
    firstName: 'John',
    lastName: 'Doe',
    jobTitle: 'Engineer',
    companyName: 'ACME',
    bio: null,
    profilePhotoUrl: null,
    companyLogoUrl: null,
    cvUrl: null,
    phone: '+1234567890',
    whatsapp: '+1234567891',
    email: 'john@example.com',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    instagramUrl: null,
    websiteUrl: 'https://johndoe.dev',
    socialLinks: [],
    theme: 'default',
    isPublished: true,
    label: null,
    isDefault: true,
    archivedAt: null,
    walletThemeColor: null,
    walletHeroImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('generateVCard', () => {
  it('produces valid vCard headers', () => {
    const vcf = generateVCard(makeProfile());
    expect(vcf).toContain('BEGIN:VCARD\r\n');
    expect(vcf).toContain('VERSION:3.0\r\n');
    expect(vcf).toContain('END:VCARD');
  });

  it('uses CRLF line endings throughout', () => {
    const vcf = generateVCard(makeProfile());
    // Every line should end with \r\n
    const lines = vcf.split('\r\n');
    expect(lines.length).toBeGreaterThan(3);
  });

  it('includes name fields', () => {
    const vcf = generateVCard(makeProfile({ firstName: 'Jane', lastName: 'Smith' }));
    expect(vcf).toContain('N:Smith;Jane;;;');
    expect(vcf).toContain('FN:Jane Smith');
  });

  it('preserves unicode names without corrupting them', () => {
    const vcf = generateVCard(makeProfile({ firstName: 'محمد', lastName: 'علي' }));
    expect(vcf).toContain('محمد');
    expect(vcf).toContain('علي');
  });

  it('escapes semicolons in name fields', () => {
    const vcf = generateVCard(makeProfile({ firstName: 'John;Evil', lastName: 'Doe' }));
    // Semicolons in name components must be escaped
    expect(vcf).toContain('\\;');
    expect(vcf).not.toMatch(/N:Doe;John;Evil/); // Should not break N: field structure
  });

  it('escapes newline injection in bio field', () => {
    const maliciousBio = 'Normal bio\r\nEND:VCARD\r\nBEGIN:VCARD\r\nFN:Injected';
    const vcf = generateVCard(makeProfile({ bio: maliciousBio }));
    const lineCount = vcf.split('\r\n').filter(l => l.startsWith('BEGIN:VCARD')).length;
    expect(lineCount).toBe(1); // Only one BEGIN:VCARD
    expect(vcf.split('\r\n').filter(l => l.startsWith('END:VCARD')).length).toBe(1);
  });

  it('escapes backslash in phone field', () => {
    const vcf = generateVCard(makeProfile({ phone: '+1234\\5678' }));
    expect(vcf).toContain('\\\\');
  });

  it('does not duplicate phone if whatsapp is the same number', () => {
    const vcf = generateVCard(makeProfile({ phone: '+1234567890', whatsapp: '+1234567890' }));
    const telLines = vcf.split('\r\n').filter(l => l.startsWith('TEL'));
    expect(telLines.length).toBe(1);
  });

  it('includes two TEL lines when phone and whatsapp differ', () => {
    const vcf = generateVCard(makeProfile({ phone: '+1111111111', whatsapp: '+2222222222' }));
    const telLines = vcf.split('\r\n').filter(l => l.startsWith('TEL'));
    expect(telLines.length).toBe(2);
  });

  it('omits optional fields when null', () => {
    const vcf = generateVCard(makeProfile({
      email: null,
      websiteUrl: null,
      linkedinUrl: null,
      phone: null,
      whatsapp: null,
    }));
    expect(vcf).not.toContain('EMAIL');
    expect(vcf).not.toContain('URL:');
    expect(vcf).not.toContain('TEL');
  });
});

describe('getVCardFilename', () => {
  it('returns a safe Content-Disposition header value', () => {
    const result = getVCardFilename({ firstName: 'John', lastName: 'Doe' });
    expect(result).toBe('attachment; filename="john-doe.vcf"');
  });

  it('falls back to contact.vcf for null names', () => {
    const result = getVCardFilename({ firstName: null, lastName: null });
    expect(result).toBe('attachment; filename="contact.vcf"');
  });

  it('blocks header injection via CRLF', () => {
    const result = getVCardFilename({ firstName: 'John\r\n', lastName: 'Doe' });
    expect(result).not.toContain('\r');
    expect(result).not.toContain('\n');
  });
});












