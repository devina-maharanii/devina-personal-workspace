import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export default function PostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn("PostHog API key missing. Analytics disabled.");
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 20,
      flushInterval: 10000
    });
  }
  return posthogClient;
}

 
export function captureEvent(distinctId: string, event: string, properties?: Record<string, unknown>) {
  const client = PostHogClient();
  if (client) {
    client.capture({
      distinctId,
      event,
      properties,
    });
  }
}

 
export function identifyUser(distinctId: string, properties: Record<string, unknown>) {
  const client = PostHogClient();
  if (client) {
    client.identify({
      distinctId,
      properties,
    });
  }
}
