/** @internal Escapes regex metacharacters while preserving SQL LIKE wildcards. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
