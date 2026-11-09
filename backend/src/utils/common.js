'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Strips script/style blocks, HTML tags, and control characters from user input.
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

/**
 * Escapes HTML special characters to prevent XSS / HTML injection in templates and alerts.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapes special regular expression characters in user search strings to prevent ReDoS.
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalizes Indian mobile numbers by stripping formatting, +91/91 country code, or leading 0.
 */
function normalizePhone(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Escapes a value for safe CSV export and neutralizes spreadsheet formula injection (CWE-1236).
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Validates that an optional document URL is either a safe relative path or an HTTP(S) URL.
 * Rejects javascript:, data:, file:, vbscript:, and overly long strings.
 */
function isSafeDocumentUrl(value, maxLength = 500) {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length > maxLength) return false;

  // Allow clean relative paths starting with a single slash
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return !/[\s<>"]/.test(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validates outgoing webhook URLs to prevent Server-Side Request Forgery (SSRF)
 * against loopback, link-local (cloud metadata), or private network addresses.
 */
function isSafeWebhookUrl(value, allowHttpInDev = process.env.NODE_ENV !== 'production') {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'https:' && !(allowHttpInDev && parsed.protocol === 'http:')) {
      return false;
    }

    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      /^fc00:/i.test(host) ||
      /^fe80:/i.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts and bounds pagination parameters from req.query.
 */
function parsePagination(query = {}, defaultLimit = 20, maxLimit = 100) {
  const pageRaw = typeof query.page === 'string' || typeof query.page === 'number' ? query.page : '1';
  const limitRaw = typeof query.limit === 'string' || typeof query.limit === 'number' ? query.limit : String(defaultLimit);
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(limitRaw, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Safely applies dateFrom and dateTo filters onto a Mongoose query object.
 */
function applyDateRangeFilter(targetQuery, dateFrom, dateTo) {
  if ((typeof dateFrom !== 'string' || !dateFrom.trim()) && (typeof dateTo !== 'string' || !dateTo.trim())) {
    return;
  }

  const createdAt = {};
  if (typeof dateFrom === 'string' && dateFrom.trim()) {
    const fromDate = new Date(dateFrom.trim());
    if (!isNaN(fromDate.getTime())) {
      createdAt.$gte = fromDate;
    }
  }
  if (typeof dateTo === 'string' && dateTo.trim()) {
    const toDate = new Date(dateTo.trim());
    if (!isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
      createdAt.$lte = toDate;
    }
  }

  if (Object.keys(createdAt).length > 0) {
    targetQuery.createdAt = createdAt;
  }
}

/**
 * Creates an in-memory time-window deduplicator for preventing rapid double submissions.
 */
function createSubmissionDeduplicator(windowMs = 60 * 1000, maxEntries = 500) {
  const store = new Map();

  function prune(now) {
    if (store.size <= maxEntries) return;
    for (const [k, timestamp] of store.entries()) {
      if (now - timestamp > windowMs) {
        store.delete(k);
      }
    }
  }

  return {
    isDuplicate(key, now = Date.now()) {
      if (!key) return false;
      const last = store.get(key);
      if (last && now - last < windowMs) {
        return true;
      }
      return false;
    },
    record(key, now = Date.now()) {
      if (!key) return;
      prune(now);
      store.set(key, now);
    },
    clear() {
      store.clear();
    }
  };
}

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  PINCODE_REGEX,
  sanitizeText,
  escapeHtml,
  escapeRegex,
  normalizePhone,
  escapeCsvCell,
  isSafeDocumentUrl,
  isSafeWebhookUrl,
  parsePagination,
  applyDateRangeFilter,
  createSubmissionDeduplicator
};
