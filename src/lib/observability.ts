/** Lightweight observability hooks — wire Sentry when SENTRY_DSN is set */

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (process.env.SENTRY_DSN) {
    console.error("[sentry]", error, context);
    // @sentry/nextjs can be added: Sentry.captureException(error, { extra: context });
  } else if (process.env.NODE_ENV !== "production") {
    console.error(error, context);
  }
}

export function captureMessage(message: string, level: "info" | "warn" | "error" = "info") {
  if (process.env.SENTRY_DSN) {
    console.log(`[sentry:${level}]`, message);
  }
}
