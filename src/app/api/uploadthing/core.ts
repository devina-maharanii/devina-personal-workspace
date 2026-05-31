import { createUploadthing, type FileRouter } from "uploadthing/next";
 
import { getCurrentUser, getActiveOrg } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";
import { triggerWebhook } from "@/lib/webhooks";
import { captureEvent } from "@/lib/posthog";
import { ANALYTICS_EVENTS } from "@/lib/constants";

const f = createUploadthing();

// Define plans storage limit in bytes
const PLAN_LIMITS_BYTES: Record<string, number> = {
  FREE: 1 * 1024 * 1024 * 1024,        // 1 GB
  PRO: 10 * 1024 * 1024 * 1024,       // 10 GB
  ENTERPRISE: 100 * 1024 * 1024 * 1024 // 100 GB
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/**
 * Checks if the organization has exceeded its storage limits.
 */
async function checkStorageLimit(orgId: string, incomingSize = 0) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true }
  });
  
  if (!org) {
    throw new Error("Organization not found.");
  }
  
  const storageAggregate = await db.file.aggregate({
    where: { organizationId: orgId },
    _sum: {
      size: true
    }
  });
  
  const currentBytes = storageAggregate._sum.size || 0;
  const limitBytes = PLAN_LIMITS_BYTES[org.plan.toUpperCase()] || PLAN_LIMITS_BYTES.FREE;
  
  if (currentBytes + incomingSize > limitBytes) {
    throw new Error(`Storage limit exceeded. Current: ${(currentBytes / (1024 * 1024)).toFixed(1)}MB, Limit: ${(limitBytes / (1024 * 1024)).toFixed(1)}MB.`);
  }
}

export const ourFileRouter = {
  // Existing endpoints
  blogImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user || user.role !== "ADMIN") {
        throw new Error("Unauthorized");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Server-side MIME validation
      if (!file.type || !file.type.startsWith("image/")) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error("MIME type validation failed: Only images are allowed.");
      }
      
      await createNotification({
        userId: metadata.userId,
        title: "Image Upload Complete",
        message: `Your blog image "${file.name}" was uploaded successfully.`,
        type: "success",
        link: file.url,
        category: "files",
      });

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  orgLogo: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Unauthorized");
      }
      const org = await getActiveOrg(user.id);
      if (org) {
        const membership = await db.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: org.id,
            },
          },
        });
        if (membership?.role === "VIEWER") {
          throw new Error("Viewers are not authorized to perform write operations.");
        }
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Server-side MIME validation
      if (!file.type || !file.type.startsWith("image/")) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error("MIME type validation failed: Only images are allowed.");
      }

      await createNotification({
        userId: metadata.userId,
        title: "Workspace Logo Uploaded",
        message: `Your new workspace logo "${file.name}" was uploaded successfully.`,
        type: "success",
        link: file.url,
        category: "files",
      });

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // File Management System Endpoints
  avatarUpload: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Unauthorized");
      const org = await getActiveOrg(user.id);
      if (!org) throw new Error("No active organization found");

      // Check VIEWER role
      const membership = await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org.id,
          },
        },
      });
      if (membership?.role === "VIEWER") {
        throw new Error("Viewers are not authorized to perform write operations.");
      }

      await checkStorageLimit(org.id, 0);

      return { userId: user.id, orgId: org.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId, orgId } = metadata;

      // Server-side MIME validation
      if (!file.type || !file.type.startsWith("image/")) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error("MIME type validation failed: Only images are allowed.");
      }

      // Check limit including incoming size
      try {
        await checkStorageLimit(orgId, file.size);
       
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Storage limit exceeded";
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error(message);
      }

      const dbFile = await db.file.create({
        data: {
          userId,
          organizationId: orgId,
          name: file.name,
          url: file.url,
          key: file.key,
          size: file.size,
          mimeType: file.type,
        }
      });

      await createNotification({
        userId,
        title: "Avatar Uploaded",
        message: `Your new avatar "${file.name}" was successfully uploaded.`,
        type: "success",
        category: "files",
      });

      await triggerWebhook(orgId, 'file.uploaded', {
        fileId: dbFile.id,
        name: dbFile.name,
        url: dbFile.url,
        size: dbFile.size,
        mimeType: dbFile.mimeType,
      });

      captureEvent(userId, ANALYTICS_EVENTS.FILE_UPLOADED, {
        type: 'image',
        size_mb: file.size / (1024 * 1024),
      });

      return { uploadedBy: userId, fileId: dbFile.id };
    }),

  coverImageUpload: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Unauthorized");
      const org = await getActiveOrg(user.id);
      if (!org) throw new Error("No active organization found");

      // Check VIEWER role
      const membership = await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org.id,
          },
        },
      });
      if (membership?.role === "VIEWER") {
        throw new Error("Viewers are not authorized to perform write operations.");
      }

      await checkStorageLimit(org.id, 0);

      return { userId: user.id, orgId: org.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId, orgId } = metadata;

      // Server-side MIME validation
      if (!file.type || !file.type.startsWith("image/")) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error("MIME type validation failed: Only images are allowed.");
      }

      try {
        await checkStorageLimit(orgId, file.size);
       
      } catch (error: unknown) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error(getErrorMessage(error, "Storage limit exceeded"));
      }

      const dbFile = await db.file.create({
        data: {
          userId,
          organizationId: orgId,
          name: file.name,
          url: file.url,
          key: file.key,
          size: file.size,
          mimeType: file.type,
        }
      });

      await createNotification({
        userId,
        title: "Cover Image Uploaded",
        message: `Your cover image "${file.name}" was successfully uploaded.`,
        type: "success",
        category: "files",
      });

      await triggerWebhook(orgId, 'file.uploaded', {
        fileId: dbFile.id,
        name: dbFile.name,
        url: dbFile.url,
        size: dbFile.size,
        mimeType: dbFile.mimeType,
      });

      captureEvent(userId, ANALYTICS_EVENTS.FILE_UPLOADED, {
        type: 'image',
        size_mb: file.size / (1024 * 1024),
      });

      return { uploadedBy: userId, fileId: dbFile.id };
    }),

  documentUpload: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    text: { maxFileSize: "16MB", maxFileCount: 1 },
    blob: { maxFileSize: "16MB", maxFileCount: 1 }
  })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Unauthorized");
      const org = await getActiveOrg(user.id);
      if (!org) throw new Error("No active organization found");

      // Check VIEWER role
      const membership = await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org.id,
          },
        },
      });
      if (membership?.role === "VIEWER") {
        throw new Error("Viewers are not authorized to perform write operations.");
      }

      await checkStorageLimit(org.id, 0);

      return { userId: user.id, orgId: org.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId, orgId } = metadata;

      // Server-side MIME & Extension validation
      const allowedDocMimes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      const allowedExtensions = [".pdf", ".doc", ".docx", ".txt"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

      const isMimeValid = file.type && allowedDocMimes.includes(file.type);
      const isExtValid = allowedExtensions.includes(ext);

      if (!isMimeValid || !isExtValid) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error("MIME type validation failed: Only PDF, DOC, DOCX, and TXT files are allowed.");
      }

      try {
        await checkStorageLimit(orgId, file.size);
       
      } catch (error: unknown) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error(getErrorMessage(error, "Storage limit exceeded"));
      }

      const dbFile = await db.file.create({
        data: {
          userId,
          organizationId: orgId,
          name: file.name,
          url: file.url,
          key: file.key,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        }
      });

      await createNotification({
        userId,
        title: "Document Uploaded",
        message: `Your document "${file.name}" was successfully uploaded.`,
        type: "success",
        category: "files",
      });

      await triggerWebhook(orgId, 'file.uploaded', {
        fileId: dbFile.id,
        name: dbFile.name,
        url: dbFile.url,
        size: dbFile.size,
        mimeType: dbFile.mimeType,
      });

      captureEvent(userId, ANALYTICS_EVENTS.FILE_UPLOADED, {
        type: 'document',
        size_mb: file.size / (1024 * 1024),
      });

      return { uploadedBy: userId, fileId: dbFile.id };
    }),

  generalUpload: f({
    blob: { maxFileSize: "64MB", maxFileCount: 1 }
  })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Unauthorized");
      const org = await getActiveOrg(user.id);
      if (!org) throw new Error("No active organization found");

      // Check VIEWER role
      const membership = await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org.id,
          },
        },
      });
      if (membership?.role === "VIEWER") {
        throw new Error("Viewers are not authorized to perform write operations.");
      }

      await checkStorageLimit(org.id, 0);

      return { userId: user.id, orgId: org.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId, orgId } = metadata;

      // Server-side blacklist validation for dangerous file types
      const blacklistedExtensions = [
        ".html", ".htm", ".xhtml", ".exe", ".bat", ".cmd", ".sh", ".bash", 
        ".php", ".js", ".jsx", ".ts", ".tsx", ".vbs", ".scr", ".msi", ".jar"
      ];
      const blacklistedMimes = [
        "text/html",
        "application/javascript",
        "text/javascript",
        "application/x-msdownload",
        "application/x-sh",
        "application/x-bash",
        "application/x-php",
        "text/x-php",
      ];

      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      const isMimeBlacklisted = file.type && blacklistedMimes.includes(file.type);
      const isExtBlacklisted = blacklistedExtensions.includes(ext);

      if (isMimeBlacklisted || isExtBlacklisted) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error("Dangerous file type detected. This file type is not allowed for upload.");
      }

      try {
        await checkStorageLimit(orgId, file.size);
       
      } catch (error: unknown) {
        const utapi = new UTApi();
        await utapi.deleteFiles(file.key);
        throw new Error(getErrorMessage(error, "Storage limit exceeded"));
      }

      const dbFile = await db.file.create({
        data: {
          userId,
          organizationId: orgId,
          name: file.name,
          url: file.url,
          key: file.key,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        }
      });

      await createNotification({
        userId,
        title: "File Uploaded",
        message: `Your file "${file.name}" was successfully uploaded.`,
        type: "success",
        category: "files",
      });

      await triggerWebhook(orgId, 'file.uploaded', {
        fileId: dbFile.id,
        name: dbFile.name,
        url: dbFile.url,
        size: dbFile.size,
        mimeType: dbFile.mimeType,
      });

      captureEvent(userId, ANALYTICS_EVENTS.FILE_UPLOADED, {
        type: 'other',
        size_mb: file.size / (1024 * 1024),
      });

      return { uploadedBy: userId, fileId: dbFile.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
