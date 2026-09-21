# Black Driver OS

MVP Next.js para registrar viajes de un conductor desde Apple Shortcuts.

## Desarrollo

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Configura las variables de `.env.local` antes de enviar viajes. Consulta [la guía de Shortcuts y Firebase](docs/shortcuts.md).

## Verificación

```sh
npm test
npm run typecheck
npm run build
```

`POST /api/trips` valida datos, exige una clave Bearer y guarda en Firestore. El encabezado opcional `Idempotency-Key` evita duplicados al reintentar; el atajo debe enviarlo siempre. Solo confirma después de guardar. `GET /api/trips` informa configuración sin publicar viajes ni claves.

El panel consulta los viajes de hoy (America/New_York) con autenticación Bearer mediante la clave del atajo y actualiza cada 30 segundos. La clave solo permanece en memoria mientras la página está abierta. No hay cola offline.
