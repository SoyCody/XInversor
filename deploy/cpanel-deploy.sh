#!/bin/bash
# Script de despliegue para cPanel > Git Version Control (lo llama .cpanel.yml).
# Se ejecuta EN EL SERVIDOR, como tu usuario de cPanel, cada vez que pulsas
# "Deploy HEAD Commit". Hace lo que tú harías por Terminal:
#   0. escribe un diagnóstico del servidor (sistema, glibc, OpenSSL, límites)
#   1. copia backend/ a la carpeta de la app
#   2. instala dependencias (npm ci --ignore-scripts)
#   3. avisa a Passenger de que reinicie la app
#   4. comprueba si el WebAssembly del cliente de Prisma funciona aquí
#
# IMPORTANTE: en este servidor NO se ejecuta la CLI de Prisma (se queda sin
# memoria). El cliente (backend/generated) viene ya generado desde tu PC.
#
# Todo lo que pasa queda escrito en LOG (ábrelo con el Administrador de
# archivos de cPanel): sin Terminal, es tu única forma de ver errores.

# ---- Ajustes (lo único que normalmente hay que tocar) ----------------------
APP_DIR="${APP_DIR:-/home/fxinvers45/fxinversor-api}"
LOG="${LOG:-/home/fxinvers45/deploy-fxinversor.log}"
# Carpeta bin de Node que quieres usar. Déjalo vacío para elegir
# automáticamente la versión más nueva de /opt/cpanel/ea-nodejs*/bin.
# Ejemplo si quieres forzarla: NODE_DIR="/opt/cpanel/ea-nodejs20/bin"
NODE_DIR="${NODE_DIR:-}"
# -----------------------------------------------------------------------------

set -euo pipefail
exec >>"$LOG" 2>&1
trap 'echo "!!! FALLÓ el despliegue (línea $LINENO). Revisa el mensaje de arriba."' ERR

echo
echo "===== Despliegue $(date '+%F %T') ====="

# --- 0. Diagnóstico del servidor ----------------------------------------------
# Sirve para elegir binaryTargets (plan B) y entender los límites de memoria.
# Solo se imprime información del sistema: NUNCA variables de entorno.
echo "--- Sistema"
uname -srm || true
grep -E '^(PRETTY_NAME|ID|VERSION_ID)=' /etc/os-release || true
echo "glibc: $(ldd --version 2>&1 | head -n 1 || true)"
echo "OpenSSL: $(openssl version 2>&1 || true)"
echo "CPUs: $(nproc 2>&1 || true)"
echo "--- Memoria (MB)"
free -m || true
echo "--- Límites de la cuenta (ulimit -a)"
ulimit -a || true
echo "--- Límites del kernel para este proceso (Max address space = memoria virtual)"
grep -E 'Max (address space|data size|resident set|processes|open files)' /proc/self/limits || true
echo "-----"

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
rm -rf "$APP_DIR/src" "$APP_DIR/prisma" "$APP_DIR/scripts" "$APP_DIR/generated"
# Se excluyen a propósito: .env (el del servidor, con tus claves reales,
# NUNCA debe pisarse) y node_modules (se instala abajo). generated/ SÍ se
# copia: es el cliente de Prisma ya generado en tu PC.
tar -C "$REPO_DIR/backend" --exclude=.env --exclude=node_modules -cf - . \
  | tar -C "$APP_DIR" -xf -
echo "Código copiado."

# --- 3. Dependencias -----------------------------------------------------------
cd "$APP_DIR"
if [ ! -f .env ]; then
  echo "AVISO: no existe $APP_DIR/.env. La app no arrancará sin él."
fi

# npm ci instala EXACTAMENTE lo que dice package-lock.json (reproducible).
# --omit=dev: no instala nodemon ni la CLI de prisma (solo hacen falta en tu PC).
# --ignore-scripts: no ejecuta ningún script de instalación. Ya no hay
# "postinstall" (no se debe correr prisma generate aquí) y tsx/esbuild no
# los necesitan: esbuild trae su binario listo en @esbuild/linux-x64.
npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# El cliente de Prisma debe haber llegado ya generado desde el repositorio.
if [ ! -f generated/prisma/client.ts ]; then
  echo "Falta generated/prisma/client.ts: en tu PC ejecuta 'npm run prisma:generate' y commitea backend/generated."
  exit 1
fi
NATIVOS="$(find generated -type f \( -name '*.node' -o -name '*.so' -o -name '*.dll' -o -name '*.exe' \) || true)"
if [ -n "$NATIVOS" ]; then
  echo "AVISO: generated/ contiene binarios nativos (no deberían estar con engineType = client):"
  echo "$NATIVOS"
fi

# Envoltorio de Node para Passenger (plan B, ver bin/node-wasm.sh): necesita
# permiso de ejecución, que git en Windows no conserva.
chmod +x "$APP_DIR/bin/node-wasm.sh" 2>/dev/null || true

# Comprobación informativa: ¿cargan el cliente y el adaptador de Postgres?
# tsx usa WebAssembly, y en esta cuenta (límite de memoria virtual de 4 GB)
# falla sin --disable-wasm-trap-handler; por eso se usa aquí. Si falla NO
# se aborta: solo se avisa (la prueba detallada está al final).
if ! NODE_OPTIONS="--disable-wasm-trap-handler" node --import tsx -e "Promise.all([import('./generated/prisma/client.ts'), import('@prisma/adapter-pg')]).then(() => console.log('Cliente de Prisma + adaptador pg: carga OK'))"; then
  echo "AVISO: no se pudo cargar el cliente de Prisma con el flag (ver prueba al final)."
fi

# --- 4. Reiniciar Passenger ----------------------------------------------------
# Passenger reinicia la app cuando cambia la fecha de este archivo.
mkdir -p "$APP_DIR/tmp"
touch "$APP_DIR/tmp/restart.txt"

echo "===== Despliegue terminado OK ====="

# --- 5. ¿Funciona el WebAssembly en este servidor? --------------------------------
# Esta cuenta limita la memoria virtual (ulimit -v, ver arriba): sin
# --disable-wasm-trap-handler cualquier WebAssembly falla (tsx, Prisma). Aquí se
# prueba con el flag (B) y sin él (A) y se deja claro en el log.
#
# Cada prueba va aislada: un fallo (incluso un crash) solo queda registrado y el
# script sigue. Como el reinicio de Passenger ya se hizo arriba y no se usa
# `set -e` aquí, nada de esto puede tumbar el despliegue.
set +e
trap - ERR
echo
echo "===== Prueba de WebAssembly / Prisma ====="
echo "--- Prueba B: con NODE_OPTIONS=--disable-wasm-trap-handler"
NODE_OPTIONS="--disable-wasm-trap-handler" node scripts/check-runtime.js
RES_B=$?
echo "--- Prueba A: sin el flag (como arrancaría la app si Passenger no lo aplica)"
env -u NODE_OPTIONS node scripts/check-runtime.js
RES_A=$?
echo
echo "RESULTADO: A=$RES_A B=$RES_B"
echo "  (0 = OK, 2 = falla WebAssembly básico, 5 = falla tsx, 4 = DATABASE_URL mal, 6 = falla WebAssembly de Prisma, 3 = WebAssembly OK pero la BD no responde)"
if [ "$RES_B" = "0" ] || [ "$RES_B" = "3" ]; then
  if [ "$RES_A" = "0" ] || [ "$RES_A" = "3" ]; then
    echo ">>> WebAssembly funciona incluso sin el flag: no hace falta configurar nada especial."
  else
    echo ">>> HACE FALTA el flag: en cPanel > Application Manager añade la variable NODE_OPTIONS=--disable-wasm-trap-handler y reinicia la app."
    echo ">>> Si tras eso /health indica wasmTrapHandlerDisabled:false, usa el plan B: PassengerNodejs apuntando a $APP_DIR/bin/node-wasm.sh"
  fi
  if [ "$RES_B" = "3" ]; then
    echo ">>> Ojo: la base de datos no respondió en la prueba (revisa DATABASE_URL, Neon y el puerto 5432)."
  fi
else
  echo ">>> Ni siquiera con el flag funciona (B=$RES_B). Hay que pasar al motor nativo (plan B de Prisma) o revisar los límites de arriba."
fi
