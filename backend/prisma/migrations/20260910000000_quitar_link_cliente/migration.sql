-- El link de referido es único para todos los clientes: pasa a la
-- variable de entorno CLIENT_REFERRAL_LINK y se deja de guardar por fila.

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "link";
