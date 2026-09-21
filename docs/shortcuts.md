# Registrar un viaje desde Atajos (iPhone)

## Configurar el servidor

1. Crea o selecciona tu proyecto Firebase y activa Firestore (base `(default)`).
2. En Firebase → Configuración del proyecto → Cuentas de servicio, obtén las credenciales del servidor. No las pongas en el atajo, GitHub ni variables `NEXT_PUBLIC_*`.
3. Copia `.env.example` a `.env.local` para desarrollo. En el hosting, configura las mismas variables y vuelve a desplegar:
   - `FIREBASE_PROJECT_ID`: project_id de la cuenta de servicio.
   - `FIREBASE_CLIENT_EMAIL`: client_email.
   - `FIREBASE_PRIVATE_KEY`: private_key; acepta saltos reales o `\n`.
   - `SHORTCUTS_API_KEY`: clave aleatoria de al menos 32 bytes. Puedes generar una con `openssl rand -hex 32`.
4. Usa reglas Firestore que denieguen acceso directo desde clientes si no tienes otras funciones que lo necesiten. El servidor usa permisos IAM mediante Admin SDK; no necesita reglas públicas.
5. Visita `https://black-driver-os-iack.vercel.app/api/trips`. `configured` solo indica presencia de variables: confirma la conexión guardando un viaje y comprobando el documento en Firestore.

## Crear el atajo «Registrar viaje»

1. Añade **Solicitar entrada** (texto) para la zona.
2. Usa **Elegir de la lista** para el servicio: Black, Black SUV, Premier, Comfort, XL, Private.
3. Solicita entrada de tipo **Número** para tarifa (`fare`, sin propina), propina (`tip`), millas (`miles`), minutos de espera (`waitingMinutes`) y duración del viaje (`tripMinutes`). Usa 0 cuando no haya propina o espera.
4. Genera un UUID y guárdalo en una variable `TripID`.
5. Añade **Obtener contenido de URL** con `https://black-driver-os-iack.vercel.app/api/trips`, método **POST**.
6. En encabezados configura:
   - `Authorization`: `Bearer TU_SHORTCUTS_API_KEY`
   - `Content-Type`: `application/json`
   - `Idempotency-Key`: variable `TripID`
7. Cuerpo de la solicitud: **JSON**. Crea las claves de abajo y asigna las variables anteriores; elige tipo Número en los cinco campos numéricos. No construyas JSON concatenando texto.

| Clave | Tipo | Ejemplo |
| --- | --- | --- |
| zone | Texto | Brickell |
| service | Texto | Black SUV |
| fare | Número | 62.50 |
| tip | Número | 12 |
| miles | Número | 14.2 |
| waitingMinutes | Número | 5 |
| tripMinutes | Número | 28 |

8. Lee `ok` del diccionario de respuesta. Si es verdadero, muestra «Viaje guardado» y `trip.id`. Si es falso, muestra `error`. Ante un error de red tampoco muestres confirmación.

**Reintentos:** conserva el mismo UUID y los mismos datos para reenviar un viaje. Guarda ambos en un archivo local antes de enviar si quieres recuperarlos después de cerrar el atajo. Ejecutar nuevamente un atajo que genera otro UUID registra un nuevo viaje. Esta guía no implementa una cola sin conexión.

## Comprobación

```sh
curl -i https://black-driver-os-iack.vercel.app/api/trips \
  -H "Authorization: Bearer $SHORTCUTS_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: prueba-viaje-001' \
  --data '{"zone":"Brickell","service":"Black SUV","fare":62.5,"tip":12,"miles":14.2,"waitingMinutes":5,"tripMinutes":28}'
```

Ejecuta con una clave ya configurada en tu entorno local. La prueba crea un viaje real en la colección `trips`. Primer envío: 201. Repetición idéntica: 200 y `duplicate: true`, sin segundo documento. Mismo identificador con datos diferentes: 409. Clave incorrecta: 401. Datos inválidos: 400. Configuración o almacenamiento no disponible: 503.

El servidor asigna `timestamp` UTC al guardar; no representa la hora original de un viaje capturado sin conexión. La clave permite escribir viajes de un solo conductor; no la compartas ni publiques el atajo con la clave incluida.

## Estado del panel

La página principal todavía es una demostración con datos de ejemplo. Los registros reales se comprueban en Firestore. Leerlos desde el panel requiere agregar autenticación del conductor antes de exponer los ingresos.

Referencias: [Firebase Admin](https://firebase.google.com/docs/admin/setup) y [solicitudes API con Atajos](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios).
