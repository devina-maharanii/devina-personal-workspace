import { z } from "zod";

// ─── Shared primitives ─────────────────────────────────────────────────────────

const requiredString = (label: string) =>
  z.string().min(1, `${label} is required`);

const url = z
  .string()
  .url("Must be a valid URL")
  .or(z.literal(""))
  .optional();

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  name: requiredString("Name").max(80, "Name must be 80 characters or fewer"),
  email: z.string().email("Must be a valid email address"),
  avatarUrl: url,
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Organization ─────────────────────────────────────────────────────────────

export const organizationSchema = z.object({
  name: requiredString("Organization name").max(80),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(48, "Slug must be 48 characters or fewer")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers, and hyphens",
    ),
  logoUrl: url,
  website: url,
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

// ─── Invite Member ────────────────────────────────────────────────────────────

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .email("Must be a valid email address")
    .min(1, "Email is required"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"], {
    message: "Role is required",
  }),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

// ─── Blog Post ─────────────────────────────────────────────────────────────────

export const blogPostSchema = z.object({
  title: requiredString("Title").max(160, "Title must be 160 characters or fewer"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(200)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers, and hyphens",
    ),
  excerpt: z.string().max(300, "Excerpt must be 300 characters or fewer").optional(),
  content: z.string().min(1, "Content is required"),
  coverImage: url,
  seoTitle: z.string().max(70, "SEO title must be 70 characters or fewer").optional(),
  seoDescription: z
    .string()
    .max(160, "SEO description must be 160 characters or fewer")
    .optional(),
  published: z.boolean().default(false),
  tags: z.array(z.string()).max(10, "Maximum 10 tags").optional(),
});

export type BlogPostFormValues = z.infer<typeof blogPostSchema>;

// ─── API Key ──────────────────────────────────────────────────────────────────

export const apiKeySchema = z.object({
  name: requiredString("Key name").max(60, "Name must be 60 characters or fewer"),
  expiresAt: z
    .string()
    .datetime({ message: "Must be a valid ISO date" })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const feedbackSchema = z.object({
  subject: requiredString("Subject").max(120),
  message: requiredString("Message").min(10, "Message must be at least 10 characters"),
  type: z.enum(["BUG", "FEATURE", "OTHER"]).default("OTHER"),
  rating: z.number().int().min(1).max(5).optional(),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;

// ─── Sign-in / Sign-up (used only for tests — Clerk handles UI auth) ──────────

export const signInSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpSchema = signInSchema.extend({
  name: requiredString("Name").max(80),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
