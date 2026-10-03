#!/bin/bash
# Envoltorio de Node para Passenger (plan B si Passenger no respeta la variable
# NODE_OPTIONS): arranca Node con --disable-wasm-trap-handler, que este hosting
# necesita porque limita la memoria virtual a 4 GB. Se usa con la directiva
# `PassengerNodejs /home/fxinvers45/fxinversor-api/bin/node-wasm.sh` en .htaccess.
# Passenger llama a este archivo en lugar de "node" y le pasa sus argumentos.
#
# Busca el Node más nuevo de cPanel; para fijar uno: NODE_BIN=/opt/cpanel/ea-nodejs20/bin/node
NODE_BIN="${NODE_BIN:-$(ls -d /opt/cpanel/ea-nodejs*/bin/node 2>/dev/null | sort -V | tail -n 1)}"
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  echo "node-wasm.sh: no encuentro node en /opt/cpanel/ea-nodejs*/bin" >&2
  exit 127
fi
exec "$NODE_BIN" --disable-wasm-trap-handler "$@"
