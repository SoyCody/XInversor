## XInversor

Plataforma para fondo de inversiones

# Prototipo — Ejecución

## Requisitos previos

Antes de ejecutar el proyecto, es necesario tener instalados los siguientes programas:

* **Node.js**: versión **22.6 o superior** (el backend usa `--experimental-strip-types`).
* **npm**: incluido normalmente con Node.js.
* **PostgreSQL**: corriendo y accesible (local o remoto).
* **Git**: para clonar y gestionar el repositorio.
* Un editor de código, recomendado **Visual Studio Code**.
* Un navegador web actualizado.

---

## 1. Clonar el repositorio

Abrir una terminal y ejecutar:

```bash
git clone https://github.com/SoyCody/XInversor.git
```

Ingresar al directorio del proyecto a nivel de terminal:

```bash
cd XInversor
```

---

## 2. Configurar las variables de entorno

El proyecto se distribuye en dos secciones independientes, "backend" y
"frontend", y cada una lee su propio `.env`. Copiar la plantilla de cada
una y completar los valores (ver los comentarios de cada archivo):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

En desarrollo local, `frontend/.env` puede dejarse vacío o sin crear:
`VITE_API_URL` por defecto apunta a `http://localhost:3001`.

---

## 3. Instalar las dependencias

Backend y frontend mantienen cada uno su propio `package.json` y su
propio `node_modules` (no son un único paquete), así que se instalan los
tres por separado con un solo comando desde la raíz:

```bash
npm install
npm run install:all
```

`npm install` (sin más) instala solo lo que usa la raíz (hoy,
`concurrently`, para poder levantar los dos servidores con un mismo
comando). `npm run install:all` instala backend y frontend.

Instalar las dependencias del backend también corre `prisma generate`
automáticamente (script `postinstall`), que genera el cliente de Prisma
para la plataforma donde se está instalando.

---

## 4. Preparar la base de datos

Con `backend/.env` ya apuntando a un Postgres accesible, aplicar las
migraciones (crea las tablas):

```bash
cd backend
npx prisma migrate dev
cd ..
```

(`migrate dev` es el comando pensado para desarrollo; para producción ver
la sección de despliegue más abajo.)

---

## 5. Ejecutar el prototipo

Para iniciar frontend y backend juntos, con el mismo comando:

```bash
npm run dev
```

Esto levanta el backend en `http://localhost:3001` y el frontend en:

```text
http://localhost:5173/
```

Abrir la dirección del frontend en el navegador para acceder al
prototipo. Si se prefiere levantar cada uno por separado (dos
terminales), también funciona `npm run dev --prefix backend` /
`--prefix frontend`.

---

## 6. Detener el servidor

Para detener el servidor de desarrollo:

```bash
Ctrl + C
```

---

## 7. Volver a ejecutar el proyecto

Cada vez que se quiera ejecutar nuevamente el prototipo, basta con
ingresar a la carpeta del proyecto y ejecutar:

```bash
npm run install:all
npm run dev
```

`npm run install:all` solamente es necesario cuando se instala el
proyecto por primera vez o cuando se modifican sus dependencias.

---

## 8. Comandos principales

| Comando               | Función                                    |
| ---------------------- | ------------------------------------------ |
| `git clone <URL>`      | Clona el repositorio                       |
| `cd <PROYECTO>`        | Ingresa a la carpeta del proyecto          |
| `npm install`          | Instala las dependencias de la raíz        |
| `npm run install:all`  | Instala backend y frontend                 |
| `npm run dev`          | Inicia backend + frontend en desarrollo    |
| `npm run build`        | Compila el frontend para producción        |
| `npm start`            | Inicia el backend en modo producción       |
| `Ctrl + C`             | Detiene el/los servidor(es)                |

---

## 9. Solución de problemas

### Error: `node` no se reconoce como comando

Comprobar que Node.js esté instalado:

```bash
node --version
```

Si el comando no funciona, instalar Node.js y reiniciar la terminal.

### Error al instalar dependencias

Eliminar la carpeta de dependencias afectada y volver a instalarla (en
`backend/`, `frontend/` o la raíz, según dónde falle):

```bash
rm -rf node_modules
npm install
```

En Windows PowerShell se puede utilizar:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### `PrismaClientInitializationError: Can't reach database server`

Postgres no está corriendo o `DATABASE_URL` (en `backend/.env`) no
apunta a donde corre. Confirmar que el servicio de Postgres esté activo
y que la cadena de conexión sea correcta.

---

# Despliegue en producción

El backend (Node/Express + Postgres) y el frontend (SPA de React
compilada a estático) se despliegan por separado; pueden ir en el mismo
servidor o en plataformas distintas.

## Backend

1. Definir todas las variables de `backend/.env.example` en el entorno
   de destino, prestando atención a:
   - `NODE_ENV=production` (activa la cookie de sesión `Secure`, solo
     viaja por HTTPS).
   - `FRONTEND_URL`: el origen exacto (protocolo + dominio) donde va a
     quedar el frontend ya desplegado.
   - `COOKIE_SAME_SITE`: `lax` alcanza si frontend y backend comparten
     dominio registrable (aunque sea en subdominios distintos, p. ej.
     `app.xinversor.com` + `api.xinversor.com`). Si van a quedar en
     dominios totalmente distintos (p. ej. frontend en Vercel + backend
     en Railway), cambiar a `none` — eso fuerza `Secure` automáticamente
     (ver `auth.middleware.js`), así que el backend debe servir por
     HTTPS.
   - `TRUST_PROXY`: casi cualquier plataforma pone un proxy/balanceador
     delante del backend; sin esto, todas las conexiones le llegan al
     backend con la IP del proxy, y los límites de intentos por IP (ver
     `rateLimit.middleware.js`) terminan compartiendo un único cupo
     entre todos los usuarios (ver `server.js`). 1 alcanza para un solo
     proxy delante.
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL`: con una cuenta de Resend
     sin dominio propio verificado, los correos de verificación **solo**
     llegan a la dirección con la que se creó esa cuenta de Resend. Para
     que le lleguen a clientes reales hay que verificar un dominio en
     resend.com/domains y usar una dirección de ese dominio como
     `RESEND_FROM_EMAIL`.
2. Instalar dependencias (corre `prisma generate` solo, vía
   `postinstall`) y aplicar las migraciones pendientes:
   ```bash
   npm install --prefix backend
   npm run migrate:deploy --prefix backend
   ```
   `migrate deploy` (a diferencia de `migrate dev`) no crea migraciones
   nuevas ni pide confirmación: solo aplica las que ya están en
   `backend/prisma/migrations`, que es lo que corresponde en producción.
3. Arrancar:
   ```bash
   npm start --prefix backend
   ```
   (equivalente a `npm run migrate:deploy && npm start` desde la raíz).

El cliente de Prisma generado (`backend/generated/`) no se versiona en
git a propósito: incluye un binario nativo específico de la plataforma
donde se generó, así que debe regenerarse en el servidor de destino
(el `postinstall` de arriba ya lo hace).

## Frontend

```bash
npm run build --prefix frontend
```

Genera el estático en `frontend/dist/`, listo para servir desde
cualquier hosting estático (nginx, Netlify, Vercel, un bucket con CDN,
el mismo panel de hosting del backend...). `VITE_API_URL` se lee **en
tiempo de build**, así que debe estar seteada a la URL pública del
backend ya desplegado antes de correr `npm run build` (no alcanza con
cambiarla después en el servidor).
