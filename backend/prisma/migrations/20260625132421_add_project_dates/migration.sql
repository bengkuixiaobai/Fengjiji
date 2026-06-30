-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "buffer_days" INTEGER DEFAULT 0,
ADD COLUMN     "expected_end_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3);
