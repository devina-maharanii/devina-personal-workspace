import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://placeholder-dsn@o0.ingest.sentry.io/0",
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

  // Session Replay
  replaysSessionSampleRate: 0.01, // Capture 1% of standard sessions
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions that end in an error

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],
  
  debug: false,
  
  // Before Send hook to scrub sensitive production data
  beforeSend(event) {
    // 1. Scrub Authorization and other sensitive headers from request metadata
    if (event.request?.headers) {
      const headers = { ...event.request.headers } as Record<string, string>;
      const sensitiveHeaderKeys = ["authorization", "cookie", "set-cookie", "x-api-key", "apikey", "token"];
      for (const key of Object.keys(headers)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveHeaderKeys.some(sk => lowerKey.includes(sk))) {
          headers[key] = "[SCRUBBED]";
        }
      }
      event.request.headers = headers;
    }

    // Helper function to recursively search and scrub sensitive properties
     
    type Scrubbable = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;
    const scrubSensitiveData = (obj: unknown): unknown => {
      if (Array.isArray(obj)) return obj.map((item) => scrubSensitiveData(item));
      if (!obj || typeof obj !== "object") return obj;

      const sensitiveKeys = [
        "password",
        "cardnumber",
        "ssn",
        "authorization",
        "email",
        "phone",
        "address",
        "apikey",
        "token"
      ];
      
      const scrubbed: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
      
      for (const key of Object.keys(scrubbed)) {
        const val = scrubbed[key];
        if (sensitiveKeys.includes(key.toLowerCase()) || sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          scrubbed[key] = "[SCRUBBED]";
        } else if (typeof val === "object") {
          scrubbed[key] = scrubSensitiveData(val as Scrubbable);
        }
      }
      return scrubbed;
    };

    // 2. Scrub request body data if present
    if (event.request?.data) {
      event.request.data = scrubSensitiveData(event.request.data as Scrubbable) as Record<string, unknown>;
    }

    // 3. Scrub breadcrumb payloads
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          breadcrumb.data = scrubSensitiveData(breadcrumb.data as Scrubbable) as Record<string, unknown>;
        }
        return breadcrumb;
      });
    }

    // 4. Scrub any extra properties or context
    if (event.extra) {
      event.extra = scrubSensitiveData(event.extra as Scrubbable) as Record<string, unknown>;
    }

    return event;
  },
});
