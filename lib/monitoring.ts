/**
 * Centralizes error reporting so a real monitoring service can be wired
 * in later at one place, instead of hunting through every catch block.
 *
 * To add Sentry: run `npx @sentry/wizard@latest -i nextjs` (it generates
 * its own config files and wraps next.config.mjs correctly — safer than
 * hand-writing that integration without a real DSN to test against), then
 * replace the console.error call below with Sentry.captureException.
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error(context ? { context, error } : error);
}
