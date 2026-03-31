# Tripo

Tripo es una aplicación de seguimiento de rutas GPS con grabación, navegación y sincronización en la nube. Está construida con Next.js 16, React 19, Tailwind CSS y Leaflet.

## 🚀 Funcionalidades

- Grabación de rutas GPS en tiempo real.
- Cálculo de distancia y velocidad instantánea.
- Navegación paso a paso usando OpenRouteService.
- Guardado local (`localStorage`) y en la nube (Supabase).
- Migración de rutas locales a la nube.
- Historial de rutas: ver, renombrar, eliminar, cargar y seguir rutas guardadas.
- Mapa de detalle con trazo de ruta y vista escalada.

## 📁 Estructura de archivos

- `src/app/`
  - `page.tsx`: Página principal con mapa y migración local→nube.
  - `login/page.tsx`: Login y registro.
  - `trips/page.tsx`: Listado de viajes y edición.
  - `trips/[id]/page.tsx`: Detalle de viaje con mapa.
- `src/components/`
  - `MapView.tsx`: Lógica principal del mapa, grabación y navegación.
  - `MapClient.tsx`: Carga dinámica de `MapView` sin SSR.
  - `TripDetailMap.tsx` / `TripDetailMapClient.tsx`: Mapa del detalle de viaje.
  - `TripPreview.tsx`: Vista previa de ruta en SVG.
  - `Modal.tsx`: Componente modal reutilizable.
  - `map/SearchBar.tsx`: Barra de búsqueda de destinos.
  - `map/NavigationPanel.tsx`: Panel de navegación y estadísticas.
  - `map/DevPanel.tsx`: Panel de herramientas de desarrollo.
- `src/hooks/`
  - `useUser.ts`: Observa estado de usuario Supabase.
  - `useGpsTracking.ts`: Manejo de geolocalización.
  - `useDemoMode.ts`: Simulación de ruta demo.
  - `useNavigation.ts`: Cálculo de ruta y pasos en navegación.
  - `usePlaceSearch.ts`: Búsqueda de lugares y resultados.
  - `useTripRecording.ts`: Grabación de rutas y estadísticas.
- `src/lib/`
  - `auth.ts`: Funciones `signUp`, `signIn`, `signOut`, `getCurrentUser`.
  - `supabase.ts`: Cliente Supabase.
  - `trips.ts`: Persistencia local (`localStorage`).
  - `trips-cloud.ts`: CRUD en Supabase para tabla `trips`.
  - `migrateTrips.ts`: Migración rutas local→nube.
  - `routing.ts`: Llamada a API de OpenRouteService.
  - `utils.ts`: Funciones utilitarias (distancia, tiempo, etc.).
  - `map-utils.ts`: Utilidades para mapas (distancia, bearing, rutas demo).
- `src/types/trip.ts`: Tipos compartidos (`Position`, `SavedTrip`, etc.).

## � env variables (obligatorio)

Crea `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=<tu_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_supabase_anon_key>
NEXT_PUBLIC_ORS_API_KEY=<tu_openrouteservice_api_key>
```

## 🛠️ Instalación y ejecución

```bash
npm install
npm run dev
```

Accede en `http://localhost:3000`.

### Build y producción

```bash
npm run build
npm run start
```


## 🧩 Flujo principal

1. Loguearse en `/login`.
2. En `/`, iniciar grabación, desplazarse y detener.
3. Guardar ruta con título.
4. Ver rutas en `/trips`, renombrar/eliminar.
5. Ver detalle en `/trips/[id]` y seguir la ruta guardada.
6. Migrar rutas locales a la base de datos con el botón en la home.

## 🧪 Recomendación de tests

- Unit tests a `src/lib` y `src/hooks`.
- E2E con Playwright: login, grabación, guardado, listado y detalle.

## 🧾 Notas

- El mapa usa `react-leaflet` con `dynamic` para evitar SSR.
- Soporta seguir rutas guardadas: desde `/trips` o `/trips/[id]`, inicia navegación siguiendo el trazo exacto.
- `fonts` y estilo general están en `src/app/globals.css`.
- `routing.ts` exige `NEXT_PUBLIC_ORS_API_KEY`, lanza error si falta.

