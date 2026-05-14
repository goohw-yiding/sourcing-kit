import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "prisma/dev.db");

function createPrisma() {
  const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const DEFAULT_TENANT_ID = "default_tenant";

export async function ensureDefaultTenant() {
  await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    update: {},
    create: { id: DEFAULT_TENANT_ID, name: "소싱킷 기본" },
  });
}
