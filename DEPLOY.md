# Guía de despliegue para Factoría SAC v1

## 1. Requisitos previos
- Node.js 20+ 
- npm 10+
- Una base de datos PostgreSQL
- Un proveedor de hosting con soporte para Next.js (Vercel, Railway, Render, Fly.io, VPS, etc.)

## 2. Variables de entorno de producción
Crea un archivo .env en producción con:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/dbname?schema=public"
JWT_SECRET="un-secreto-fuerte"
NEXTAUTH_SECRET="otro-secreto-fuerte"
NEXTAUTH_URL="https://tu-dominio.com"
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
NODE_ENV="production"
```

## 2.1. Deploy en Render usando Neon
Si usas Neon como base de datos externa, no uses la base de datos gestionada por Render. Crea la DB en Neon, copia la cadena de conexión y pégala en la variable de entorno `DATABASE_URL` de tu servicio Render.

El formato típico de Neon es:
```env
DATABASE_URL="postgresql://usuario:password@host:port/dbname?sslmode=require"
```

## 3. Preparar la base de datos
Ejecuta en el entorno de despliegue o en un stage previo:

```bash
npx prisma generate
npx prisma migrate deploy
```

Si render usa `render.yaml`, la variable `DATABASE_URL` debe estar definida en el panel de entorno o en los secretos de Render.

Si tu hosting no ejecuta migraciones automáticamente, hazlo manualmente antes de iniciar la app.

## 4. Build de producción
```bash
npm install
npm run build
```

## 5. Iniciar la app en producción
```bash
npm run start
```

## 6. Configuración de Google OAuth
En Google Cloud Console configura:
- Orígenes autorizados de JavaScript: https://tu-dominio.com
- URIs de redireccionamiento autorizados:
  - https://tu-dominio.com/api/auth/callback/google

## 7. Recomendación para hosting
### Vercel
- Conecta el repo
- Define las variables de entorno anteriores
- Build Command: npm run build
- Output: Next.js default

### Railway / Render / Fly.io
- Usa un servicio web Node.js
- Ejecuta build y luego start
- Asegura que la base de datos PostgreSQL esté conectada

## 8. Verificación post-despliegue
- Abre la URL principal
- Prueba el login
- Prueba el acceso a órdenes, inventario y reportes
- Revisa que las migraciones se aplicaron correctamente

## 9. Nota importante
El proyecto ya compila correctamente con:
```bash
npm run build
```

Si el despliegue falla, revisa primero:
- DATABASE_URL válida
- GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET configurados
- NEXTAUTH_URL coincidiendo con el dominio real
- Prisma migrations aplicadas
