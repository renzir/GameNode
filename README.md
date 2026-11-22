# GameNode 🎮

Plataforma para alojar y jugar juegos simples en 2D directamente desde el navegador. Inspirada en itch.io pero minimalista: catálogo público, página por juego con reproductor inline, y subida de juegos vía web o terminal.

## Stack

- **Backend:** Node.js + Express
- **Frontend:** React + Vite + TailwindCSS
- **Almacenamiento:** Sistema de archivos local (sin base de datos en el MVP)

## Estructura del proyecto

```
GameNode/
├── server/          ← Backend API (Express)
│   ├── src/index.js
│   └── src/routes/games.js
├── client/          ← Frontend React SPA (Vite + TailwindCSS)
│   ├── vite.config.js
│   └── tailwind.config.js
├── games/           ← Directorio donde se almacenan los juegos subidos
└── SPEC.md          ← Especificación técnica detallada
```

## Instalación local

### Backend (API)

```bash
cd server && npm install && node src/index.js
# API disponible en http://localhost:3421
```

### Frontend (React SPA)

```bash
cd client && npm install && npx vite --port 3420
# Disponible en http://localhost:3420 con proxy a la API
```

## Variables de entorno (.env en server/)

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| PORT | `3421` | Puerto del servidor API |
| GAMES_DIR | `./games` | Directorio donde se almacenan los juegos |
| MAX_UPLOAD_SIZE | `52428800` (50MB) | Límite de tamaño por upload |

## Producción

En producción, el backend sirve también los archivos estáticos del frontend:

```bash
cd server && NODE_ENV=production node src/index.js
# Todo en un solo proceso — http://localhost:3421
```

El build del cliente se genera con `npm run build` dentro de la carpeta `client/`.

## Subir juegos

- **Vía web:** Ir a `/upload`, llenar título/descripción, subir .zip (index.html + assets) y opcionalmente un thumbnail.
- **Vía terminal:** Copiar directamente en `games/<game-id>/` con su `meta.json`.
