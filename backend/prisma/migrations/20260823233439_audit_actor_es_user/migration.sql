/*
  Warnings:

  - You are about to drop the column `adminId` on the `Audit` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Audit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Audit" DROP CONSTRAINT "Audit_adminId_fkey";

-- AlterTable
ALTER TABLE "Audit" DROP COLUMN "adminId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
