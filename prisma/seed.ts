import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });
const DEFAULT_TENANT_ID = "default_tenant";

async function main() {
  await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    update: {},
    create: { id: DEFAULT_TENANT_ID, name: "소싱킷 기본" },
  });
  console.log("✅ 기본 테넌트 생성 완료");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
