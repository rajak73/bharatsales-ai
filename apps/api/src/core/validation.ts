import { z } from 'zod';

/** Emails are stored and compared trimmed + lowercased. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mongo filter matching `email` case-insensitively. New accounts are stored
 * lowercased, but accounts created before normalisation may carry mixed
 * case; this keeps them able to log in and stops a differently-cased copy of
 * an existing address from being registered as a separate account.
 */
export function emailLookup(email: string): { email: { $regex: string; $options: string } } {
  return { email: { $regex: `^${escapeRegex(normalizeEmail(email))}$`, $options: 'i' } };
}

/** Required email field: trimmed, lowercased, non-empty. */
export const emailField = z.string().trim().min(1).transform(normalizeEmail);
/** Optional email field (absence is answered by the route itself). */
export const optEmailField = z.string().optional().transform((v) => (v === undefined ? v : normalizeEmail(v)));

const PASSWORD_RULES = 'Password must be 8-128 characters and contain at least one letter and one number';

/** Shared password policy for register / reset / accept-invitation / users. */
export const passwordField = z
  .string()
  .min(8, PASSWORD_RULES)
  .max(128, PASSWORD_RULES)
  .regex(/[A-Za-z]/, PASSWORD_RULES)
  .regex(/\d/, PASSWORD_RULES);

/**
 * Optional password for routes whose handler answers a missing value itself
 * (legacy 200 { statusCode: 400 } bodies): absent or '' passes through,
 * anything else must meet the policy.
 */
export const optPasswordField = z.union([z.literal(''), passwordField]).optional();
