# Memoria Descriptiva del Sistema de Control de Producción e Inventario (Factoría Sánchez)

## 1. Introducción
El proyecto es un sistema integral de gestión operativa diseñado para controlar el flujo de trabajo de un taller de fabricación metal-mecánica y distribución de autopartes (Factoría Sánchez). El software centraliza la administración de órdenes de fabricación, seguimiento de procesos de taller, cotizaciones y la gestión dual de inventario, operando a través de una plataforma web accesible por diferentes roles dentro de la empresa.

## 2. Objetivos
**Objetivo General:**  
Proveer un sistema web unificado que optimice y automatice el registro, seguimiento y control de las órdenes de fabricación, los procesos de taller y los movimientos de inventario.

**Objetivos Específicos:**
- Controlar el inventario de insumos de materia prima y productos comerciales mediante un registro de Kardex de entradas y salidas.
- Gestionar de forma trazable el ciclo de vida completo de las órdenes de fabricación (desde su registro y pago de abonos hasta la entrega).
- Proveer a los clientes un medio transparente para consultar el estado en tiempo real de su orden mediante un enlace seguro.
- Proporcionar indicadores estadísticos y visuales de producción y rentabilidad a la administración.
- Gestionar niveles de acceso y responsabilidades mediante un modelo basado en roles.

## 3. Problemática que resuelve
A partir de la lógica implementada, el sistema aborda los siguientes problemas:
- **Falta de trazabilidad en la producción:** Pérdida de control sobre en qué etapa se encuentra un pedido dentro del taller y quién es el operario responsable.
- **Desconexión de inventarios:** Manejo confuso entre la materia prima utilizada para la producción (insumos) y los productos terminados para venta directa.
- **Falta de transparencia con el cliente:** Dependencia exclusiva de la comunicación manual y constante (vía teléfono o presencial) para informar al cliente si su pedido está listo o en producción.
- **Inseguridad en pagos:** Dificultad para llevar el rastro del monto total de una orden, cuánto fue abonado como adelanto y el saldo pendiente.

## 4. Alcance
**Incluye:**
- Sistema de autenticación con control de acceso basado en roles (Administrador, Vendedor, Jefe de Taller, Almacenero).
- Módulo de órdenes de fabricación (creación, abonos, seguimiento).
- Generación de token único público para la visualización externa del pedido por parte del cliente.
- Gestión de inventario dual (Materia Prima y Producto Comercial).
- Gestión de Usuarios (CRUD) con avatares/imágenes de perfil.
- Tableros estadísticos para la administración.

**NO incluye:**
- Integración con sistemas de facturación electrónica o comprobantes fiscales oficiales (ej. SUNAT, AFIP).
- Contabilidad financiera profunda (libro mayor, balance general, gestión de nóminas).
- Sistema automático de compras o integración con proveedores externos (el reabastecimiento de materia prima se registra manualmente).

## 5. Requerimientos Funcionales
1. **RF-01 (Autenticación):** El sistema debe permitir el inicio de sesión basado en credenciales (correo y contraseña) con NextAuth.
2. **RF-02 (Gestión de Órdenes):** El usuario (Vendedor/Admin) debe poder registrar una nueva orden de fabricación indicando cliente, fecha comprometida, monto y detalles del producto (calidad de acero, pintura, tuercas, etc.).
3. **RF-03 (Control de Pagos):** El sistema debe permitir registrar abonos adicionales sobre órdenes pendientes y validar que el monto no exceda el saldo.
4. **RF-04 (Seguimiento de Producción):** El Jefe de Taller debe poder visualizar las órdenes aprobadas, asignar operarios a las etapas de producción y marcar dichas etapas como completadas.
5. **RF-05 (Consulta Externa):** El sistema debe generar un token de consulta público (`/api/external/[token]`) para que los clientes vean el progreso de su orden sin iniciar sesión.
6. **RF-06 (Gestión de Inventario Dual):** El sistema debe permitir visualizar, crear y editar el catálogo de Materias Primas y Productos Comerciales.
7. **RF-07 (Control de Kardex):** El Almacenero debe poder registrar movimientos manuales (ingresos o egresos) especificando cantidad y motivo, afectando automáticamente el stock actual.
8. **RF-08 (Autorización de Salidas):** El Jefe de Taller debe poder autorizar formalmente la salida de materiales de producción hacia el taller.
9. **RF-09 (Dashboard):** El sistema debe presentar gráficos y métricas consolidadas sobre el número de órdenes y el estado general de las operaciones (exclusivo para Administrador).
10. **RF-10 (Gestión de Usuarios):** El Administrador debe poder realizar operaciones CRUD completas sobre las cuentas de usuario de los empleados.

## 6. Requerimientos No Funcionales
- **Seguridad:** Las contraseñas se encriptan utilizando el algoritmo de `bcryptjs`. Las rutas de la API (`/api/*`) están protegidas validando la sesión del usuario y su rol.
- **Rendimiento:** Interfaz desarrollada como SPA en el cliente con React, optimizando la recarga de datos mediante validación condicional sin refrescar el navegador por completo.
- **Interfaz de Usuario:** Interfaz responsiva adaptada a dispositivos móviles, estilizada con CSS Modules, tipografía moderna e iconografía clara (Lucide React).
- **Mantenibilidad:** Código fuertemente tipado en TypeScript. Base de datos gestionada por un ORM moderno que previene la inyección SQL.

## 7. Funcionalidades Principales
- **Dashboard Institucional:** Visualización gráfica con `Recharts` (diagramas de barras y de torta) mostrando estatus de inventario, procesos del mes y métricas financieras clave.
- **Panel de Órdenes:** Lista interactiva con filtros de búsqueda por Orden de Compra (OC-...), modales para detalles, emisión de abonos y avance de estados operacionales (Pendiente de Pago -> Aprobada -> En Producción -> Terminada -> Entregada).
- **Panel de Producción:** Submódulos "Calendario" y "Seguimiento" (`CalendarioProduccion.tsx`, `SeguimientoOrdenes.tsx`) para la coordinación física del taller y asignación de operarios.
- **Panel de Inventario:** Pestañas separadas para gestionar Insumos de Taller (Producción) y Stock Comercial, con visibilidad completa del historial de entradas y salidas (Kardex).
- **Vista Cliente Externa:** Pantalla simplificada accesible públicamente en base a un hash (Token de Consulta).

## 8. Arquitectura del Software
El sistema sigue un patrón de Arquitectura Web Moderna (orientada a componentes en Frontend y Serverless en Backend):
- **Capa de Presentación (Frontend):** Construido usando React dentro de Next.js (App Router), con manejo de estados locales y modales interactivos en el cliente (`use client`).
- **Capa Lógica (Backend):** Implementado mediante Next.js API Routes ubicadas en `src/app/api/...` que procesan las peticiones, aplican reglas de negocio y controlan la autorización.
- **Capa de Acceso a Datos:** Se hace uso del ORM Prisma para interactuar con la base de datos relacional.
- **Tecnologías y Versiones:**
  - Next.js: `16.2.10`
  - React: `19.2.4`
  - Base de Datos: PostgreSQL
  - ORM: Prisma Client `6.19.3`
  - Autenticación: NextAuth `^5.0.0-beta.31`
  - Gráficos: Recharts `^3.9.2`

## 9. Modelo de Datos
Entidades y tablas principales identificadas en la estructura de base de datos (`schema.prisma`):
- **Gestión de Identidad:** `User` (credenciales y rol), `Account`, `Session`, `VerificationToken`.
- **Producción y Órdenes:**
  - `OrdenesFabricacion`: Cabecera de la orden (cliente, fechas, abonos, estado, prioridad).
  - `DetalleOrden`: Items de la orden, medidas (largo, ancho), características físicas (color, acero) y relación al producto.
  - `ProcesoEtapa`: Tareas operativas de taller asignadas a una orden.
  - `SalidaAutorizada`: Registro de aprobación física por el jefe de taller.
- **Inventario:**
  - `MateriaPrima`: Insumos básicos (tipo de material: VARILLA, PLATINA, etc., con stock actual/mínimo).
  - `ProductosFichaTecnica`: Productos elaborados cuya fabricación consume materia prima.
  - `ProductoComercial`: Catálogo de ítems terminados para venta rápida.
  - `KardexInventario` / `KardexComercial`: Tablas que guardan el historial cronológico de movimientos (INGRESO / EGRESO) junto al usuario que lo realizó y el motivo.

## 10. Interfaz de Usuario
- **Navegación:** Barra lateral (Sidebar) colapsable con menús adaptables en tiempo real según el rol autenticado.
- **Vistas y Componentes:** Formularios estilizados contenidos en tarjetas modales. Presentación de la información en listas jerárquicas y tablas ligeras con colores de estado que facilitan la identificación (ej. verde para "Completado", rojo para "Urgente").
- **Tipografía y Estética:** Uso de `globals.css` y `page.module.css` con variables CSS para mantener consistencia de colores primarios e interfaz limpia ("Light Mode" prevalente con fondos claros).

## 11. Requisitos de Entorno y Despliegue
- **Lenguaje / Entorno:** Node.js (v20 o superior recomendado dadas las versiones de los tipos de Node).
- **Base de Datos:** PostgreSQL en ejecución, conectada a través de la variable de entorno `DATABASE_URL`.
- **Ejecución y Compilación:**
  - Desarrollo: `npm run dev`
  - Producción: `npm run build` seguido de `npm run start`
- **Configuraciones de Base de Datos:** Requiere la ejecución de las migraciones y la sincronización con el cliente Prisma mediante `npx prisma generate` (ejecutado por defecto en script `postinstall`).
- **Configuración de Variables:** Variables de NextAuth (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`) deben ser configuradas en el entorno local o servidor.
