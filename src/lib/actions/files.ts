"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
 
import { requireAuth } from "@/lib/auth";
import { UTApi } from "uploadthing/server";
import { createNotification } from "@/lib/notifications";

/**
 * Gets the total storage size used by the organization in bytes.
 */
export async function getStorageUsed(orgId: string): Promise<number> {
  const user = await requireAuth();

  // Verify user membership in organization
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: orgId,
      },
    },
  });
  if (!membership) {
    throw new Error("Unauthorized: You are not a member of this organization.");
  }

  const storageAggregate = await db.file.aggregate({
    where: { organizationId: orgId },
    _sum: {
      size: true,
    },
  });

  return storageAggregate._sum.size || 0;
}

/**
 * Gets a paginated, search-filtered, and type-filtered list of files.
 */
export async function getFiles(
  orgId: string,
  filters: { query?: string; type?: string; page?: number; limit?: number } = {}
) {
  const user = await requireAuth();

  // Verify user membership
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: orgId,
      },
    },
  });
  if (!membership) {
    throw new Error("Unauthorized: You are not a member of this organization.");
  }

  const { query, type = "all", page = 1, limit = 12 } = filters;
  const skip = (page - 1) * limit;

  // Build query where clause
   
  const where: Prisma.FileWhereInput = {
    organizationId: orgId,
  };

  if (query) {
    where.name = {
      contains: query,
      mode: "insensitive",
    };
  }

  if (type === "images") {
    where.mimeType = {
      startsWith: "image/",
    };
  } else if (type === "documents") {
    where.mimeType = {
      in: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    };
  } else if (type === "other") {
    where.NOT = [
      {
        mimeType: {
          startsWith: "image/",
        },
      },
      {
        mimeType: {
          in: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ],
        },
      },
    ];
  }

  const [files, totalCount] = await Promise.all([
    db.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    db.file.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    files,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

/**
 * Deletes a file from both UploadThing storage and the local database.
 */
export async function deleteFile(fileId: string) {
  const user = await requireAuth();

  const file = await db.file.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new Error("File not found.");
  }

  // Verify membership
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: file.organizationId,
      },
    },
  });
  if (!membership) {
    throw new Error("Unauthorized: You are not a member of this organization.");
  }

  // Delete from UploadThing
  try {
    const utapi = new UTApi();
    await utapi.deleteFiles(file.key);
  } catch (error) {
    console.error("Error deleting from UploadThing:", error);
    // Fallback: we will still delete the file from the local DB so it doesn't leave orphaned references.
  }

  // Delete from database
  await db.file.delete({
    where: { id: fileId },
  });

  // Revalidate cache paths
  revalidatePath("/dashboard/files");

  // Dispatch standard notification
  await createNotification({
    userId: user.id,
    title: "File Deleted",
    message: `The file "${file.name}" was successfully deleted.`,
    type: "info",
    category: "files",
  });

  return { success: true };
}
