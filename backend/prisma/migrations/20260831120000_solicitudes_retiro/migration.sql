-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoInversion_new" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'RETIRADO');
ALTER TABLE "public"."Estado" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Estado" ALTER COLUMN "estado" TYPE "EstadoInversion_new" USING ("estado"::text::"EstadoInversion_new");
ALTER TYPE "EstadoInversion" RENAME TO "EstadoInversion_old";
ALTER TYPE "EstadoInversion_new" RENAME TO "EstadoInversion";
DROP TYPE "public"."EstadoInversion_old";
ALTER TABLE "Estado" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
COMMIT;

-- AlterTable
ALTER TABLE "Estado" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "Inversion" ALTER COLUMN "monto" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "intereses" SET DATA TYPE DECIMAL(18,8);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" SERIAL NOT NULL,
    "inversionId" INTEGER NOT NULL,
    "montoRetiro" DECIMAL(18,8) NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "pendiente" BOOLEAN DEFAULT true,
    "adminId" INTEGER,
    "resueltaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_inversionId_pendiente_key" ON "Solicitud"("inversionId", "pendiente");

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_inversionId_fkey" FOREIGN KEY ("inversionId") REFERENCES "Inversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Refuerza la semantica de `pendiente`: solo puede ser true (solicitud abierta)
-- o NULL (ya resuelta). "false" queda prohibido, asi el indice unico
-- [inversionId, pendiente] nunca colisiona entre solicitudes resueltas.
-- Prisma ignora los CHECK, por lo que esta linea no genera drift.
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_pendiente_check"
    CHECK ("pendiente" IS NULL OR "pendiente" = true);
