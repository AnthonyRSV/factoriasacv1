# Sistema de Gestión de Producción e Inventario - Factoría Metalúrgica

Este repositorio contiene el sistema completo para la gestión de cotizaciones, órdenes de fabricación, líneas de proceso en taller (Kanban), e inventario dual (Materia Prima e Inventario Comercial), diseñado para operar de manera altamente portable y con integridad transaccional ACID garantizada.

El sistema está desarrollado con **Next.js 16 (App Router)**, **TypeScript**, **Vanilla CSS (CSS Modules)** y **Prisma ORM** con soporte nativo para **PostgreSQL**.

---

## 🚀 Requisitos Previos

Antes de instalar el sistema, asegúrate de tener instalado:
* **Node.js**: Versión `v20` o superior (se desarrolló y testeó con `v24.16.0`).
* **npm**: Gestor de paquetes incluido con Node.js.
* **Git**: Para clonar y gestionar versiones.

---

## 🛠️ Guía de Instalación y Configuración Local

Sigue estos sencillos pasos para clonar e iniciar el sistema en tu editor de código (VS Code, Cursor, etc.):

### 1. Clonar el Repositorio
Abre tu terminal favorita y clona el proyecto en tu máquina local:
```bash
git clone https://github.com/AnthonyRSV/factoriasacv1.git
cd factoriasacv1
```

### 2. Instalar Dependencias
Instala todos los paquetes requeridos por el backend y frontend del proyecto:
```bash
npm install
```

### 3. Configurar las Variables de Entorno (`.env`)
El proyecto incluye soporte para dos modos de base de datos:
1. **Base de Datos Simulada (JSON)**: Se activa de manera automática si no hay una base de datos PostgreSQL conectada. Sirve para probar toda la lógica de negocio y reportes al instante (Zero-Setup).
2. **PostgreSQL Real**: Utiliza un motor PostgreSQL real (como Neon.tech o Supabase).

Crea un archivo llamado `.env` en la raíz del proyecto (puedes tomar como base el archivo `.env` configurado):
```env
# URL de conexión de tu PostgreSQL (reemplázala con tu string de base de datos real)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metal_db?schema=public"

# Clave secreta para tokens de autenticación
JWT_SECRET="factoriasac_secret_key"

# OAuth de Google para NextAuth
GOOGLE_CLIENT_ID="tu_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu_client_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3.1. Configurar Google OAuth
En Google Cloud Console, agrega exactamente estos valores para el cliente OAuth web del proyecto:

* **Orígenes autorizados de JavaScript**: `http://localhost:3000`
* **URIs de redireccionamiento autorizados**: `http://localhost:3000/api/auth/callback/google`

Si usas otro host o puerto, reemplázalo también aquí y en `NEXTAUTH_URL`. El error `redirect_uri_mismatch` aparece cuando la URL que devuelve NextAuth no coincide con una URI autorizada en Google.

### 4. Generar el Cliente de Prisma
Compila el ORM de base de datos para generar los tipos estáticos de TypeScript:
```bash
npx prisma generate
```

### 5. Configurar PostgreSQL (Opcional - Si usas una BD PostgreSQL real)
Si conectaste un PostgreSQL real, ejecuta las migraciones para crear la estructura de tablas y siembra los datos iniciales (roles de usuario, insumos base y productos):
```bash
# Ejecutar migraciones para crear las tablas base
npx prisma migrate dev --name init

# Sembrar datos base en la BD (usuarios de prueba, insumos y fórmulas)
npx prisma db seed
```

---

## 🏃 Ejecutar el Proyecto

### Levantar el Servidor de Desarrollo
Para arrancar el sistema en modo local:
```bash
npm run dev
```
Una vez que el servidor esté listo, abre tu navegador web en:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 Roles y Credenciales para Pruebas
El sistema implementa un control de acceso basado en roles (RBAC) seleccionable desde la barra superior de la interfaz para facilitar la simulación:

| Usuario | Rol | Correo | Contraseña de Semilla |
| :--- | :--- | :--- | :--- |
| **Laura Vendedora** | VENDEDOR | `vendedor@metal.com` | `vendedor123` |
| **Manuel Jefe Taller** | JEFE_TALLER | `jefe@metal.com` | `jefe123` |
| **Juan Almacenero** | ALMACENERO | `almacenero@metal.com` | `almacenero123` |
| **Carlos Admin** | ADMIN | `admin@metal.com` | `admin123` |

---

## 🧪 Ejecutar Pruebas de Integridad

El proyecto incluye un script de verificación automatizado (`test-endpoints.js`) que simula de principio a fin el flujo de una orden (creación urgente, abono de pago, descuento matemático de stock, Kardex, reabastecimiento de insumos, firmas de autorización del Jefe de Taller, actualización del Kanban de producción y reportes técnicos agregados).

Con el servidor de desarrollo corriendo (`npm run dev`), ejecuta en otra terminal:
```bash
node test-endpoints.js
```
El script reportará `ALL VERIFICATION PASSED SUCCESSFULLY` cuando todas las validaciones de backend e integridad transaccional hayan pasado.
