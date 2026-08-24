/*
  Warnings:

  - Added the required column `tableName` to the `Audit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetId` to the `Audit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoInversion" AS ENUM ('EN_PROGRESO', 'ACEPTADO', 'RECHAZADO', 'RETIRADO');

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "tableName" TEXT NOT NULL,
ADD COLUMN     "targetId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Inversion" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "comision" DECIMAL(65,30) NOT NULL,
    "dias" INTEGER NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estado" (
    "id" SERIAL NOT NULL,
    "inversionId" INTEGER NOT NULL,
    "estado" "EstadoInversion" NOT NULL DEFAULT 'EN_PROGRESO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Estado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inversion" ADD CONSTRAINT "Inversion_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estado" ADD CONSTRAINT "Estado_inversionId_fkey" FOREIGN KEY ("inversionId") REFERENCES "Inversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
