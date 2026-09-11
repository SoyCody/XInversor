-- Índices de rendimiento. Postgres NO crea índices sobre las columnas de
-- clave foránea automáticamente, y varios listados ordenan/filtran por
-- (fk, createdAt). Ninguno cambia datos ni el esquema lógico: solo
-- aceleran las consultas existentes.
--
-- Si la tabla ya tiene volumen en producción, correr estas sentencias a
-- mano con CREATE INDEX CONCURRENTLY (fuera de transacción) para no
-- bloquear escrituras; el registro de la migración se marca luego con
-- `prisma migrate resolve --applied 20260910010000_add_indexes`.

-- CreateIndex
CREATE INDEX "User_state_createdAt_idx" ON "User"("state", "createdAt");

-- CreateIndex
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");

-- CreateIndex
CREATE INDEX "Audit_userId_idx" ON "Audit"("userId");

-- CreateIndex
CREATE INDEX "Inversion_clientId_createdAt_idx" ON "Inversion"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Estado_inversionId_createdAt_idx" ON "Estado"("inversionId", "createdAt");

-- CreateIndex
CREATE INDEX "Solicitud_adminId_idx" ON "Solicitud"("adminId");
