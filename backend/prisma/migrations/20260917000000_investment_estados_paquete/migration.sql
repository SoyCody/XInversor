-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoInversion" ADD VALUE 'RECHAZADO';
ALTER TYPE "EstadoInversion" ADD VALUE 'EN_ESPERA';

-- AlterTable
ALTER TABLE "Inversion" ALTER COLUMN "monto" SET DEFAULT 0,
ALTER COLUMN "monto" SET DATA TYPE DECIMAL(18,8);
