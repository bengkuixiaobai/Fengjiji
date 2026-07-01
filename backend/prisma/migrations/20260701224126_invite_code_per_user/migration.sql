-- 改造 InviteCode:
--   1. 删除 usedById/usedAt(旧:1 个码只能用 1 次)
--   2. 增加 usageCount/maxUsage(新:1 个码最多用 5 次)

-- 删除外键约束和列
ALTER TABLE "invite_codes" DROP CONSTRAINT IF EXISTS "invite_codes_used_by_id_fkey";
ALTER TABLE "invite_codes" DROP COLUMN IF EXISTS "used_by_id";
ALTER TABLE "invite_codes" DROP COLUMN IF EXISTS "used_at";

-- 新增使用次数字段
ALTER TABLE "invite_codes" ADD COLUMN "usage_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "invite_codes" ADD COLUMN "max_usage" INTEGER NOT NULL DEFAULT 5;