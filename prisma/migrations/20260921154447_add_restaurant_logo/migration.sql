-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "logo" BYTEA,
ADD COLUMN     "logoType" TEXT,
ADD COLUMN     "logoUpdatedAt" TIMESTAMP(3);
