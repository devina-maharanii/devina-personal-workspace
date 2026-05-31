import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "./env";

const isDev = process.env.NODE_ENV !== "production";

type PrismaClientWithLogs = PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel>;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma: PrismaClientWithLogs | undefined;
  pool: Pool | undefined;
};

let prisma: PrismaClientWithLogs;

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      // Surface slow or N+1 queries during local development
      log: isDev
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [{ emit: "stdout", level: "error" }],
    });

    if (isDev) {
      // Log each query with its duration to the console
      globalForPrisma.prisma.$on("query", (e: Prisma.QueryEvent) => {
        if (e.duration > 100) {
          // Only show queries that take more than 100ms — reduces noise
          console.log(
            `[prisma:query] ${e.duration}ms  ${e.query.slice(0, 120)}`
          );
        }
      });
    }
  }
  prisma = globalForPrisma.prisma;
}

export const db = prisma;
export { prisma };
