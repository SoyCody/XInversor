## XInversor

Plataforma para fondo de inversiones


# Prototipo — Ejecución

## Requisitos previos

Antes de ejecutar el proyecto, es necesario tener instalados los siguientes programas:

* **Node.js**: versión **20.x o superior**.
* **npm**: incluido normalmente con Node.js.
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
## 2. Instalar las dependencias

Una vez dentro de la carpeta del proyecto, ejecutar:

```bash
npm install
```

Este comando instala todas las dependencias definidas en el archivo `package.json`.

---

## 3. Ejecutar el prototipo
Este se distribuye en dos secciones: "frontend" y "backend", con el mismo comando
debe iniciar los dos servidores accediendo al mismo nombre mencionado anteriormente 
Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

Después de ejecutar el comando, la terminal mostrará una dirección local similar a:

```text
http://localhost:5173/
```

Abrir la dirección indicada en el navegador para acceder al prototipo.

---

## 4. Detener el servidor

Para detener el servidor de desarrollo:

```bash
Ctrl + C
```

---

## 5. Volver a ejecutar el proyecto

Cada vez que se quiera ejecutar nuevamente el prototipo, basta con ingresar a la carpeta del proyecto y ejecutar:

```bash
npm install
npm run dev
```

`npm install` solamente es necesario cuando se instala el proyecto por primera vez o cuando se modifican sus dependencias.

---

No es necesario descargarla ni subirla al repositorio.

---

## 7. Comandos principales

| Comando           | Función                           |
| ----------------- | --------------------------------- |
| `git clone <URL>` | Clona el repositorio              |
| `cd <PROYECTO>`   | Ingresa a la carpeta del proyecto |
| `npm install`     | Instala las dependencias          |
| `npm run dev`     | Inicia el servidor de desarrollo  |
| `Ctrl + C`        | Detiene el servidor               |

---

## 8. Solución de problemas

### Error: `node` no se reconoce como comando

Comprobar que Node.js esté instalado:

```bash
node --version
```

Si el comando no funciona, instalar Node.js y reiniciar la terminal.

### Error al instalar dependencias

Eliminar la carpeta de dependencias y volver a instalarlas:

```bash
rm -rf node_modules
npm install
```

En Windows PowerShell se puede utilizar:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```
