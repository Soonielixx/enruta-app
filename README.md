# EnRuta · Panel administrador

Panel web Angular basado en las cinco páginas del archivo de mockups. Incluye acceso y registro, operación y supervisión, configuración, catálogos, usuarios y sistema.

Cada pantalla se implementa en su propio componente standalone dentro de `src/app/screens/`. `AppComponent` conserva el marco de navegación y comparte el estado de sesión/operación con las pantallas. Cada vista se monta dentro de `ScreenBoundaryComponent`, con manejo local de errores, mensaje de recuperación y opción de reintento para que un fallo en una pantalla no impida seguir usando las demás.

## Desarrollo

```bash
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200/`. Para compilar o ejecutar pruebas:

```bash
npm run build
npm test -- --watch=false
```

## Primer uso

La aplicación abre en el inicio de sesión sin usuarios ni datos de ejemplo. En esta maqueta, enviar el formulario de acceso simula una sesión y muestra el panel vacío; no hay un servidor de autenticación conectado. También se puede recorrer el flujo de recuperación de contraseña, verificación en dos pasos y alta de empresa.

Los registros, preferencias y cambios de configuración se mantienen en memoria durante la sesión. Al recargar la página se vuelve al estado inicial vacío. Las integraciones y acciones que requieren servicios externos se representan con estados locales y mensajes explícitos.

Desde el panel se puede crear rutas, clientes, productos, listas de precios y usuarios; editar parámetros y módulos; configurar formularios; administrar notificaciones y permisos; y preparar publicaciones. La importación acepta CSV o Excel `.xlsx` y utiliza la primera hoja del libro; debe incluir una columna `nombre`, `cliente` o `producto`, según el catálogo seleccionado.

## EnRuta · lógica funcional

- **Cuentas y sesión**: alta de empresa, login, recuperación (código local), 2FA TOTP, roles con permisos. Contraseñas con PBKDF2-SHA256; datos por empresa en `localStorage`.
- **Perfil**: nombre, teléfono, correo (confirmando contraseña), foto (recorte 256 px), cambio de contraseña, 2FA.
- **CRUD**: rutas, clientes, productos, usuarios, listas/promociones/descuentos y dispositivos (crear, editar, activar/desactivar, eliminar).
- **Mapbox** (`src/app/core/config.ts`): mapa en torre de control, planeador y ficha de cliente; geocodificación, direcciones (distancia/duración) y optimización de secuencia.
- Flujo de rutas: Borrador → Pendiente de aprobación → Publicada (bandeja de aprobaciones).

> No hay backend: para producción, migra `localStorage` a una API y restringe el token de Mapbox por URL.

## v2 · Dispositivos, QR y backend

- **Backend** (`backend/`, Node.js + PostgreSQL): `docker compose up --build` levanta Postgres y la API en `http://localhost:3000` (esquema en `backend/sql/schema.sql`). Variables en `backend/.env.example`.
- **Web**: `src/app/core/config.ts` define `API_URL` y `API_KEY`. Pantalla *Dispositivos*: alta en 2 secciones (hardware + logística relacional), detalle con QR (`angularx-qrcode`) con JWT de 15 min y un solo uso.
- **Móvil** (`mobile/enruta_driver`, Flutter): escanea con `mobile_scanner` y hace `POST /api/mobile/link` con token + modelo, SO y token FCM. El backend asocia el hardware al conductor, registra el historial e invalida el QR.
- Importación CSV/XLSX con detección de delimitador, vista previa, duplicados y plantillas; editor de formularios con propiedades por campo; marca con carga en 1 clic; liquidaciones y parámetros por alcance; indicadores con periodo; perfil con sesiones, bloqueo por intentos y cierre por inactividad.
