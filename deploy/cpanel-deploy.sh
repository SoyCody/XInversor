#!/bin/bash
# Script de despliegue para cPanel > Git Version Control (lo llama .cpanel.yml).
# Se ejecuta EN EL SERVIDOR, como tu usuario de cPanel, cada vez que pulsas
# "Deploy HEAD Commit". Hace lo que tú harías por Terminal:
#   1. copia backend/ a la carpeta de la app
#   2. instala dependencias (npm ci) y genera el cliente de Prisma
#   3. avisa a Passenger de que reinicie la app
#
# Todo lo que pasa queda escrito en LOG (ábrelo con el Administrador de
# archivos de cPanel): sin Terminal, es tu única forma de ver errores.

# ---- Ajustes (lo único que normalmente hay que tocar) ----------------------
APP_DIR="${APP_DIR:-/home/fxinvers45/fxinversor-api}"
LOG="${LOG:-/home/fxinvers45/deploy-fxinversor.log}"
# Carpeta bin de Node que quieres usar. Déjalo vacío para elegir
# automáticamente la versión más nueva de /opt/cpanel/ea-nodejs*/bin.
# Ejemplo si quieres forzarla: NODE_DIR="/opt/cpanel/ea-nodejs22/bin"
NODE_DIR="${NODE_DIR:-}"
# -----------------------------------------------------------------------------

set -euo pipefail
exec >>"$LOG" 2>&1
trap 'echo "!!! FALLÓ el despliegue (línea $LINENO). Revisa el mensaje de arriba."' ERR

echo
echo "===== Despliegue $(date '+%F %T') ====="

# El script vive en <repo>/deploy/, así que el repo está un nivel arriba.
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Repositorio: $REPO_DIR"
echo "Destino:     $APP_DIR"

# --- 1. Encontrar Node/npm de cPanel -----------------------------------------
# cPanel instala Node en /opt/cpanel/ea-nodejsXX/bin. Ese directorio NO está
# en el PATH de un despliegue, por eso hay que buscarlo y añadirlo.
echo "Versiones de Node instaladas en el servidor:"
ls -d /opt/cpanel/ea-nodejs*/bin 2>/dev/null || echo "  (ninguna en /opt/cpanel)"

if [ -z "$NODE_DIR" ]; then
  NODE_DIR="$(ls -d /opt/cpanel/ea-nodejs*/bin 2>/dev/null | sort -V | tail -n 1 || true)"
fi
if [ -z "$NODE_DIR" ] || [ ! -x "$NODE_DIR/node" ]; then
  echo "No encuentro node. Pon en NODE_DIR (arriba) la carpeta correcta."
  exit 1
fi
export PATH="$NODE_DIR:$PATH"
echo "Usando Node: $(node -v) | npm: $(npm -v) | ($NODE_DIR)"

# --- 2. Copiar el backend ------------------------------------------------------
mkdir -p "$APP_DIR"
# Se borran solo las carpetas de CÓDIGO antes de copiar, para que no queden
# archivos viejos. NO se toca .env, node_modules ni tmp.
rm -rf "$APP_DIR/src" "$APP_DIR/prisma" "$APP_DIR/scripts"
# Se excluyen a propósito: .env (el del servidor, con tus claves reales,
# NUNCA debe pisarse), node_modules y generated (se regeneran abajo).
tar -C "$REPO_DIR/backend" --exclude=.env --exclude=node_modules --exclude=generated -cf - . \
  | tar -C "$APP_DIR" -xf -
echo "Código copiado."

# --- 3. Dependencias + Prisma --------------------------------------------------
cd "$APP_DIR"
if [ ! -f .env ]; then
  echo "AVISO: no existe $APP_DIR/.env. La app no arrancará sin él."
fi

# npm ci instala EXACTAMENTE lo que dice package-lock.json (reproducible).
# --omit=dev: no instala nodemon. prisma y tsx están en "dependencies".
# El script "postinstall" ya ejecuta `prisma generate`.
npm ci --omit=dev --no-audit --no-fund

# Se repite a propósito: es rápido y garantiza el cliente de Prisma aunque
# la versión de npm se salte los scripts de instalación.
npx prisma generate

# Comprobación: ¿se pueden cargar de verdad el cliente y el adaptador de
# Postgres en este servidor? (No toca la base de datos; para eso está /health.)
# El cliente usa engineType = "client": en tiempo de ejecución ya NO depende
# de ningún binario nativo de Prisma, solo del driver `pg` (JavaScript).
node --import tsx -e "Promise.all([import('./generated/prisma/client.ts'), import('@prisma/adapter-pg')]).then(() => console.log('Cliente de Prisma + adaptador pg OK'))"

# --- 4. Reiniciar Passenger ----------------------------------------------------
# Passenger reinicia la app cuando cambia la fecha de este archivo.
mkdir -p "$APP_DIR/tmp"
touch "$APP_DIR/tmp/restart.txt"

echo "===== Despliegue terminado OK ====="
