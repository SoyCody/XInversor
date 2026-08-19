-- CreateEnum
CREATE TYPE "State" AS ENUM ('BORRADO', 'ACTIVO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "state" "State" NOT NULL DEFAULT 'ACTIVO';
