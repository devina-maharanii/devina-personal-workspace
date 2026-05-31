# Adding Features Guide

This guide explains how to extend the boilerplate safely by adding new pages, API routes, email templates, AI capabilities, and analytics events.

## 1. How to Add a New Dashboard Page

Dashboard pages live under `src/app/(dashboard)/`.

1. Create a new folder for your route, e.g., `src/app/(dashboard)/projects`.
2. Inside that folder, create a `page.tsx` file.
3. Fetch the current user to ensure authorization, then render your UI.

```tsx
// src/app/(dashboard)/projects/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProjectsList } from "@/components/dashboard/ProjectsList";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold">Your Projects</h1>
      <ProjectsList userId={user.id} />
    </div>
  );
}
```

## 2. How to Add a New API Route with Rate Limiting

API routes live under `src/app/api/`. We use Upstash Redis for global sliding-window rate limiting.

```typescript
// src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiLimiter, withRateLimit } from "@/lib/rateLimit";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // Apply rate limit (100 req / 60s)
  const rateLimitResponse = await withRateLimit(apiLimiter, user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json();
  
  // Validate body schema using Zod here...
  
  const project = await db.project.create({
    data: { name: body.name, userId: user.id }
  });

  return NextResponse.json(project);
}
```

## 3. How to Add a New Email Template

We use `resend` and React Email.

1. Create a new `.tsx` template in the `src/emails/` directory.
2. Update `src/lib/resend.ts` to dispatch it.

```tsx
// src/emails/ProjectCreatedEmail.tsx
import { Html, Text, Link } from "@react-email/components";

export default function ProjectCreatedEmail({ projectName }: { projectName: string }) {
  return (
    <Html>
      <Text>Your new project {projectName} is ready!</Text>
      <Link href="https://yourdomain.com/dashboard">View Dashboard</Link>
    </Html>
  );
}
```

## 4. How to Add a New AI Feature

We abstract the Vercel AI SDK within `src/lib/ai.ts`.

1. Add your prompt logic or function call schema.
2. Expose a helper.

```typescript
// src/lib/ai.ts
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function generateProjectDescription(name: string) {
  const { text, usage } = await generateText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    prompt: `Write a 2-sentence description for a project named: ${name}`,
  });
  
  return { description: text, usage };
}
```

## 5. How to Add a New PostHog Analytics Event

Centralize your event names in `src/lib/constants.ts` to prevent typos.

```typescript
// src/lib/constants.ts
export const ANALYTICS_EVENTS = {
  PROJECT_CREATED: "project_created",
  // ...
};
```

Trigger it in a Client Component:
```tsx
import { usePostHog } from 'posthog-js/react'
import { ANALYTICS_EVENTS } from '@/lib/constants'

export function CreateProjectButton() {
  const posthog = usePostHog()
  
  const handleCreate = () => {
    // ... API call
    posthog.capture(ANALYTICS_EVENTS.PROJECT_CREATED, { feature: "projects" })
  }
}
```
