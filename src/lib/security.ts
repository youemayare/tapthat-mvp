/**
 * Shared security utilities for the Anoya application.
 *
 * Provides:
 *  - escapeHtml       — safe HTML interpolation for email templates
 *  - escapeVCard      — RFC 6350-compliant escaping for vCard field values
 *  - safeVCardContentDisposition — safe Content-Disposition header value
 *  - logError         — structured, redacted server-side error logging
 */

// ─── HTML Escaping ────────────────────────────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
};

/**
 * Escape user-controlled values before interpolating into HTML email templates.
 * Preserves safe static template markup — only call on dynamic values.
 */
export function escapeHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/[&<>"'`]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

// ─── vCard Escaping ───────────────────────────────────────────────────────────

/**
 * RFC 6350 §3.4 compliant escaping for vCard field values.
 *
 * Escapes:
 *   - Backslashes (must be first to avoid double-escaping)
 *   - Commas
 *   - Semicolons
 *   - Newlines (LF and CRLF sequences)
 *   - Carriage returns
 *   - ASCII control characters (< 0x20, excluding tab)
 *
 * Preserves legitimate Unicode characters (names, etc.).
 */
export function escapeVCard(value: string | null | undefined): string {
  if (!value) return '';
  return (
    value
      // Backslash first — must come before other replacements
      .replace(/\\/g, '\\\\')
      // Commas and semicolons (structural characters in vCard)
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      // CRLF sequences → \n (fold then normalize)
      .replace(/\r\n/g, '\\n')
      // Remaining CR or LF → \n
      .replace(/[\r\n]/g, '\\n')
      // Strip ASCII control characters (except tab \x09)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  );
}

// ─── Safe Content-Disposition ─────────────────────────────────────────────────

/**
 * Return a safe Content-Disposition header value for a .vcf download.
 *
 * Always falls back to "contact.vcf" if the name produces no safe characters
 * after stripping control characters, quotes, slashes, and CR/LF.
 *
 * Never uses a dynamic filename as the encoded filename* (RFC 5987) to avoid
 * header injection. The plain ASCII fallback is the only emitted value.
 */
export function safeVCardContentDisposition(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const parts = [firstName, lastName].filter(Boolean).join('-');
  // Strip everything that is not an ASCII letter, digit, hyphen, or underscore
  const safe = parts
    .normalize('NFD')                        // decompose accents
    .replace(/[\u0300-\u036f]/g, '')         // remove combining marks
    .replace(/[^a-zA-Z0-9-_]/g, '')         // keep only safe ASCII
    .replace(/-{2,}/g, '-')                  // collapse consecutive hyphens
    .replace(/^-|-$/g, '')                   // trim leading/trailing hyphens
    .slice(0, 64)                            // cap length
    .toLowerCase();

  const filename = safe ? `${safe}.vcf` : 'contact.vcf';
  return `attachment; filename="${filename}"`;
}

// ─── Structured Server-Side Logging ──────────────────────────────────────────

/**
 * Patterns that should never appear in logs.
 * Matches common secret shapes, signed URLs, and header values.
 */
const REDACT_PATTERNS = [
  // Authorization header values
  /Bearer\s+[A-Za-z0-9\-_=.+/]{8,}/gi,
  // Generic tokens / keys (long base64/hex strings)
  /[A-Za-z0-9+/]{40,}={0,2}/g,
  // Signed URL query params
  /[?&](X-Amz-Signature|token|key|secret|access)[^&\s]*/gi,
  // Cookie header values
  /(?:cookie|set-cookie):[^\n]*/gi,
];

function redactSecrets(message: string): string {
  let result = message;
  for (const pattern of REDACT_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

export interface LogErrorOptions {
  /** Short identifier for the route or operation, e.g. "upload", "profile.PUT" */
  operation: string;
  /** Optional correlation/request ID passed from the caller */
  requestId?: string;
  /** The raw error value */
  error: unknown;
}

/**
 * Structured server-side error logger.
 *
 * Logs only to server stdout (never returned to clients).
 * Sanitizes error messages to remove secrets, signed URLs, and raw IPs.
 * Includes error class, code (for Postgres errors), and operation label.
 */
export function logError({ operation, requestId, error }: LogErrorOptions): void {
  const id = requestId ?? 'none';

  let message = 'Unknown error';
  let code: string | undefined;
  let type = 'UnknownError';

  if (error instanceof Error) {
    message = redactSecrets(error.message);
    type = error.constructor.name;
  } else if (typeof error === 'string') {
    message = redactSecrets(error);
  }

  // Postgres / Drizzle errors expose a `.code` property
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  ) {
    code = (error as Record<string, unknown>).code as string;
  }

  const entry: Record<string, unknown> = {
    level: 'error',
    requestId: id,
    operation,
    errorType: type,
    message,
  };

  if (code) entry.code = code;

  // Only emit stack traces in non-production or when DEBUG is explicitly set
  if (process.env.NODE_ENV !== 'production' || process.env.LOG_STACK === 'true') {
    if (error instanceof Error && error.stack) {
      entry.stack = redactSecrets(error.stack.split('\n').slice(0, 8).join('\n'));
    }
  }

  console.error(JSON.stringify(entry));
}

/**
 * Generate a short correlation ID for a single request.
 * Not cryptographically strong — used only for log correlation, not security.
 */
export function generateRequestId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}
