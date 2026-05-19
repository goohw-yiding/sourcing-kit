-- 3단계 요금제 적용을 위한 DB 스키마 변경
-- 실행 방법: Vercel PostgreSQL에서 직접 실행하거나
--           DATABASE_URL을 프로덕션 값으로 설정 후 `npx prisma db push`

-- 1. Subscription 테이블에 컬럼 추가
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "billingType" TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "expiresAt"   TIMESTAMPTZ;

-- 2. Subscription.plan 주석 업데이트 (free | taste | pro)
--    실제 enum 변경 없음, 문자열 컬럼이므로 바로 사용 가능

-- 3. AiUsageLog 테이블 신규 생성
CREATE TABLE IF NOT EXISTS "AiUsageLog" (
  "id"       TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "date"     TEXT NOT NULL,
  "count"    INTEGER NOT NULL DEFAULT 0,
  UNIQUE ("tenantId", "date")
);

-- 완료
