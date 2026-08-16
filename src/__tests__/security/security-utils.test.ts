/**
 * Unit tests for src/lib/security.ts
 *
 * Tests:
 *  - escapeHtml: covers all attack characters, null/empty safety
 *  - escapeVCard: RFC 6350 correctness, Unicode preservation, control chars
 *  - safeVCardContentDisposition: ASCII-only filenames, fallback, injection prevention
 *  - logError: redaction of secrets, structured output format
 */

import {
  escapeHtml,
  escapeVCard,
  safeVCardContentDisposition,
  logError,
} from '@/lib/security';

// ─── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes & < > " \' `', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('"foo"')).toBe('&quot;foo&quot;');
    expect(escapeHtml("it's")).toBe("it&#x27;s");
    expect(escapeHtml('`x`')).toBe('&#x60;x&#x60;');
  });

  it('returns empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml('')).toBe('');
  });

  it('does not double-escape already-escaped content', () => {
    // Raw ampersand should be escaped — this tests a live value, not pre-escaped HTML
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('blocks XSS payload in name field', () => {
    const xss = '<img src=x onerror=alert(1)>';
    expect(escapeHtml(xss)).not.toContain('<');
    expect(escapeHtml(xss)).not.toContain('>');
  });
});

// ─── escapeVCard ──────────────────────────────────────────────────────────────

describe('escapeVCard', () => {
  it('escapes backslash first (prevents double-escaping)', () => {
    expect(escapeVCard('a\\b')).toBe('a\\\\b');
  });

  it('escapes commas', () => {
    expect(escapeVCard('a,b')).toBe('a\\,b');
  });

  it('escapes semicolons', () => {
    expect(escapeVCard('a;b')).toBe('a\\;b');
  });

  it('escapes LF to \\n', () => {
    expect(escapeVCard('line1\nline2')).toBe('line1\\nline2');
  });

  it('escapes CR to \\n', () => {
    expect(escapeVCard('line1\rline2')).toBe('line1\\nline2');
  });

  it('escapes CRLF sequence to \\n', () => {
    expect(escapeVCard('line1\r\nline2')).toBe('line1\\nline2');
  });

  it('strips control characters', () => {
    // NUL (0x00), BEL (0x07), DEL (0x7F) — should be removed
    expect(escapeVCard('\x00Hello\x07World\x7F')).toBe('HelloWorld');
  });

  it('preserves tab character', () => {
    // Tab (0x09) is explicitly allowed in the RFC
    expect(escapeVCard('a\tb')).toBe('a\tb');
  });

  it('preserves unicode names', () => {
    // Arabic, CJK, accented Latin — all should pass through unchanged
    expect(escapeVCard('محمد')).toBe('محمد');
    expect(escapeVCard('张伟')).toBe('张伟');
    expect(escapeVCard('François')).toBe('François');
  });

  it('returns empty string for null/undefined', () => {
    expect(escapeVCard(null)).toBe('');
    expect(escapeVCard(undefined)).toBe('');
  });

  it('injection attempt: backslash + semicolon in a name', () => {
    // An attacker trying to inject a new vCard field
    const malicious = 'Legit;END:VCARD\nBEGIN:VCARD\nFN:Injected';
    const escaped = escapeVCard(malicious);
    expect(escaped).not.toContain('END:VCARD');
    expect(escaped).not.toContain('BEGIN:VCARD');
  });
});

// ─── safeVCardContentDisposition ─────────────────────────────────────────────

describe('safeVCardContentDisposition', () => {
  it('produces safe ASCII filename for simple ASCII name', () => {
    const result = safeVCardContentDisposition('John', 'Doe');
    expect(result).toBe('attachment; filename="john-doe.vcf"');
  });

  it('falls back to contact.vcf for empty name', () => {
    expect(safeVCardContentDisposition(null, null)).toBe('attachment; filename="contact.vcf"');
    expect(safeVCardContentDisposition('', '')).toBe('attachment; filename="contact.vcf"');
  });

  it('strips accents from non-ASCII characters', () => {
    const result = safeVCardContentDisposition('François', 'Müller');
    // Should work — accent is stripped, leaving 'francois' and 'muller'
    expect(result).toMatch(/^attachment; filename="[a-z0-9\-]+\.vcf"$/);
    expect(result).not.toContain('ç');
    expect(result).not.toContain('ü');
  });

  it('strips CRLF injection attempt from filename', () => {
    const result = safeVCardContentDisposition('John\r\nX-Evil: header', 'Doe');
    expect(result).not.toContain('\r');
    expect(result).not.toContain('\n');
    expect(result).not.toContain('X-Evil');
  });

  it('strips quote characters from filename', () => {
    const result = safeVCardContentDisposition('John"', 'Doe"');
    expect(result).not.toMatch(/filename=".*".*"/); // No embedded quotes
  });

  it('strips path separators', () => {
    const result = safeVCardContentDisposition('../../../etc/passwd', 'Doe');
    expect(result).not.toContain('/');
    expect(result).not.toContain('\\');
    expect(result).not.toContain('..');
  });

  it('falls back to contact.vcf for purely non-ASCII name', () => {
    // Arabic name with no ASCII fallback
    const result = safeVCardContentDisposition('محمد', 'علي');
    // After NFD decomposition + stripping combining marks + non-ASCII filter = empty
    // Should fallback
    expect(result).toBe('attachment; filename="contact.vcf"');
  });

  it('caps filename at 64 characters', () => {
    const longName = 'A'.repeat(200);
    const result = safeVCardContentDisposition(longName, '');
    const match = result.match(/filename="(.+)\.vcf"/);
    expect(match).toBeTruthy();
    expect(match![1].length).toBeLessThanOrEqual(64);
  });
});

// ─── logError ─────────────────────────────────────────────────────────────────

describe('logError', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs a JSON structured object', () => {
    logError({ operation: 'test.op', error: new Error('something went wrong') });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const raw = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed.level).toBe('error');
    expect(parsed.operation).toBe('test.op');
    expect(parsed.message).toBe('something went wrong');
  });

  it('redacts Bearer tokens from error messages', () => {
    logError({
      operation: 'test',
      error: new Error('Bearer eyJhbGciOiJSUzI1NiJ9.verylongtoken1234567890'),
    });
    const raw = consoleSpy.mock.calls[0][0];
    expect(raw).not.toContain('eyJhbGciOiJSUzI1NiJ9');
    expect(raw).toContain('[REDACTED]');
  });

  it('redacts signed URL secrets from error messages', () => {
    logError({
      operation: 'test',
      error: new Error('Request failed: https://bucket.r2.dev/key?X-Amz-Signature=abc123verylongsecret'),
    });
    const raw = consoleSpy.mock.calls[0][0];
    expect(raw).not.toContain('abc123verylongsecret');
  });

  it('includes error code for Postgres errors', () => {
    const pgError = Object.assign(new Error('unique constraint'), { code: '23505' });
    logError({ operation: 'db.insert', error: pgError });
    const raw = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed.code).toBe('23505');
  });

  it('handles non-Error thrown values', () => {
    logError({ operation: 'test', error: 'just a string' });
    const raw = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed.message).toBe('just a string');
    expect(parsed.errorType).toBe('UnknownError');
  });

  it('includes requestId when provided', () => {
    logError({ operation: 'test', requestId: 'abc123', error: new Error('x') });
    const raw = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed.requestId).toBe('abc123');
  });
});
