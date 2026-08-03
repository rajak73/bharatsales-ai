// Design tokens now live in src/theme/tokens.ts (spacing/radius/shadow/
// typography added on top of this file's original flat color palette) —
// re-exported here so every screen written against the original
// `import { colors, formatCurrency } from '../../src/lib/theme'` path
// keeps working unchanged.
export { colors, spacing, radius, shadow, typography, fontFamily } from '../theme/tokens';

export function formatCurrency(amount: number | undefined | null): string {
  const value = amount ?? 0;
  return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function getUserInitials(name?: string, email?: string): string {
  const source = name || email || '?';
  return source.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export function isToday(dateValue: unknown): boolean {
  if (!dateValue) return false;
  const d = new Date(dateValue as string);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
