# Estructura del Proyecto

```
.
├── .env
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── DEPLOY.md
├── MEMORIA_DESCRIPTIVA.md
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── prisma
│   ├── check-db-mode.ts
│   ├── migrations
│   │   ├── 20260710014035_init
│   │   │   └── migration.sql
│   │   ├── 20260710162511_add_google_auth
│   │   │   └── migration.sql
│   │   ├── 20260712155440_add_en_produccion_state
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   ├── seed.ts
│   ├── tsconfig.json
│   └── verify-data.ts
├── README.md
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   ├── logout
│   │   │   │   │   └── route.ts
│   │   │   │   ├── me
│   │   │   │   │   └── route.ts
│   │   │   │   └── [...nextauth]
│   │   │   │       └── route.ts
│   │   │   ├── external
│   │   │   │   └── [token]
│   │   │   │       └── route.ts
│   │   │   ├── inventory
│   │   │   │   ├── authorize
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── login
│   │   │   │   └── route.ts
│   │   │   ├── materia-prima
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]
│   │   │   │       └── route.ts
│   │   │   ├── orders
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]
│   │   │   │       └── route.ts
│   │   │   ├── produccion
│   │   │   │   └── ordenes
│   │   │   │       └── route.ts
│   │   │   ├── reports
│   │   │   │   └── route.ts
│   │   │   ├── stages
│   │   │   │   └── [id]
│   │   │   │       └── route.ts
│   │   │   └── users
│   │   │       ├── route.ts
│   │   │       └── [id]
│   │   │           └── route.ts
│   │   ├── components
│   │   │   ├── CalendarioProduccion.tsx
│   │   │   └── SeguimientoOrdenes.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.module.css
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── lib
│   │   ├── auth.ts
│   │   ├── data-layer.ts
│   │   └── db.ts
│   └── middleware.ts
├── test-db.js
├── test-endpoints.js
└── tsconfig.json
```

## prisma/check-db-mode.ts

```ts
import prisma, { testDbConnection } from '../src/lib/db';
import { checkDbMode, getOrders, getMaterials, getFichasTecnicas, getUsers } from '../src/lib/data-layer';

async function main() {
  console.log('=== Test Db Connection ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const isPgDirect = await testDbConnection();
  console.log('testDbConnection():', isPgDirect);
  
  const isPgFromDataLayer = await checkDbMode();
  console.log('checkDbMode():', isPgFromDataLayer);
  
  console.log('\n=== Postgres Data ===');
  const pgUsers = await prisma.user.findMany();
  console.log('Users:', pgUsers.length, pgUsers.map(u => ({ email: u.email, name: u.name })));
  
  const pgMaterials = await prisma.materiaPrima.findMany();
  console.log('Materials:', pgMaterials.length, pgMaterials.map(m => ({ codigo: m.codigo, nombre: m.nombre })));
  
  const pgProducts = await prisma.productosFichaTecnica.findMany();
  console.log('Productos Ficha Técnica:', pgProducts.length, pgProducts.map(p => ({ codigo: p.codigo, nombre: p.nombre })));
  
  const pgOrders = await prisma.ordenesFabricacion.findMany();
  console.log('Orders:', pgOrders.length, pgOrders.map(o => ({ codigo: o.codigoCorrelativoUnico, cliente: o.clienteNombre })));
  
  console.log('\n=== Data Layer Results ===');
  const dlMaterials = await getMaterials();
  console.log('getMaterials():', dlMaterials.length, dlMaterials.map(m => ({ codigo: m.codigo, nombre: m.nombre })));
  
  const dlProducts = await getFichasTecnicas();
  console.log('getFichasTecnicas():', dlProducts.length, dlProducts.map(p => ({ codigo: p.codigo, nombre: p.nombre })));
  
  const dlOrders = await getOrders();
  console.log('getOrders():', dlOrders.length, dlOrders.map(o => ({ codigo: o.codigoCorrelativoUnico, cliente: o.clienteNombre })));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ERROR:', err);
    process.exit(1);
  });

```

## prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String             @id @default(uuid())
  name              String
  email             String             @unique
  passwordHash      String?
  role              Role
  creadoEn          DateTime           @default(now())
  emailVerified     DateTime?
  image             String?
  accounts          Account[]
  kardexComercial   KardexComercial[]
  kardexMovimientos KardexInventario[]
  autorizaciones    SalidaAutorizada[]
  sessions          Session[]
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model MateriaPrima {
  id                String                  @id @default(uuid())
  codigo            String                  @unique
  nombre            String
  tipo              TipoMateriaPrima
  diametro          String?
  espesor           String?
  stockActual       Float                   @default(0)
  stockMinimo       Float                   @default(0)
  creadoEn          DateTime                @default(now())
  actualizadoEn     DateTime                @updatedAt
  kardexMovimientos KardexInventario[]
  fichasTecnicas    ProductosFichaTecnica[]
}

model ProductosFichaTecnica {
  id             String         @id @default(uuid())
  codigo         String         @unique
  nombre         String
  formulaCalculo String
  materiaPrimaId String
  detallesOrden  DetalleOrden[]
  materiaPrima   MateriaPrima   @relation(fields: [materiaPrimaId], references: [id])
}

model OrdenesFabricacion {
  id                     String            @id @default(uuid())
  codigoCorrelativoUnico Int               @unique @default(autoincrement())
  clienteNombre          String
  tipoCliente            TipoCliente
  estado                 EstadoOrden       @default(PENDIENTE_PAGO)
  fechaComprometida      DateTime
  fechaProduccion        DateTime?
  montoTotal             Float
  montoAbonado           Float
  metodoPago             String
  prioridad              PrioridadOrden    @default(NORMAL)
  esUrgente              Boolean           @default(false)
  cargoUrgencia          Float             @default(0)
  tokenConsulta          String            @unique @default(uuid())
  creadoEn               DateTime          @default(now())
  actualizadoEn          DateTime          @updatedAt
  numeroOrdenCompra      String?
  detalles               DetalleOrden[]
  procesos               ProcesoEtapa[]
  salidaAutorizada       SalidaAutorizada?
}

enum PrioridadOrden {
  NORMAL
  ALTA
  URGENTE
}

model DetalleOrden {
  id                  String                 @id @default(uuid())
  ordenId             String
  productoId          String?
  productoComercialId String?
  largo               Float?
  ancho               Float?
  espesor             Float?
  forma               String?
  descripcionProducto String?
  calidadAcero        String
  colorPintura        String?
  tuercasTipo         String?
  cantidadSolicitada  Int
  orden               OrdenesFabricacion     @relation(fields: [ordenId], references: [id], onDelete: Cascade)
  productoComercial   ProductoComercial?     @relation(fields: [productoComercialId], references: [id])
  producto            ProductosFichaTecnica? @relation(fields: [productoId], references: [id])
}

model ProcesoEtapa {
  id               String             @id @default(uuid())
  ordenId          String
  etapaNombre      String
  ordenSecuencia   Int
  completada       Boolean            @default(false)
  operarioAsignado String?
  fechaCompletada  DateTime?
  orden            OrdenesFabricacion @relation(fields: [ordenId], references: [id], onDelete: Cascade)
}

model KardexInventario {
  id             String         @id @default(uuid())
  materiaPrimaId String
  tipoMovimiento TipoMovimiento
  cantidad       Float
  motivo         String
  usuarioId      String
  creadoEn       DateTime       @default(now())
  materiaPrima   MateriaPrima   @relation(fields: [materiaPrimaId], references: [id])
  usuario        User           @relation(fields: [usuarioId], references: [id])
}

model SalidaAutorizada {
  id           String             @id @default(uuid())
  ordenId      String             @unique
  jefeTallerId String
  autorizadoEn DateTime           @default(now())
  jefeTaller   User               @relation(fields: [jefeTallerId], references: [id])
  orden        OrdenesFabricacion @relation(fields: [ordenId], references: [id], onDelete: Cascade)
}

model ProductoComercial {
  id                String            @id @default(uuid())
  codigo            String            @unique
  nombre            String
  descripcion       String?
  precioVenta       Float?
  stockActual       Float             @default(0)
  stockMinimo       Float             @default(0)
  creadoEn          DateTime          @default(now())
  actualizadoEn     DateTime          @updatedAt
  detallesOrden     DetalleOrden[]
  kardexMovimientos KardexComercial[]
}

model KardexComercial {
  id                  String            @id @default(uuid())
  productoComercialId String
  tipoMovimiento      TipoMovimiento
  cantidad            Float
  motivo              String
  usuarioId           String
  creadoEn            DateTime          @default(now())
  productoComercial   ProductoComercial @relation(fields: [productoComercialId], references: [id])
  usuario             User              @relation(fields: [usuarioId], references: [id])
}

enum Role {
  ADMIN
  VENDEDOR
  JEFE_TALLER
  ALMACENERO
}

enum TipoMovimiento {
  INGRESO
  EGRESO
}

enum TipoCliente {
  TIENDA
  EMPRESA
}

enum EstadoOrden {
  PENDIENTE_PAGO
  APROBADA
  EN_PRODUCCION
  TERMINADA
  ENTREGADA
  CANCELADA
}

enum TipoMateriaPrima {
  VARILLA
  PLATINA
  MUELLE
  TUERCA
  ARANDELA
}

```

## prisma/seed.ts

```ts
import { PrismaClient, Role, TipoMateriaPrima, TipoCliente, EstadoOrden } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Seed Users with hashed passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const vendedorPassword = await bcrypt.hash('vendedor123', salt);
  const jefePassword = await bcrypt.hash('jefe123', salt);
  const almaceneroPassword = await bcrypt.hash('almacenero123', salt);

  const users = [
    {
      name: 'Carlos Admin',
      email: 'admin@metal.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
    {
      name: 'Laura Vendedora',
      email: 'vendedor@metal.com',
      passwordHash: vendedorPassword,
      role: Role.VENDEDOR,
    },
    {
      name: 'Manuel Jefe Taller',
      email: 'jefe@metal.com',
      passwordHash: jefePassword,
      role: Role.JEFE_TALLER,
    },
    {
      name: 'Juan Almacenero',
      email: 'almacenero@metal.com',
      passwordHash: almaceneroPassword,
      role: Role.ALMACENERO,
    },
    {
      name: 'Stiven Lopez',
      email: 'tt9704925@gmail.com',
      passwordHash: await bcrypt.hash('Stiven69Pass', salt),
      role: Role.ADMIN,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }
  console.log('Seeded Users.');

  // 2. Seed Materia Prima (Production Raw Materials & Commercial stock)
  // Let's create raw materials
  const rawMaterialsData = [
    {
      codigo: 'MP-VAR-12',
      nombre: 'Varilla Redondo Liso 1/2"',
      tipo: TipoMateriaPrima.VARILLA,
      diametro: '1/2',
      stockActual: 150.0,
      stockMinimo: 30.0,
    },
    {
      codigo: 'MP-VAR-58',
      nombre: 'Varilla Redondo Liso 5/8"',
      tipo: TipoMateriaPrima.VARILLA,
      diametro: '5/8',
      stockActual: 120.0,
      stockMinimo: 25.0,
    },
    {
      codigo: 'MP-VAR-34',
      nombre: 'Varilla Redondo Liso 3/4"',
      tipo: TipoMateriaPrima.VARILLA,
      diametro: '3/4',
      stockActual: 80.0,
      stockMinimo: 20.0,
    },
    {
      codigo: 'MP-VAR-78',
      nombre: 'Varilla Redondo Liso 7/8"',
      tipo: TipoMateriaPrima.VARILLA,
      diametro: '7/8',
      stockActual: 60.0,
      stockMinimo: 15.0,
    },
    {
      codigo: 'MP-VAR-100',
      nombre: 'Varilla Redondo Liso 1"',
      tipo: TipoMateriaPrima.VARILLA,
      diametro: '1',
      stockActual: 45.0,
      stockMinimo: 12.0,
    },
    {
      codigo: 'MP-PLA-38',
      nombre: 'Platina de 3/8" espesor',
      tipo: TipoMateriaPrima.PLATINA,
      espesor: '3/8',
      stockActual: 100.0,
      stockMinimo: 20.0,
    },
    {
      codigo: 'MP-MUL-HP',
      nombre: 'Hojas de Muelle Premium',
      tipo: TipoMateriaPrima.MUELLE,
      stockActual: 50.0,
      stockMinimo: 10.0,
    },
    {
      codigo: 'MP-TUE-SP',
      nombre: 'Tuerca Especial Alta Presión',
      tipo: TipoMateriaPrima.TUERCA,
      stockActual: 800.0,
      stockMinimo: 150.0,
    },
    {
      codigo: 'MP-ARA-SP',
      nombre: 'Arandela de Presión Industrial',
      tipo: TipoMateriaPrima.ARANDELA,
      stockActual: 1000.0,
      stockMinimo: 200.0,
    },
  ];

  const materials: Record<string, any> = {};
  for (const rm of rawMaterialsData) {
    const created = await prisma.materiaPrima.upsert({
      where: { codigo: rm.codigo },
      update: {},
      create: rm,
    });
    materials[rm.codigo] = created;
  }
  console.log('Seeded Materia Prima (Production & Commercial Insumos).');

  // 3. Seed Productos Ficha Técnica (Formulas)
  const productsData = [
    {
      codigo: 'PROD-UBOLT-58',
      nombre: 'Perno en U (U-Bolt) 5/8"',
      formulaCalculo: JSON.stringify({
        formula: '(largo * 2 + ancho + 0.1) * cantidad',
        desc: 'Calcula el largo de varilla de 5/8" requerido en metros: (Largo*2 + Ancho + 0.1m de doblez/rosca) * Cantidad',
        unit: 'metros',
      }),
      materiaPrimaId: materials['MP-VAR-58'].id,
    },
    {
      codigo: 'PROD-ABRA-38',
      nombre: 'Abrazadera Metalica Platina 3/8"',
      formulaCalculo: JSON.stringify({
        formula: '(largo + ancho * 2) * cantidad',
        desc: 'Calcula platina requerida en metros: (Largo + Ancho*2) * Cantidad',
        unit: 'metros',
      }),
      materiaPrimaId: materials['MP-PLA-38'].id,
    },
    {
      codigo: 'PROD-MUELLE-ESP',
      nombre: 'Piso de Muelle Reforzado',
      formulaCalculo: JSON.stringify({
        formula: 'largo * cantidad',
        desc: 'Calcula cantidad de hojas de muelle en metros: Largo * Cantidad',
        unit: 'metros',
      }),
      materiaPrimaId: materials['MP-MUL-HP'].id,
    },
  ];

  for (const p of productsData) {
    await prisma.productosFichaTecnica.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    });
  }
  console.log('Seeded Productos Ficha Técnica.');

  // Get users for seed references
  const vendedorUser = await prisma.user.findFirst({ where: { role: Role.VENDEDOR } });
  const jefeUser = await prisma.user.findFirst({ where: { role: Role.JEFE_TALLER } });

  // 4. Seed initial Order (Ordenes de Fabricación)
  const order1 = await prisma.ordenesFabricacion.upsert({
    where: { codigoCorrelativoUnico: 1 },
    update: {},
    create: {
      clienteNombre: 'Aceros Industriales S.A.',
      tipoCliente: TipoCliente.EMPRESA,
      estado: EstadoOrden.PENDIENTE_PAGO,
      fechaComprometida: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      montoTotal: 1500.0,
      montoAbonado: 750.0,
      metodoPago: 'TRANSFERENCIA_BANCARIA',
      esUrgente: false,
      cargoUrgencia: 0.0,
      detalles: {
        create: {
          productoId: (await prisma.productosFichaTecnica.findFirst({ where: { codigo: 'PROD-UBOLT-58' } }))!.id,
          largo: 0.4, // 40 cm
          ancho: 0.2, // 20 cm
          espesor: 0.015, // 15mm
          forma: 'U-Form',
          calidadAcero: 'A36',
          colorPintura: 'Negro Epóxico',
          tuercasTipo: 'Tuerca 5/8" Alta Presión',
          cantidadSolicitada: 50,
        },
      },
    },
  });

  const order2 = await prisma.ordenesFabricacion.upsert({
    where: { codigoCorrelativoUnico: 2 },
    update: {},
    create: {
      clienteNombre: 'Consorcio Damper',
      tipoCliente: TipoCliente.EMPRESA,
      estado: EstadoOrden.APROBADA, // Auto-approved because Damper is a large company
      fechaComprometida: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      montoTotal: 2500.0,
      montoAbonado: 2500.0,
      metodoPago: 'TRANSFERENCIA_BANCARIA',
      esUrgente: true,
      cargoUrgencia: 400.0, // Extra charge for overtime
      detalles: {
        create: {
          productoId: (await prisma.productosFichaTecnica.findFirst({ where: { codigo: 'PROD-ABRA-38' } }))!.id,
          largo: 0.6,
          ancho: 0.3,
          espesor: 0.009, // 3/8" = ~9.5mm
          forma: 'Rectangular Curvo',
          calidadAcero: '1045',
          colorPintura: 'Gris Zinc',
          cantidadSolicitada: 30,
        },
      },
      procesos: {
        createMany: {
          data: [
            { etapaNombre: 'Corte', ordenSecuencia: 1, completada: true, operarioAsignado: 'Roberto L.', fechaCompletada: new Date() },
            { etapaNombre: 'Roscado', ordenSecuencia: 2, completada: false, operarioAsignado: 'Luis M.' },
            { etapaNombre: 'Doblado', ordenSecuencia: 3, completada: false },
            { etapaNombre: 'Pintura', ordenSecuencia: 4, completada: false },
          ],
        },
      },
    },
  });

  console.log('Seeded Initial Orders.');
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

```

## prisma/verify-data.ts

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Verifying database data ===\n');

  // Users
  const users = await prisma.user.findMany();
  console.log(`✅ Users: ${users.length}`);
  users.forEach(u => console.log(`   - ${u.name} (${u.email}) - ${u.role}`));

  // Materia Prima
  const materiasPrima = await prisma.materiaPrima.findMany();
  console.log(`\n✅ Materia Prima: ${materiasPrima.length}`);
  materiasPrima.forEach(mp => console.log(`   - ${mp.codigo} - ${mp.nombre} (${mp.tipo}) - Stock: ${mp.stockActual}`));

  // Productos Ficha Técnica
  const productos = await prisma.productosFichaTecnica.findMany({ include: { materiaPrima: true } });
  console.log(`\n✅ Productos Ficha Técnica: ${productos.length}`);
  productos.forEach(p => console.log(`   - ${p.codigo} - ${p.nombre} (Materia Prima: ${p.materiaPrima.nombre})`));

  // Ordenes de Fabricación
  const ordenes = await prisma.ordenesFabricacion.findMany({ include: { detalles: true, procesos: true } });
  console.log(`\n✅ Ordenes de Fabricación: ${ordenes.length}`);
  ordenes.forEach(o => console.log(`   - #${o.codigoCorrelativoUnico} - ${o.clienteNombre} - ${o.estado} - Detalles: ${o.detalles.length} - Procesos: ${o.procesos.length}`));

  console.log('\n=== Verification complete ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## src/lib/db.ts

```ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

/**
 * Checks if we can connect to the database.
 * Returns false if the connection fails, indicating we should use mock fallback.
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost:5432/metal_db')) {
      // If using default localhost, check connection with short timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      
      // We will perform a simple raw query to check connection
      await prisma.$executeRaw`SELECT 1`;
      clearTimeout(timeout);
      return true;
    }
    await prisma.$executeRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.warn('PostgreSQL Database connection failed. Falling back to File-based DB mock.');
    return false;
  }
}

```

## src/app/api/auth/[...nextauth]/route.ts

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/db";
import type { Provider } from "next-auth/providers";
import type { Role } from "@prisma/client";

const providers: Provider[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    allowDangerousEmailAccountLinking: true,
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Get user role from db
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role || "VENDEDOR"; // Default to VENDEDOR if not set
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as Role;
      }
      return session;
    },
    async signIn({ user }) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email as string },
      });
      
      if (!existingUser) {
        return "/?authError=not-registered";
      }
      return true;
    },
  },
});

export const { GET, POST } = handlers;

```

## src/app/api/auth/logout/route.ts

```ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  response.cookies.delete('auth_token');
  return response;
}

```

## src/app/api/auth/me/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  return NextResponse.json(payload, { status: 200 });
}

```

## src/app/api/login/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/data-layer';
import * as bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }

    // Generate JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    // Return user info (without hash) and set cookie
    const { passwordHash, ...userInfo } = user;
    const response = NextResponse.json(userInfo, { status: 200 });
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

```

## src/lib/auth.ts

```ts
import { Role } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

const textEncoder = new TextEncoder();

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const keyData = textEncoder.encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64urlEncode(str: string): string {
  const bytes = textEncoder.encode(str);
  let binString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binString = atob(str);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';

export async function signToken(payload: JWTPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64urlEncode(JSON.stringify(header));
  const payloadStr = base64urlEncode(JSON.stringify({ 
    ...payload, 
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days expiration
  }));
  const partialToken = `${headerStr}.${payloadStr}`;
  
  const key = await getCryptoKey(JWT_SECRET);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(partialToken));
  
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binString = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binString += String.fromCharCode(signatureBytes[i]);
  }
  const signature = btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    
  return `${partialToken}.${signature}`;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerStr, payloadStr, signatureStr] = parts;
    const partialToken = `${headerStr}.${payloadStr}`;
    
    const key = await getCryptoKey(JWT_SECRET);
    
    const sigStrClean = signatureStr.replace(/-/g, '+').replace(/_/g, '/');
    const sigBinString = atob(sigStrClean);
    const sigBytes = new Uint8Array(sigBinString.length);
    for (let i = 0; i < sigBinString.length; i++) {
      sigBytes[i] = sigBinString.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, textEncoder.encode(partialToken));
    if (!isValid) return null;
    
    const payload = JSON.parse(base64urlDecode(payloadStr)) as JWTPayload & { exp: number };
    
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (err: any) {
    console.error('Token verification failed:', err.message);
    return null;
  }
}

```

## src/middleware.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from './lib/auth';
import { Role } from '@prisma/client';

// Define route permissions
const routePermissions: Record<string, Role[]> = {
  '/api/orders': [Role.ADMIN, Role.VENDEDOR, Role.JEFE_TALLER, Role.ALMACENERO],
  '/api/inventory': [Role.ADMIN, Role.ALMACENERO, Role.JEFE_TALLER, Role.VENDEDOR],
  '/api/inventory/authorize': [Role.ADMIN, Role.JEFE_TALLER],
  '/api/materia-prima': [Role.ADMIN, Role.ALMACENERO, Role.JEFE_TALLER],
  '/api/stages': [Role.ADMIN, Role.JEFE_TALLER],
  '/api/reports': [Role.ADMIN],
};

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow public routes: login, logout, me, external
  if (
    path.startsWith('/api/login') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/external') ||
    path === '/'
  ) {
    return NextResponse.next();
  }

  // Check token
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload: JWTPayload | null = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Check permissions for protected routes
  for (const [routePath, allowedRoles] of Object.entries(routePermissions)) {
    if (path.startsWith(routePath)) {
      if (!allowedRoles.includes(payload.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      break;
    }
  }

  // Add user info to headers for use in route handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-name', payload.name);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};

```

## src/app/api/external/[token]/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrderByToken } from '@/lib/data-layer';

// GET: Query order status externally using a secure unique token (no auth required)
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const order = await getOrderByToken(token);
    
    if (!order) {
      return NextResponse.json({ error: 'Enlace no válido o expirado.' }, { status: 404 });
    }

    // Return limited information for security/privacy if desired,
    // but here we return standard details of fabrication progress.
    return NextResponse.json({
      clienteNombre: order.clienteNombre,
      codigoCorrelativoUnico: order.codigoCorrelativoUnico,
      estado: order.estado,
      fechaComprometida: order.fechaComprometida,
      creadoEn: order.creadoEn,
      detalles: order.detalles.map((d: any) => ({
        productoNombre: d.producto.nombre,
        forma: d.forma,
        espesor: d.espesor,
        largo: d.largo,
        ancho: d.ancho,
        cantidadSolicitada: d.cantidadSolicitada,
      })),
      procesos: order.procesos.map((p: any) => ({
        etapaNombre: p.etapaNombre,
        completada: p.completada,
        fechaCompletada: p.fechaCompletada,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

```

## src/app/api/orders/[id]/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, modifyOrder, updateOrderStatus, getUserByEmail, addOrderAbono } from '@/lib/data-layer';
import { Role, EstadoOrden } from '@prisma/client';

async function checkAuth(req: NextRequest, allowedRoles: Role[]): Promise<{ authorized: boolean; user?: any; errorResponse?: NextResponse }> {
  const roleHeader = req.headers.get('x-user-role');
  const emailHeader = req.headers.get('x-user-email');

  if (!roleHeader || !emailHeader) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'Falta información de autenticación.' }, { status: 401 }),
    };
  }

  const user = await getUserByEmail(emailHeader);
  if (!user || user.role !== roleHeader || !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'No autorizado para realizar esta acción.' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

// GET: Retrieve a single order details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Modify details of an order (RF-03: Vendedor or Jefe de Taller)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await checkAuth(req, [Role.ADMIN, Role.VENDEDOR, Role.JEFE_TALLER]);
    if (!authResult.authorized) return authResult.errorResponse!;

    const body = await req.json();
    const { fechaComprometida, fechaProduccion, prioridad, colorPintura, tuercasTipo, clienteNombre } = body;

    const updated = await modifyOrder(id, {
      fechaComprometida,
      fechaProduccion,
      prioridad,
      colorPintura,
      tuercasTipo,
      clienteNombre,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// PATCH: Change order status (RF-04: Cancellation policy, RF-05: Status Enum transitions)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { estado, abonoAdicional } = body;

    if (abonoAdicional !== undefined) {
      const authResult = await checkAuth(req, [Role.ADMIN, Role.VENDEDOR]);
      if (!authResult.authorized) return authResult.errorResponse!;

      const updated = await addOrderAbono(id, Number(abonoAdicional));
      return NextResponse.json(updated);
    }

    if (!estado) {
      return NextResponse.json({ error: 'Falta especificar el estado.' }, { status: 400 });
    }

    // Role authentication for transitions:
    // CANCELADA/ENTREGADA -> Vendedor or Admin
    // APROBADA/TERMINADA -> Jefe de Taller, Vendedor or Admin
    const targetStatus = estado as EstadoOrden;
    let allowedRoles: Role[] = [Role.ADMIN];
    
    if (targetStatus === EstadoOrden.CANCELADA || targetStatus === EstadoOrden.ENTREGADA) {
      allowedRoles = [Role.ADMIN, Role.VENDEDOR];
    } else {
      allowedRoles = [Role.ADMIN, Role.VENDEDOR, Role.JEFE_TALLER];
    }

    const authResult = await checkAuth(req, allowedRoles);
    if (!authResult.authorized) return authResult.errorResponse!;

    const updated = await updateOrderStatus(id, targetStatus);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

```

## src/app/api/orders/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder, getUserByEmail } from '@/lib/data-layer';
import { Role } from '@prisma/client';

// Helper to check user permission
async function checkAuth(req: NextRequest, allowedRoles: Role[]): Promise<{ authorized: boolean; user?: any; errorResponse?: NextResponse }> {
  const roleHeader = req.headers.get('x-user-role');
  const emailHeader = req.headers.get('x-user-email');

  if (!roleHeader || !emailHeader) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'Falta información de autenticación.' }, { status: 401 }),
    };
  }

  const user = await getUserByEmail(emailHeader);
  if (!user || user.role !== roleHeader || !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'No autorizado para realizar esta acción.' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

// GET: Retrieve list of orders with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Any authenticated user can view orders
    const roleHeader = req.headers.get('x-user-role');
    if (!roleHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orders = await getOrders({ status, startDate, endDate });
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a manufacturing order
export async function POST(req: NextRequest) {
  try {
    // RF-01: Vendedor creates orders
    const authResult = await checkAuth(req, [Role.ADMIN, Role.VENDEDOR]);
    if (!authResult.authorized) return authResult.errorResponse!;

    const body = await req.json();
    const { clienteNombre, tipoCliente, fechaComprometida, fechaProduccion, montoTotal, montoAbonado, metodoPago, esUrgente, prioridad, detalles, numeroOrdenCompra } = body;

    // Validation
    if (!clienteNombre || !tipoCliente || !fechaComprometida || montoTotal === undefined || montoAbonado === undefined || !metodoPago || !detalles || detalles.length === 0) {
      return NextResponse.json({ error: 'Todos los campos requeridos deben ser completados.' }, { status: 400 });
    }

    const order = await createOrder({
      clienteNombre,
      tipoCliente,
      fechaComprometida,
      fechaProduccion,
      montoTotal: Number(montoTotal),
      montoAbonado: Number(montoAbonado),
      metodoPago,
      esUrgente: !!esUrgente,
      prioridad,
      numeroOrdenCompra,
      detalles: detalles.map((d: any) => ({
        productoId: d.productoId,
        largo: d.largo !== undefined && d.largo !== null ? Number(d.largo) : undefined,
        ancho: d.ancho !== undefined && d.ancho !== null ? Number(d.ancho) : undefined,
        espesor: d.espesor !== undefined && d.espesor !== null ? Number(d.espesor) : undefined,
        forma: d.forma,
        descripcionProducto: d.descripcionProducto,
        calidadAcero: d.calidadAcero,
        colorPintura: d.colorPintura,
        tuercasTipo: d.tuercasTipo,
        cantidadSolicitada: Number(d.cantidadSolicitada),
      })),
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

```

## src/app/api/produccion/ordenes/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const cliente = searchParams.get('cliente');
    const codigo = searchParams.get('codigo');
    const soloAtrasadas = searchParams.get('soloAtrasadas') === 'true';
    const soloEnProduccion = searchParams.get('soloEnProduccion') === 'true';
    const soloUrgentes = searchParams.get('soloUrgentes') === 'true';
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (prioridad) {
      where.prioridad = prioridad;
    }

    if (cliente) {
      where.clienteNombre = {
        contains: cliente,
        mode: 'insensitive'
      };
    }

    if (codigo) {
      where.codigoCorrelativoUnico = parseInt(codigo);
    }

    if (soloUrgentes) {
      where.prioridad = 'URGENTE';
    }

    if (soloEnProduccion) {
      where.estado = 'EN_PRODUCCION';
    }

    if (fechaInicio || fechaFin) {
      where.fechaComprometida = {};
      if (fechaInicio) {
        where.fechaComprometida.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.fechaComprometida.lte = new Date(fechaFin);
      }
    }

    const ordenes = await prisma.ordenesFabricacion.findMany({
      where,
      include: {
        detalles: {
          include: {
            producto: true,
            productoComercial: true
          }
        },
        procesos: {
          orderBy: {
            ordenSecuencia: 'asc'
          }
        }
      },
      orderBy: {
        fechaComprometida: 'asc'
      }
    });

    // Calcular días restantes o de retraso para cada orden
    const ordenesConCalculos = ordenes.map(orden => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaComprometida = new Date(orden.fechaComprometida);
      fechaComprometida.setHours(0, 0, 0, 0);
      
      const diferenciaDias = Math.floor((fechaComprometida.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...orden,
        diasRestantes: diferenciaDias >= 0 ? diferenciaDias : 0,
        diasRetraso: diferenciaDias < 0 ? Math.abs(diferenciaDias) : 0,
        estaAtrasada: diferenciaDias < 0 && orden.estado !== 'ENTREGADA' && orden.estado !== 'CANCELADA'
      };
    });

    // Filtrar órdenes atrasadas si se solicita
    const resultadoFinal = soloAtrasadas 
      ? ordenesConCalculos.filter(o => o.estaAtrasada)
      : ordenesConCalculos;

    return NextResponse.json(resultadoFinal);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes de fabricación' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, estado, fechaProduccion, prioridad } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de orden es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (estado) updateData.estado = estado;
    if (fechaProduccion) updateData.fechaProduccion = new Date(fechaProduccion);
    if (prioridad) updateData.prioridad = prioridad;

    const ordenActualizada = await prisma.ordenesFabricacion.update({
      where: { id },
      data: updateData,
      include: {
        detalles: {
          include: {
            producto: true,
            productoComercial: true
          }
        },
        procesos: true
      }
    });

    return NextResponse.json(ordenActualizada);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de fabricación' },
      { status: 500 }
    );
  }
}

```

## src/app/api/stages/[id]/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { updateProcessStage, getUserByEmail } from '@/lib/data-layer';
import { Role } from '@prisma/client';

async function checkAuth(req: NextRequest, allowedRoles: Role[]): Promise<{ authorized: boolean; user?: any; errorResponse?: NextResponse }> {
  const roleHeader = req.headers.get('x-user-role');
  const emailHeader = req.headers.get('x-user-email');

  if (!roleHeader || !emailHeader) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'Falta información de autenticación.' }, { status: 401 }),
    };
  }

  const user = await getUserByEmail(emailHeader);
  if (!user || user.role !== roleHeader || !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'No autorizado para realizar esta acción.' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

// PATCH: Update specific production stage completion and operario assignment
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await checkAuth(req, [Role.ADMIN, Role.JEFE_TALLER]);
    if (!authResult.authorized) return authResult.errorResponse!;

    const body = await req.json();
    const { completada, operarioAsignado } = body;

    if (completada === undefined) {
      return NextResponse.json({ error: 'Se requiere el estado de completado.' }, { status: 400 });
    }

    const updated = await updateProcessStage(id, !!completada, operarioAsignado);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

```

## src/app/components/CalendarioProduccion.tsx

```ts
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

interface OrdenProduccion {
  id: string;
  codigoCorrelativoUnico: number;
  clienteNombre: string;
  estado: string;
  fechaComprometida: string;
  fechaProduccion: string | null;
  prioridad: string;
  creadoEn: string;
  detalles: any[];
  estaAtrasada: boolean;
  diasRestantes: number;
  diasRetraso: number;
}

export default function CalendarioProduccion() {
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'mes' | 'semana'>('mes');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenProduccion | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarOrdenes();
  }, [fechaActual, vista]);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const inicioPeriodo = getInicioPeriodo();
      const finPeriodo = getFinPeriodo();
      
      const res = await fetch(`/api/produccion/ordenes?fechaInicio=${inicioPeriodo.toISOString()}&fechaFin=${finPeriodo.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrdenes(data);
      }
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInicioPeriodo = () => {
    if (vista === 'mes') {
      return new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    } else {
      const day = fechaActual.getDay();
      const diff = fechaActual.getDate() - day;
      return new Date(fechaActual.setDate(diff));
    }
  };

  const getFinPeriodo = () => {
    if (vista === 'mes') {
      return new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    } else {
      const inicio = getInicioPeriodo();
      return new Date(inicio.setDate(inicio.getDate() + 6));
    }
  };

  const navegar = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaActual);
    if (vista === 'mes') {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + (direccion === 'siguiente' ? 1 : -1));
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + (direccion === 'siguiente' ? 7 : -7));
    }
    setFechaActual(nuevaFecha);
  };

  const obtenerOrdenesDelDia = (fecha: Date) => {
    return ordenes.filter(orden => {
      const fechaOrden = new Date(orden.fechaComprometida);
      return fechaOrden.toDateString() === fecha.toDateString();
    });
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'ALTA':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const getPrioridadBackgroundColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'rgba(239, 68, 68, 0.15)';
      case 'ALTA':
        return 'rgba(245, 158, 11, 0.15)';
      default:
        return 'rgba(99, 102, 241, 0.15)';
    }
  };

  const getPrioridadTextColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return '#dc2626';
      case 'ALTA':
        return '#d97706';
      default:
        return '#4f46e5';
    }
  };

  const getPrioridadBorderColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return '#dc2626';
      case 'ALTA':
        return '#d97706';
      default:
        return '#4f46e5';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'bg-gray-100 text-gray-800';
      case 'APROBADA':
        return 'bg-green-100 text-green-800';
      case 'EN_PRODUCCION':
        return 'bg-yellow-100 text-yellow-800';
      case 'TERMINADA':
        return 'bg-blue-100 text-blue-800';
      case 'ENTREGADA':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'Pedido Aceptado';
      case 'APROBADA':
        return 'Aprobada';
      case 'EN_PRODUCCION':
        return 'En Producción';
      case 'TERMINADA':
        return 'Terminado';
      case 'ENTREGADA':
        return 'Entregado';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const abrirModalOrden = (orden: OrdenProduccion) => {
    setOrdenSeleccionada(orden);
    setNuevoEstado(orden.estado);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setOrdenSeleccionada(null);
    setNuevoEstado('');
  };

  const cambiarEstado = async () => {
    if (!ordenSeleccionada || !nuevoEstado) return;

    try {
      setActualizando(true);
      const res = await fetch(`/api/produccion/ordenes/${ordenSeleccionada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        await cargarOrdenes();
        cerrarModal();
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la orden');
    } finally {
      setActualizando(false);
    }
  };

  const renderVistaMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasMes = [];
    
    const diaInicio = primerDia.getDay();
    for (let i = 0; i < diaInicio; i++) {
      diasMes.push(null);
    }
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      diasMes.push(new Date(año, mes, dia));
    }

    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return (
      <div className="space-y-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
            {nombreMes}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navegar('anterior')}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronLeft size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            <button
              onClick={() => setFechaActual(new Date())}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              Hoy
            </button>
            <button
              onClick={() => navegar('siguiente')}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronRight size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {nombresDias.map(dia => (
            <div key={dia} style={{ 
              background: 'white', 
              padding: '0.75rem 0.5rem', 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {dia}
            </div>
          ))}
          {diasMes.map((fecha, index) => {
            const esHoy = fecha && fecha.toDateString() === hoy.toDateString();
            const ordenesDelDia = fecha ? obtenerOrdenesDelDia(fecha) : [];
            
            return (
              <div
                key={index}
                style={{
                  minHeight: '120px',
                  padding: '0.5rem',
                  background: fecha ? 'white' : 'rgba(241, 245, 249, 0.5)',
                  cursor: fecha ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  if (fecha) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                }}
                onMouseOut={(e) => {
                  if (fecha) e.currentTarget.style.background = 'white';
                }}
              >
                {fecha && (
                  <>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: esHoy ? 700 : 500,
                      color: esHoy ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      marginBottom: '0.5rem',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: esHoy ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                    }}>
                      {fecha.getDate()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {ordenesDelDia.slice(0, 3).map(orden => (
                        <div
                          key={orden.id}
                          onClick={() => abrirModalOrden(orden)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: getPrioridadBackgroundColor(orden.prioridad),
                            color: getPrioridadTextColor(orden.prioridad),
                            borderLeft: `3px solid ${getPrioridadBorderColor(orden.prioridad)}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={`${orden.codigoCorrelativoUnico} - ${orden.clienteNombre}`}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>#{orden.codigoCorrelativoUnico}</span>
                          <span style={{ marginLeft: '4px' }}>{orden.clienteNombre.slice(0, 8)}{orden.clienteNombre.length > 8 ? '...' : ''}</span>
                        </div>
                      ))}
                      {ordenesDelDia.length > 3 && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: 'var(--color-text-muted)',
                          padding: '2px 6px',
                          fontStyle: 'italic'
                        }}>
                          +{ordenesDelDia.length - 3} más
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVistaSemana = () => {
    const inicioSemana = getInicioPeriodo();
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dias = [];
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(dia.getDate() + i);
      dias.push(dia);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return (
      <div className="space-y-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Semana del {inicioSemana.toLocaleDateString('es-ES')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navegar('anterior')}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronLeft size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
            <button
              onClick={() => setFechaActual(new Date())}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              Hoy
            </button>
            <button
              onClick={() => navegar('siguiente')}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronRight size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {dias.map((fecha, index) => {
            const esHoy = fecha.toDateString() === hoy.toDateString();
            const ordenesDelDia = obtenerOrdenesDelDia(fecha);
            
            return (
              <div
                key={index}
                style={{
                  minHeight: '200px',
                  padding: '0.75rem',
                  background: 'white',
                  transition: 'background 0.15s',
                  ...(esHoy ? { boxShadow: 'inset 0 0 0 2px var(--color-primary)' } : {})
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {nombresDias[index]}
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: esHoy ? 700 : 600,
                    color: esHoy ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    marginTop: '0.25rem'
                  }}>
                    {fecha.getDate()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ordenesDelDia.map(orden => (
                    <div
                      key={orden.id}
                      onClick={() => abrirModalOrden(orden)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: getPrioridadBackgroundColor(orden.prioridad),
                        color: getPrioridadTextColor(orden.prioridad),
                        borderLeft: `4px solid ${getPrioridadBorderColor(orden.prioridad)}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        ...(orden.estaAtrasada ? { boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.3)' } : {})
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = orden.estaAtrasada ? '0 0 0 2px rgba(239, 68, 68, 0.3)' : 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>#{orden.codigoCorrelativoUnico}</span>
                        {orden.estaAtrasada && (
                          <AlertTriangle size={12} strokeWidth={2} style={{ color: getPrioridadTextColor(orden.prioridad) }} />
                        )}
                      </div>
                      <div style={{ fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {orden.clienteNombre}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        display: 'inline-block',
                        fontWeight: 600
                      }}>
                        {getEstadoLabel(orden.estado)}
                      </div>
                      {orden.estaAtrasada && (
                        <div style={{ fontSize: '0.65rem', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <AlertTriangle size={10} strokeWidth={2} />
                          <span>{orden.diasRetraso}d retraso</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {ordenesDelDia.length === 0 && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      textAlign: 'center',
                      padding: '1rem',
                      fontStyle: 'italic'
                    }}>
                      Sin órdenes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Controles de Vista */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <div className="roleSelectorBar">
          <button
            onClick={() => setVista('mes')}
            className={`roleBtn ${vista === 'mes' ? 'roleBtnActive' : ''}`}
          >
            Vista Mensual
          </button>
          <button
            onClick={() => setVista('semana')}
            className={`roleBtn ${vista === 'semana' ? 'roleBtnActive' : ''}`}
          >
            Vista Semanal
          </button>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Carga del taller: <strong>{ordenes.length}</strong> órdenes
        </div>
      </div>

      {/* Espacio entre controles y calendario */}
      <div style={{ height: '1.5rem' }}></div>

      {/* Calendario */}
      {loading ? (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '24rem' }}>
          <div style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
        </div>
      ) : (
        <div className="card">
          {vista === 'mes' ? renderVistaMes() : renderVistaSemana()}
        </div>
      )}

      {/* Espacio entre calendario y leyenda */}
      <div style={{ height: '1.5rem' }}></div>

      {/* Leyenda */}
      <div className="card" style={{ padding: '1rem' }}>
        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Leyenda de Prioridades</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'rgba(99, 102, 241, 0.15)', borderLeft: '2px solid var(--color-primary)', borderRadius: '4px', marginRight: '0.5rem' }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Normal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'rgba(245, 158, 11, 0.15)', borderLeft: '2px solid var(--color-warning)', borderRadius: '4px', marginRight: '0.5rem' }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Alta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'rgba(239, 68, 68, 0.15)', borderLeft: '2px solid var(--color-danger)', borderRadius: '4px', marginRight: '0.5rem' }}></div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Urgente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1rem' }}>
            <AlertTriangle size={16} strokeWidth={2} style={{ color: 'var(--color-danger)', marginRight: '0.5rem' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Atrasado</span>
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Orden */}
      {mostrarModal && ordenSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '32rem', width: '100%', margin: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Orden #{ordenSeleccionada.codigoCorrelativoUnico}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {ordenSeleccionada.clienteNombre}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Estado Actual:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{getEstadoLabel(ordenSeleccionada.estado)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Prioridad:</span>
                <span style={{ fontWeight: 600, color: ordenSeleccionada.prioridad === 'URGENTE' ? 'var(--color-danger)' : ordenSeleccionada.prioridad === 'ALTA' ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                  {ordenSeleccionada.prioridad}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Fecha Entrega:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {new Date(ordenSeleccionada.fechaComprometida).toLocaleDateString('es-ES')}
                </span>
              </div>
              {ordenSeleccionada.estaAtrasada && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-danger)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>⚠️ Atrasada:</span>
                  <span style={{ fontWeight: 600 }}>{ordenSeleccionada.diasRetraso} días</span>
                </div>
              )}
              {!ordenSeleccionada.estaAtrasada && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>⏱️ Restante:</span>
                  <span style={{ fontWeight: 600 }}>{ordenSeleccionada.diasRestantes} días</span>
                </div>
              )}
              {ordenSeleccionada.detalles && ordenSeleccionada.detalles.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Producto:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {ordenSeleccionada.detalles[0].producto?.nombre || 'No especificado'}
                  </span>
                </div>
              )}
            </div>

            <div className="formGroup">
              <label>Cambiar Estado</label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
              >
                <option value="PENDIENTE_PAGO">Pedido Aceptado</option>
                <option value="APROBADA">Aprobada</option>
                <option value="EN_PRODUCCION">En Producción</option>
                <option value="TERMINADA">Terminado</option>
                <option value="ENTREGADA">Entregado</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={cerrarModal}
                className="btn btnSecondary"
                disabled={actualizando}
              >
                Cancelar
              </button>
              <button
                onClick={cambiarEstado}
                className="btn btnPrimary"
                disabled={actualizando || nuevoEstado === ordenSeleccionada.estado}
              >
                {actualizando ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

## src/app/components/SeguimientoOrdenes.tsx

```ts
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, AlertTriangle, Clock, CheckCircle, ArrowUpDown, ChevronDown, AlertCircle } from 'lucide-react';

interface OrdenProduccion {
  id: string;
  codigoCorrelativoUnico: number;
  clienteNombre: string;
  estado: string;
  fechaComprometida: string;
  fechaProduccion: string | null;
  prioridad: string;
  creadoEn: string;
  detalles: any[];
  estaAtrasada: boolean;
  diasRestantes: number;
  diasRetraso: number;
}

export default function SeguimientoOrdenes() {
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [filtros, setFiltros] = useState({
    codigo: '',
    cliente: '',
    estado: '',
    prioridad: '',
    soloAtrasadas: false,
    soloEnProduccion: false,
    soloUrgentes: false,
    fechaInicio: '',
    fechaFin: ''
  });

  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenProduccion | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarOrdenes();
  }, [filtros]);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filtros.codigo) params.append('codigo', filtros.codigo);
      if (filtros.cliente) params.append('cliente', filtros.cliente);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
      if (filtros.soloAtrasadas) params.append('soloAtrasadas', 'true');
      if (filtros.soloEnProduccion) params.append('soloEnProduccion', 'true');
      if (filtros.soloUrgentes) params.append('soloUrgentes', 'true');
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);

      const res = await fetch(`/api/produccion/ordenes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrdenes(data);
      }
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (campo: string) => {
    if (sortBy === campo) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(campo);
      setSortOrder('asc');
    }
  };

  const ordenesOrdenadas = [...ordenes].sort((a, b) => {
    let comparacion = 0;
    
    switch (sortBy) {
      case 'codigo':
        comparacion = a.codigoCorrelativoUnico - b.codigoCorrelativoUnico;
        break;
      case 'cliente':
        comparacion = a.clienteNombre.localeCompare(b.clienteNombre);
        break;
      case 'fecha':
        comparacion = new Date(a.fechaComprometida).getTime() - new Date(b.fechaComprometida).getTime();
        break;
      case 'prioridad':
        const prioridadOrden = { URGENTE: 3, ALTA: 2, NORMAL: 1 };
        comparacion = prioridadOrden[a.prioridad as keyof typeof prioridadOrden] - prioridadOrden[b.prioridad as keyof typeof prioridadOrden];
        break;
      case 'estado':
        comparacion = a.estado.localeCompare(b.estado);
        break;
      default:
        comparacion = 0;
    }
    
    return sortOrder === 'asc' ? comparacion : -comparacion;
  });

  const getProductoNombre = (orden: OrdenProduccion) => {
    return orden.detalles?.[0]?.producto?.nombre || 'Producto no especificado';
  };

  const getProductoCodigo = (orden: OrdenProduccion) => {
    return orden.detalles?.[0]?.producto?.codigo || '';
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'Pedido Aceptado';
      case 'APROBADA':
        return 'Aprobada';
      case 'EN_PRODUCCION':
        return 'En Producción';
      case 'TERMINADA':
        return 'Terminado';
      case 'ENTREGADA':
        return 'Entregado';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const getPrioridadBadgeClass = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'badgeCancelada';
      case 'ALTA':
        return 'badgePendiente';
      default:
        return 'badgeAprobada';
    }
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'badgePendiente';
      case 'APROBADA':
        return 'badgeAprobada';
      case 'EN_PRODUCCION':
        return 'badgeTerminada';
      case 'TERMINADA':
        return 'badgeTerminada';
      case 'ENTREGADA':
        return 'badgeEntregada';
      case 'CANCELADA':
        return 'badgeCancelada';
      default:
        return 'badgeAprobada';
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      codigo: '',
      cliente: '',
      estado: '',
      prioridad: '',
      soloAtrasadas: false,
      soloEnProduccion: false,
      soloUrgentes: false,
      fechaInicio: '',
      fechaFin: ''
    });
  };

  const abrirModalEstado = (orden: OrdenProduccion) => {
    setOrdenSeleccionada(orden);
    setNuevoEstado(orden.estado);
    setMostrarModalEstado(true);
  };

  const cerrarModalEstado = () => {
    setMostrarModalEstado(false);
    setOrdenSeleccionada(null);
    setNuevoEstado('');
  };

  const cambiarEstado = async () => {
    if (!ordenSeleccionada || !nuevoEstado) return;

    try {
      setActualizando(true);
      const res = await fetch(`/api/produccion/ordenes/${ordenSeleccionada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        await cargarOrdenes();
        cerrarModalEstado();
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la orden');
    } finally {
      setActualizando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            <h3 style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Filtros de Búsqueda</h3>
          </div>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span>{mostrarFiltros ? 'Ocultar' : 'Mostrar'} filtros</span>
            <ChevronDown size={16} strokeWidth={2} style={{ transition: 'transform 0.2s', transform: mostrarFiltros ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>

        {mostrarFiltros && (
          <div className="formRow">
            <div className="formGroup">
              <label>Código de Orden</label>
              <input
                type="text"
                value={filtros.codigo}
                onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })}
                placeholder="Buscar por código..."
              />
            </div>
            <div className="formGroup">
              <label>Cliente</label>
              <input
                type="text"
                value={filtros.cliente}
                onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                placeholder="Buscar por cliente..."
              />
            </div>
            <div className="formGroup">
              <label>Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE_PAGO">Pedido Aceptado</option>
                <option value="APROBADA">Aprobada</option>
                <option value="EN_PRODUCCION">En Producción</option>
                <option value="TERMINADA">Terminado</option>
                <option value="ENTREGADA">Entregado</option>
              </select>
            </div>
            <div className="formGroup">
              <label>Prioridad</label>
              <select
                value={filtros.prioridad}
                onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
              >
                <option value="">Todas las prioridades</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
            <div className="formGroup">
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              />
            </div>
            <div className="formGroup">
              <label>Fecha Fin</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filtros.soloAtrasadas}
                  onChange={(e) => setFiltros({ ...filtros, soloAtrasadas: e.target.checked })}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Solo atrasadas</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filtros.soloEnProduccion}
                  onChange={(e) => setFiltros({ ...filtros, soloEnProduccion: e.target.checked })}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Solo en producción</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filtros.soloUrgentes}
                  onChange={(e) => setFiltros({ ...filtros, soloUrgentes: e.target.checked })}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Solo urgentes</span>
              </label>
              <button
                onClick={limpiarFiltros}
                className="btn btnSecondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Espacio visual entre filtros y resumen */}
      <div style={{ height: '1.5rem' }}></div>

      {/* Resumen */}
      <div className="grid3">
        <div className="card metricCard">
          <Calendar size={24} strokeWidth={2} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
          <div className="metricTitle">Total Órdenes</div>
          <div className="metricValue">{ordenes.length}</div>
        </div>
        <div className="card metricCard">
          <Clock size={24} strokeWidth={2} style={{ color: 'var(--color-warning)', marginBottom: '0.5rem' }} />
          <div className="metricTitle">En Producción</div>
          <div className="metricValue" style={{ color: 'var(--color-warning)' }}>
            {ordenes.filter(o => o.estado === 'EN_PRODUCCION').length}
          </div>
        </div>
        <div className="card metricCard">
          <AlertTriangle size={24} strokeWidth={2} style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }} />
          <div className="metricTitle">Atrasadas</div>
          <div className="metricValue" style={{ color: 'var(--color-danger)' }}>
            {ordenes.filter(o => o.estaAtrasada).length}
          </div>
        </div>
        <div className="card metricCard">
          <AlertCircle size={24} strokeWidth={2} style={{ color: 'var(--color-warning)', marginBottom: '0.5rem' }} />
          <div className="metricTitle">Urgentes</div>
          <div className="metricValue" style={{ color: 'var(--color-warning)' }}>
            {ordenes.filter(o => o.prioridad === 'URGENTE').length}
          </div>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="card tableContainer">
        <table>
          <thead>
            <tr>
              <th
                onClick={() => handleSort('codigo')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Código</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th
                onClick={() => handleSort('cliente')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Cliente</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th>Producto</th>
              <th
                onClick={() => handleSort('fecha')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Fecha Entrega</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th
                onClick={() => handleSort('prioridad')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Prioridad</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th
                onClick={() => handleSort('estado')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Estado</span>
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
              </th>
              <th>Tiempo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Cargando órdenes...
                </td>
              </tr>
            ) : ordenesOrdenadas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  No se encontraron órdenes con los filtros actuales
                </td>
              </tr>
            ) : (
              ordenesOrdenadas.map((orden) => (
                <tr
                  key={orden.id}
                  style={{
                    background: orden.estaAtrasada ? 'rgba(239, 68, 68, 0.08)' : 'transparent'
                  }}
                >
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      #{orden.codigoCorrelativoUnico}
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--color-text-primary)' }}>{orden.clienteNombre}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--color-text-primary)' }}>{getProductoNombre(orden)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{getProductoCodigo(orden)}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--color-text-primary)' }}>
                      {new Date(orden.fechaComprometida).toLocaleDateString('es-ES')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Creado: {new Date(orden.creadoEn).toLocaleDateString('es-ES')}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getPrioridadBadgeClass(orden.prioridad)}`}>
                      {orden.prioridad}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getEstadoBadgeClass(orden.estado)}`}>
                      {getEstadoLabel(orden.estado)}
                    </span>
                  </td>
                  <td>
                    {orden.estaAtrasada ? (
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-danger)' }}>
                        <AlertTriangle size={16} strokeWidth={2} style={{ marginRight: '0.25rem' }} />
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{orden.diasRetraso}d retraso</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-success)' }}>
                        <Clock size={16} strokeWidth={2} style={{ marginRight: '0.25rem' }} />
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{orden.diasRestantes}d restantes</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => abrirModalEstado(orden)}
                      className="btn btnPrimary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Cambiar Estado
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para cambiar estado */}
      {mostrarModalEstado && ordenSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '28rem', width: '100%', margin: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Cambiar Estado de Orden #{ordenSeleccionada.codigoCorrelativoUnico}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Cliente: {ordenSeleccionada.clienteNombre}
              </p>
            </div>
            <div className="formGroup">
              <label>Nuevo Estado</label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
              >
                <option value="PENDIENTE_PAGO">Pedido Aceptado</option>
                <option value="APROBADA">Aprobada</option>
                <option value="EN_PRODUCCION">En Producción</option>
                <option value="TERMINADA">Terminado</option>
                <option value="ENTREGADA">Entregado</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={cerrarModalEstado}
                className="btn btnSecondary"
                disabled={actualizando}
              >
                Cancelar
              </button>
              <button
                onClick={cambiarEstado}
                className="btn btnPrimary"
                disabled={actualizando || nuevoEstado === ordenSeleccionada.estado}
              >
                {actualizando ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

## src/app/api/inventory/authorize/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { authorizeMaterialExit, getUserByEmail } from '@/lib/data-layer';
import { Role } from '@prisma/client';

async function checkAuth(req: NextRequest, allowedRoles: Role[]): Promise<{ authorized: boolean; user?: any; errorResponse?: NextResponse }> {
  const roleHeader = req.headers.get('x-user-role');
  const emailHeader = req.headers.get('x-user-email');

  if (!roleHeader || !emailHeader) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'Falta información de autenticación.' }, { status: 401 }),
    };
  }

  const user = await getUserByEmail(emailHeader);
  if (!user || user.role !== roleHeader || !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'No autorizado para realizar esta acción.' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

// POST: Authorize material release for an order
export async function POST(req: NextRequest) {
  try {
    // RF-15: Jefe de Taller authorizes physical exit
    const authResult = await checkAuth(req, [Role.ADMIN, Role.JEFE_TALLER]);
    if (!authResult.authorized) return authResult.errorResponse!;

    const body = await req.json();
    const { ordenId } = body;

    if (!ordenId) {
      return NextResponse.json({ error: 'Se requiere el ordenId.' }, { status: 400 });
    }

    const auth = await authorizeMaterialExit(ordenId, authResult.user.id);
    return NextResponse.json(auth, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

```

## src/app/api/inventory/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getMaterials, getFichasTecnicas, getKardex, registerPurchaseInput, getUserByEmail } from '@/lib/data-layer';
import { Role } from '@prisma/client';

async function checkAuth(req: NextRequest, allowedRoles: Role[]): Promise<{ authorized: boolean; user?: any; errorResponse?: NextResponse }> {
  const roleHeader = req.headers.get('x-user-role');
  const emailHeader = req.headers.get('x-user-email');

  if (!roleHeader || !emailHeader) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'Falta información de autenticación.' }, { status: 401 }),
    };
  }

  const user = await getUserByEmail(emailHeader);
  if (!user || user.role !== roleHeader || !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'No autorizado para realizar esta acción.' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

// GET: Query dual inventory list, tech sheets, and Kardex movements
export async function GET(req: NextRequest) {
  try {
    const roleHeader = req.headers.get('x-user-role');
    if (!roleHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const materials = await getMaterials();
    const fichas = await getFichasTecnicas();
    const kardex = await getKardex();

    return NextResponse.json({ materials, fichas, kardex });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Register raw material refilling input (purchased from Ansec, Metal Mark, etc.)
export async function POST(req: NextRequest) {
  try {
    // RF-14: Almacenero registers inputs
    const authResult = await checkAuth(req, [Role.ADMIN, Role.ALMACENERO]);
    if (!authResult.authorized) return authResult.errorResponse!;

    const body = await req.json();
    const { materiaPrimaId, cantidad, motivo, tipoMovimiento } = body;

    if (!materiaPrimaId || !cantidad || !motivo) {
      return NextResponse.json({ error: 'Se requieren materiaPrimaId, cantidad y motivo.' }, { status: 400 });
    }

    const newMovement = await registerPurchaseInput({
      materiaPrimaId,
      cantidad: Number(cantidad),
      motivo,
      usuarioId: authResult.user.id,
      tipoMovimiento,
    });

    return NextResponse.json(newMovement, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

```

## src/app/api/materia-prima/[id]/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { codigo, nombre, tipo, diametro, espesor, stockMinimo, stockActual } = body;

    const existing = await prisma.materiaPrima.findFirst({
      where: {
        codigo,
        NOT: { id },
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'El código ya está en uso por otro material' }, { status: 400 });
    }

    const materiaPrima = await prisma.materiaPrima.update({
      where: { id },
      data: {
        codigo,
        nombre,
        tipo,
        diametro: diametro || null,
        espesor: espesor || null,
        stockMinimo: Number(stockMinimo || 0),
        stockActual: Number(stockActual || 0),
      },
    });

    return NextResponse.json(materiaPrima);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating materia prima' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if it's used in any FichaTecnica or Kardex
    const uses = await prisma.productosFichaTecnica.findFirst({ where: { materiaPrimaId: id } });
    if (uses) {
      return NextResponse.json({ error: 'No se puede eliminar: el material está en uso en una ficha técnica.' }, { status: 400 });
    }
    
    await prisma.materiaPrima.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting materia prima' }, { status: 500 });
  }
}

```

## src/app/api/materia-prima/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const materiasPrimas = await prisma.materiaPrima.findMany({
      orderBy: { creadoEn: 'desc' },
    });
    return NextResponse.json(materiasPrimas);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching materia prima' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, nombre, tipo, diametro, espesor, stockMinimo, stockActual } = body;

    const existing = await prisma.materiaPrima.findUnique({ where: { codigo } });
    if (existing) {
      return NextResponse.json({ error: 'El código ya está en uso' }, { status: 400 });
    }

    const materiaPrima = await prisma.materiaPrima.create({
      data: {
        codigo,
        nombre,
        tipo,
        diametro: diametro || null,
        espesor: espesor || null,
        stockMinimo: Number(stockMinimo || 0),
        stockActual: Number(stockActual || 0),
      },
    });

    return NextResponse.json(materiaPrima, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating materia prima' }, { status: 500 });
  }
}

```

## src/app/api/users/[id]/route.ts

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, password, role, image } = body;
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bcrypt = require('bcryptjs');

    const updateData: any = { name, email, role, image };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}

```

## src/app/api/users/route.ts

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, image } = body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'El correo ya está en uso' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        image,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
  }
}

```

## src/app/api/reports/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getReports, getUserByEmail } from '@/lib/data-layer';
import { Role } from '@prisma/client';

async function checkAuth(req: NextRequest, allowedRoles: Role[]): Promise<{ authorized: boolean; user?: any; errorResponse?: NextResponse }> {
  const roleHeader = req.headers.get('x-user-role');
  const emailHeader = req.headers.get('x-user-email');

  if (!roleHeader || !emailHeader) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'Falta información de autenticación.' }, { status: 401 }),
    };
  }

  const user = await getUserByEmail(emailHeader);
  if (!user || user.role !== roleHeader || !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'No autorizado para realizar esta acción.' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

// GET: Retrieve aggregated statistics for technical reports dashboard
export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAuth(req, [Role.ADMIN]);
    if (!authResult.authorized) return authResult.errorResponse!;

    const reports = await getReports();
    return NextResponse.json(reports);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

```

## src/lib/data-layer.ts

```ts
import fs from 'fs';
import path from 'path';
import prisma, { testDbConnection } from './db';
import { Role, TipoMateriaPrima, TipoCliente, EstadoOrden, TipoMovimiento, PrioridadOrden } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Configuration for local JSON DB fallback
const MOCK_DB_PATH = path.join(process.cwd(), 'db.json');

// Interface representing the structure of our JSON Database fallback
interface MockDatabase {
  users: any[];
  materiaPrima: any[];
  productosFichaTecnica: any[];
  ordenesFabricacion: any[];
  detalleOrden: any[];
  procesoEtapa: any[];
  kardexInventario: any[];
  salidaAutorizada: any[];
}

// Global variable storing whether we are currently using the PostgreSQL Database or Mock fallback
let usePostgres = false;
let isDbConnectionChecked = false;

export async function checkDbMode(): Promise<boolean> {
  if (isDbConnectionChecked) return usePostgres;
  usePostgres = await testDbConnection();
  isDbConnectionChecked = true;
  if (!usePostgres) {
    ensureMockDbInitialized();
  }
  return usePostgres;
}

// Utility to initialize the Mock JSON Database if it does not exist
function ensureMockDbInitialized() {
  if (fs.existsSync(MOCK_DB_PATH)) {
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = (pwd: string) => bcrypt.hashSync(pwd, salt);

  const initialDb: MockDatabase = {
    users: [
      { id: 'usr-admin', name: 'Carlos Admin', email: 'admin@metal.com', passwordHash: hash('admin123'), role: Role.ADMIN, creadoEn: new Date().toISOString() },
      { id: 'usr-vendedor', name: 'Laura Vendedora', email: 'vendedor@metal.com', passwordHash: hash('vendedor123'), role: Role.VENDEDOR, creadoEn: new Date().toISOString() },
      { id: 'usr-jefe', name: 'Manuel Jefe Taller', email: 'jefe@metal.com', passwordHash: hash('jefe123'), role: Role.JEFE_TALLER, creadoEn: new Date().toISOString() },
      { id: 'usr-almacenero', name: 'Juan Almacenero', email: 'almacenero@metal.com', passwordHash: hash('almacenero123'), role: Role.ALMACENERO, creadoEn: new Date().toISOString() },
      { id: 'usr-stiven', name: 'Stiven Lopez', email: 'tt9704925@gmail.com', passwordHash: hash('Stiven69Pass'), role: Role.ADMIN, creadoEn: new Date().toISOString() },
    ],
    materiaPrima: [
      { id: 'mp-var-12', codigo: 'MP-VAR-12', nombre: 'Varilla Redondo Liso 1/2"', tipo: 'VARILLA', diametro: '1/2', espesor: null, stockActual: 150.0, stockMinimo: 30.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-var-58', codigo: 'MP-VAR-58', nombre: 'Varilla Redondo Liso 5/8"', tipo: 'VARILLA', diametro: '5/8', espesor: null, stockActual: 120.0, stockMinimo: 25.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-var-34', codigo: 'MP-VAR-34', nombre: 'Varilla Redondo Liso 3/4"', tipo: 'VARILLA', diametro: '3/4', espesor: null, stockActual: 80.0, stockMinimo: 20.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-var-78', codigo: 'MP-VAR-78', nombre: 'Varilla Redondo Liso 7/8"', tipo: 'VARILLA', diametro: '7/8', espesor: null, stockActual: 60.0, stockMinimo: 15.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-var-100', codigo: 'MP-VAR-100', nombre: 'Varilla Redondo Liso 1"', tipo: 'VARILLA', diametro: '1', espesor: null, stockActual: 45.0, stockMinimo: 12.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-pla-38', codigo: 'MP-PLA-38', nombre: 'Platina de 3/8" espesor', tipo: 'PLATINA', diametro: null, espesor: '3/8', stockActual: 100.0, stockMinimo: 20.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-mul-hp', codigo: 'MP-MUL-HP', nombre: 'Hojas de Muelle Premium', tipo: 'MUELLE', diametro: null, espesor: null, stockActual: 50.0, stockMinimo: 10.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-tue-sp', codigo: 'MP-TUE-SP', nombre: 'Tuerca Especial Alta Presión', tipo: 'TUERCA', diametro: null, espesor: null, stockActual: 800.0, stockMinimo: 150.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-ara-sp', codigo: 'MP-ARA-SP', nombre: 'Arandela de Presión Industrial', tipo: 'ARANDELA', diametro: null, espesor: null, stockActual: 1000.0, stockMinimo: 200.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      
      // Commercial items (Direct Sale products in store)
      { id: 'mp-com-abrazadera', codigo: 'COM-ABRA-STD', nombre: 'Abrazadera Estándar Comercial 1/2"', tipo: 'VARILLA', diametro: '1/2', espesor: '1/8', stockActual: 50.0, stockMinimo: 10.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
      { id: 'mp-com-ubolt', codigo: 'COM-UBOLT-STD', nombre: 'Perno en U Comercial Estándar 3/4"', tipo: 'VARILLA', diametro: '3/4', espesor: '1/4', stockActual: 30.0, stockMinimo: 8.0, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() },
    ],
    productosFichaTecnica: [
      {
        id: 'ft-ubolt-58',
        codigo: 'PROD-UBOLT-58',
        nombre: 'Perno en U (U-Bolt) 5/8"',
        formulaCalculo: JSON.stringify({
          formula: '(largo * 2 + ancho + 0.1) * cantidad',
          desc: 'Calcula el largo de varilla de 5/8" requerido en metros: (Largo*2 + Ancho + 0.1m de doblez/rosca) * Cantidad',
          unit: 'metros',
        }),
        materiaPrimaId: 'mp-var-58',
      },
      {
        id: 'ft-abra-38',
        codigo: 'PROD-ABRA-38',
        nombre: 'Abrazadera Metalica Platina 3/8"',
        formulaCalculo: JSON.stringify({
          formula: '(largo + ancho * 2) * cantidad',
          desc: 'Calcula platina requerida en metros: (Largo + Ancho*2) * Cantidad',
          unit: 'metros',
        }),
        materiaPrimaId: 'mp-pla-38',
      },
      {
        id: 'ft-muelle-esp',
        codigo: 'PROD-MUELLE-ESP',
        nombre: 'Piso de Muelle Reforzado',
        formulaCalculo: JSON.stringify({
          formula: 'largo * cantidad',
          desc: 'Calcula cantidad de hojas de muelle en metros: Largo * Cantidad',
          unit: 'metros',
        }),
        materiaPrimaId: 'mp-mul-hp',
      },
    ],
    ordenesFabricacion: [
      {
        id: 'ord-1',
        codigoCorrelativoUnico: 1,
        clienteNombre: 'Aceros Industriales S.A.',
        tipoCliente: TipoCliente.EMPRESA,
        estado: EstadoOrden.PENDIENTE_PAGO,
        fechaComprometida: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        fechaProduccion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        prioridad: PrioridadOrden.NORMAL,
        montoTotal: 1500.0,
        montoAbonado: 750.0,
        metodoPago: 'TRANSFERENCIA_BANCARIA',
        esUrgente: false,
        cargoUrgencia: 0.0,
        tokenConsulta: 'token-client-1',
        creadoEn: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        actualizadoEn: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-2',
        codigoCorrelativoUnico: 2,
        clienteNombre: 'Consorcio Damper',
        tipoCliente: TipoCliente.EMPRESA,
        estado: EstadoOrden.APROBADA,
        fechaComprometida: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        fechaProduccion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        prioridad: PrioridadOrden.URGENTE,
        montoTotal: 2500.0,
        montoAbonado: 2500.0,
        metodoPago: 'TRANSFERENCIA_BANCARIA',
        esUrgente: true,
        cargoUrgencia: 400.0,
        tokenConsulta: 'token-client-2',
        creadoEn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        actualizadoEn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }
    ],
    detalleOrden: [
      {
        id: 'det-1',
        ordenId: 'ord-1',
        productoId: 'ft-ubolt-58',
        largo: 0.4,
        ancho: 0.2,
        espesor: 0.015,
        forma: 'U-Form',
        calidadAcero: 'A36',
        colorPintura: 'Negro Epóxico',
        tuercasTipo: 'Tuerca 5/8" Alta Presión',
        cantidadSolicitada: 50,
      },
      {
        id: 'det-2',
        ordenId: 'ord-2',
        productoId: 'ft-abra-38',
        largo: 0.6,
        ancho: 0.3,
        espesor: 0.009,
        forma: 'Rectangular Curvo',
        calidadAcero: '1045',
        colorPintura: 'Gris Zinc',
        tuercasTipo: null,
        cantidadSolicitada: 30,
      }
    ],
    procesoEtapa: [
      { id: 'pe-1', ordenId: 'ord-2', etapaNombre: 'Corte', ordenSecuencia: 1, completada: true, operarioAsignado: 'Roberto L.', fechaCompletada: new Date().toISOString() },
      { id: 'pe-2', ordenId: 'ord-2', etapaNombre: 'Roscado', ordenSecuencia: 2, completada: false, operarioAsignado: 'Luis M.', fechaCompletada: null },
      { id: 'pe-3', ordenId: 'ord-2', etapaNombre: 'Doblado', ordenSecuencia: 3, completada: false, operarioAsignado: null, fechaCompletada: null },
      { id: 'pe-4', ordenId: 'ord-2', etapaNombre: 'Pintura', ordenSecuencia: 4, completada: false, operarioAsignado: null, fechaCompletada: null },
    ],
    kardexInventario: [
      { id: 'kdx-1', materiaPrimaId: 'mp-var-58', tipoMovimiento: TipoMovimiento.INGRESO, cantidad: 100, motivo: 'Compra inicial', usuarioId: 'usr-almacenero', creadoEn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'kdx-2', materiaPrimaId: 'mp-pla-38', tipoMovimiento: TipoMovimiento.INGRESO, cantidad: 100, motivo: 'Compra inicial', usuarioId: 'usr-almacenero', creadoEn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'kdx-3', materiaPrimaId: 'mp-pla-38', tipoMovimiento: TipoMovimiento.EGRESO, cantidad: 36, motivo: 'Salida por Fabricación Orden #2', usuarioId: 'usr-almacenero', creadoEn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
    ],
    salidaAutorizada: [
      { id: 'sa-1', ordenId: 'ord-2', jefeTallerId: 'usr-jefe', autorizadoEn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
    ],
  };

  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
}

function readMockDb(): MockDatabase {
  ensureMockDbInitialized();
  const data = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeMockDb(db: MockDatabase) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ----------------------------------------------------
// DATABASE EXPOSED REPOSITORY METHODS
// ----------------------------------------------------

export async function getUserByEmail(email: string) {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.user.findUnique({ where: { email } });
  } else {
    const db = readMockDb();
    return db.users.find(u => u.email === email) || null;
  }
}

export async function getUsers() {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.user.findMany();
  } else {
    const db = readMockDb();
    return db.users;
  }
}

export async function getMaterials() {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.materiaPrima.findMany({
      orderBy: { codigo: 'asc' },
    });
  } else {
    const db = readMockDb();
    return [...db.materiaPrima].sort((a, b) => a.codigo.localeCompare(b.codigo));
  }
}

export async function getFichasTecnicas() {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.productosFichaTecnica.findMany({
      include: { materiaPrima: true },
      orderBy: { codigo: 'asc' },
    });
  } else {
    const db = readMockDb();
    return db.productosFichaTecnica.map(p => ({
      ...p,
      materiaPrima: db.materiaPrima.find(mp => mp.id === p.materiaPrimaId),
    })).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }
}

export async function getOrders(filters?: { status?: string; startDate?: string; endDate?: string }) {
  const isPg = await checkDbMode();
  if (isPg) {
    const whereClause: any = {};
    if (filters?.status) {
      whereClause.estado = filters.status as EstadoOrden;
    }
    if (filters?.startDate || filters?.endDate) {
      whereClause.creadoEn = {};
      if (filters.startDate) whereClause.creadoEn.gte = new Date(filters.startDate);
      if (filters.endDate) whereClause.creadoEn.lte = new Date(filters.endDate);
    }
    return await prisma.ordenesFabricacion.findMany({
      where: whereClause,
      include: {
        detalles: { include: { producto: true } },
        procesos: { orderBy: { ordenSecuencia: 'asc' } },
        salidaAutorizada: { include: { jefeTaller: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });
  } else {
    const db = readMockDb();
    let result = db.ordenesFabricacion.map(o => {
      const details = db.detalleOrden
        .filter(d => d.ordenId === o.id)
        .map(d => {
          const prod = db.productosFichaTecnica.find(p => p.id === d.productoId);
          return { ...d, producto: prod };
        });
      const stages = db.procesoEtapa
        .filter(pe => pe.ordenId === o.id)
        .sort((a, b) => a.ordenSecuencia - b.ordenSecuencia);
      const auth = db.salidaAutorizada.find(sa => sa.ordenId === o.id);
      const authUser = auth ? db.users.find(u => u.id === auth.jefeTallerId) : null;
      
      return {
        ...o,
        detalles: details,
        procesos: stages,
        salidaAutorizada: auth ? { ...auth, jefeTaller: authUser } : null,
      };
    });

    if (filters?.status) {
      result = result.filter(o => o.estado === filters.status);
    }
    if (filters?.startDate) {
      const start = new Date(filters.startDate).getTime();
      result = result.filter(o => new Date(o.creadoEn).getTime() >= start);
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate).getTime();
      result = result.filter(o => new Date(o.creadoEn).getTime() <= end);
    }

    return result.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  }
}

export async function getOrderById(id: string) {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.ordenesFabricacion.findUnique({
      where: { id },
      include: {
        detalles: { include: { producto: true } },
        procesos: { orderBy: { ordenSecuencia: 'asc' } },
        salidaAutorizada: { include: { jefeTaller: true } },
      },
    });
  } else {
    const db = readMockDb();
    const o = db.ordenesFabricacion.find(ord => ord.id === id);
    if (!o) return null;
    const details = db.detalleOrden
      .filter(d => d.ordenId === o.id)
      .map(d => {
        const prod = db.productosFichaTecnica.find(p => p.id === d.productoId);
        return { ...d, producto: prod };
      });
    const stages = db.procesoEtapa
      .filter(pe => pe.ordenId === o.id)
      .sort((a, b) => a.ordenSecuencia - b.ordenSecuencia);
    const auth = db.salidaAutorizada.find(sa => sa.ordenId === o.id);
    const authUser = auth ? db.users.find(u => u.id === auth.jefeTallerId) : null;
    
    return {
      ...o,
      detalles: details,
      procesos: stages,
      salidaAutorizada: auth ? { ...auth, jefeTaller: authUser } : null,
    };
  }
}

export async function getOrderByToken(token: string) {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.ordenesFabricacion.findUnique({
      where: { tokenConsulta: token },
      include: {
        detalles: { include: { producto: true } },
        procesos: { orderBy: { ordenSecuencia: 'asc' } },
      },
    });
  } else {
    const db = readMockDb();
    const o = db.ordenesFabricacion.find(ord => ord.tokenConsulta === token);
    if (!o) return null;
    const details = db.detalleOrden
      .filter(d => d.ordenId === o.id)
      .map(d => {
        const prod = db.productosFichaTecnica.find(p => p.id === d.productoId);
        return { ...d, producto: prod };
      });
    const stages = db.procesoEtapa
      .filter(pe => pe.ordenId === o.id)
      .sort((a, b) => a.ordenSecuencia - b.ordenSecuencia);
    
    return {
      ...o,
      detalles: details,
      procesos: stages,
    };
  }
}

export async function createOrder(data: {
  clienteNombre: string;
  tipoCliente: TipoCliente;
  fechaComprometida: string;
  fechaProduccion?: string;
  montoTotal: number;
  montoAbonado: number;
  metodoPago: string;
  esUrgente: boolean;
  prioridad?: PrioridadOrden;
  numeroOrdenCompra?: string;
  detalles: Array<{
    productoId: string;
    largo?: number;
    ancho?: number;
    espesor?: number;
    forma?: string;
    descripcionProducto?: string;
    calidadAcero: string;
    colorPintura?: string;
    tuercasTipo?: string;
    cantidadSolicitada: number;
  }>;
}) {
  const isPg = await checkDbMode();

  // Validate Payment rules (RF-06)
  // Exception: Damper (or other big companies) auto approves and is exempt from 50% check.
  // Also, if they are a Corporate/Empresa client, they are exempt!
  const isCorporateExempt = data.clienteNombre.toLowerCase().includes('damper') || data.tipoCliente === 'EMPRESA';

  // NOTE: Validation for minimum 50% abono has been disabled as requested.
  // We no longer block orders with less than 50% abono or 0 Soles initial payment.

  // Over-2000 orders are automatically assigned the "BANCARIZADO" payment method (Requirement correction)
  const finalMetodoPago = data.montoTotal > 2000 ? 'BANCARIZADO' : data.metodoPago;

  // RF-10: Work out extra cost for urgent orders if workshop is at capacity (defined as 5 or more active APROBADA orders)
  let cargoUrgencia = 0;
  if (data.esUrgente) {
    const activeOrdersCount = await getActiveOrdersCount();
    if (activeOrdersCount >= 5) {
      cargoUrgencia = data.montoTotal * 0.15; // 15% surcharge for overtime
    }
  }

  // Set the initial status based on payment or client type
  let initialStatus: EstadoOrden = EstadoOrden.PENDIENTE_PAGO;
  if (isCorporateExempt) {
    initialStatus = EstadoOrden.APROBADA; // Auto-approved due to corporate exemption
  } else if (data.montoAbonado >= data.montoTotal) {
    initialStatus = EstadoOrden.APROBADA; // Paid in full
  } else if (data.montoAbonado >= (data.montoTotal * 0.50)) {
    // For normal external clients, a 50% deposit lets it be approved
    initialStatus = EstadoOrden.APROBADA;
  }

  const finalMontoTotal = data.montoTotal + cargoUrgencia;

  if (isPg) {
    return await prisma.$transaction(async (tx: any) => {
      // Generate strict unique OC format: OC-YY-NNNNN (Requirement 1)
      const currentYear = new Date().getFullYear();
      const yy = currentYear.toString().slice(-2);
      const prefix = `OC-${yy}-`;

      const lastOrderWithOC = await tx.ordenesFabricacion.findFirst({
        where: {
          numeroOrdenCompra: {
            startsWith: prefix,
          },
        },
        orderBy: {
          numeroOrdenCompra: 'desc',
        },
      });

      let nextVal = 1;
      if (lastOrderWithOC && lastOrderWithOC.numeroOrdenCompra) {
        const lastSuffix = lastOrderWithOC.numeroOrdenCompra.slice(-5);
        const parsed = parseInt(lastSuffix, 10);
        if (!isNaN(parsed)) {
          nextVal = parsed + 1;
        }
      }
      const nnnnn = String(nextVal).padStart(5, '0');
      const generatedOC = `${prefix}${nnnnn}`;

      // 1. Create order
      const order = await tx.ordenesFabricacion.create({
        data: {
          clienteNombre: data.clienteNombre,
          tipoCliente: data.tipoCliente,
          estado: initialStatus,
          fechaComprometida: new Date(data.fechaComprometida),
          fechaProduccion: data.fechaProduccion ? new Date(data.fechaProduccion) : null,
          montoTotal: finalMontoTotal,
          montoAbonado: data.montoAbonado,
          metodoPago: finalMetodoPago,
          esUrgente: data.esUrgente,
          prioridad: data.prioridad || PrioridadOrden.NORMAL,
          cargoUrgencia: cargoUrgencia,
          numeroOrdenCompra: generatedOC,
        },
      });

      // 2. Create details
      for (const d of data.detalles) {
        await tx.detalleOrden.create({
          data: {
            ordenId: order.id,
            productoId: d.productoId,
            largo: d.largo ?? null,
            ancho: d.ancho ?? null,
            espesor: d.espesor ?? null,
            forma: d.forma ?? null,
            descripcionProducto: d.descripcionProducto ?? null,
            calidadAcero: d.calidadAcero,
            colorPintura: d.colorPintura,
            tuercasTipo: d.tuercasTipo,
            cantidadSolicitada: d.cantidadSolicitada,
          },
        });
      }

      // If approved, trigger stock check and processes
      if (initialStatus === EstadoOrden.APROBADA) {
        await executeApprovalSideEffects(order.id, tx);
      }

      return await tx.ordenesFabricacion.findUnique({
        where: { id: order.id },
        include: { detalles: { include: { producto: true } }, procesos: true },
      });
    });
  } else {
    // MOCK DB MODE
    const db = readMockDb();
    
    // Get next sequence value (RF-01)
    const nextCorrelative = db.ordenesFabricacion.reduce((max, o) => Math.max(max, o.codigoCorrelativoUnico), 0) + 1;
    const orderId = `ord-${Date.now()}`;

    // Generate strict unique OC format: OC-YY-NNNNN (Requirement 1)
    const currentYear = new Date().getFullYear();
    const yy = currentYear.toString().slice(-2);
    const prefix = `OC-${yy}-`;

    const yearOrders = db.ordenesFabricacion.filter(o => o.numeroOrdenCompra && o.numeroOrdenCompra.startsWith(prefix));
    yearOrders.sort((a, b) => b.numeroOrdenCompra.localeCompare(a.numeroOrdenCompra));
    const lastOrderWithOC = yearOrders[0];

    let nextVal = 1;
    if (lastOrderWithOC && lastOrderWithOC.numeroOrdenCompra) {
      const lastSuffix = lastOrderWithOC.numeroOrdenCompra.slice(-5);
      const parsed = parseInt(lastSuffix, 10);
      if (!isNaN(parsed)) {
        nextVal = parsed + 1;
      }
    }
    const nnnnn = String(nextVal).padStart(5, '0');
    const generatedOC = `${prefix}${nnnnn}`;

    const newOrder = {
      id: orderId,
      codigoCorrelativoUnico: nextCorrelative,
      clienteNombre: data.clienteNombre,
      tipoCliente: data.tipoCliente,
      estado: initialStatus,
      fechaComprometida: new Date(data.fechaComprometida).toISOString(),
      fechaProduccion: data.fechaProduccion ? new Date(data.fechaProduccion).toISOString() : null,
      prioridad: data.prioridad || PrioridadOrden.NORMAL,
      montoTotal: finalMontoTotal,
      montoAbonado: data.montoAbonado,
      metodoPago: finalMetodoPago,
      esUrgente: data.esUrgente,
      cargoUrgencia: cargoUrgencia,
      tokenConsulta: `token-${orderId}`,
      numeroOrdenCompra: generatedOC,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    db.ordenesFabricacion.push(newOrder);

    const detailsList = data.detalles.map((d, index) => {
      const newDetail = {
        id: `det-${Date.now()}-${index}`,
        ordenId: orderId,
        productoId: d.productoId,
        largo: d.largo ?? null,
        ancho: d.ancho ?? null,
        espesor: d.espesor ?? null,
        forma: d.forma ?? null,
        descripcionProducto: d.descripcionProducto || null,
        calidadAcero: d.calidadAcero,
        colorPintura: d.colorPintura || null,
        tuercasTipo: d.tuercasTipo || null,
        cantidadSolicitada: d.cantidadSolicitada,
      };
      db.detalleOrden.push(newDetail);
      return newDetail;
    });

    writeMockDb(db);

    if (initialStatus === EstadoOrden.APROBADA) {
      await executeApprovalSideEffectsMock(orderId);
    }

    return {
      ...newOrder,
      detalles: detailsList.map(d => ({ ...d, producto: db.productosFichaTecnica.find(p => p.id === d.productoId) })),
      procesos: readMockDb().procesoEtapa.filter(pe => pe.ordenId === orderId),
    };
  }
}

// Helper to count active (APROBADA) orders
async function getActiveOrdersCount(): Promise<number> {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.ordenesFabricacion.count({
      where: { estado: EstadoOrden.APROBADA },
    });
  } else {
    const db = readMockDb();
    return db.ordenesFabricacion.filter(o => o.estado === EstadoOrden.APROBADA).length;
  }
}

// Side effects executed transactionally when order transitions to APPROVED (process lines setup)
async function executeApprovalSideEffects(ordenId: string, tx: any) {
  // Create process stages (RF-07)
  const defaultStages = ['Corte', 'Roscado', 'Doblado', 'Pintura'];
  await tx.procesoEtapa.createMany({
    data: defaultStages.map((stage, idx) => ({
      ordenId: ordenId,
      etapaNombre: stage,
      ordenSecuencia: idx + 1,
      completada: false,
    })),
  });
}

// Side effects for Mock DB (equivalent functionality)
async function executeApprovalSideEffectsMock(ordenId: string) {
  const db = readMockDb();
  const order = db.ordenesFabricacion.find(o => o.id === ordenId);
  if (!order) return;

  // Create process stages (RF-07)
  const defaultStages = ['Corte', 'Roscado', 'Doblado', 'Pintura'];
  defaultStages.forEach((stage, idx) => {
    db.procesoEtapa.push({
      id: `pe-${ordenId}-${idx}`,
      ordenId: ordenId,
      etapaNombre: stage,
      ordenSecuencia: idx + 1,
      completada: false,
      operarioAsignado: null,
      fechaCompletada: null,
    });
  });

  writeMockDb(db);
}

export async function modifyOrder(id: string, data: {
  fechaComprometida?: string;
  fechaProduccion?: string;
  prioridad?: PrioridadOrden;
  colorPintura?: string;
  tuercasTipo?: string;
  clienteNombre?: string;
}) {
  const isPg = await checkDbMode();

  const orderBefore = await getOrderById(id);
  if (!orderBefore) throw new Error('Orden no encontrada');

  // Verify before starting production (RF-03)
  const hasStarted = orderBefore.procesos?.some((p: any) => p.completada);
  if (hasStarted) {
    throw new Error('No es posible modificar la orden. La fabricación ya ha iniciado.');
  }

  if (isPg) {
    // In Postgres, let's update details and/or orders
    const updateData: any = {};
    if (data.fechaComprometida) updateData.fechaComprometida = new Date(data.fechaComprometida);
    if (data.fechaProduccion) updateData.fechaProduccion = new Date(data.fechaProduccion);
    if (data.prioridad) updateData.prioridad = data.prioridad;
    if (data.clienteNombre) updateData.clienteNombre = data.clienteNombre;

    const order = await prisma.ordenesFabricacion.update({
      where: { id },
      data: updateData,
    });

    if (data.colorPintura !== undefined || data.tuercasTipo !== undefined) {
      await prisma.detalleOrden.updateMany({
        where: { ordenId: id },
        data: {
          colorPintura: data.colorPintura,
          tuercasTipo: data.tuercasTipo,
        },
      });
    }

    return await getOrderById(id);
  } else {
    const db = readMockDb();
    const o = db.ordenesFabricacion.find(ord => ord.id === id);
    if (!o) throw new Error('Orden no encontrada');

    if (data.fechaComprometida) o.fechaComprometida = new Date(data.fechaComprometida).toISOString();
    if (data.fechaProduccion) o.fechaProduccion = new Date(data.fechaProduccion).toISOString();
    if (data.prioridad) o.prioridad = data.prioridad;
    if (data.clienteNombre) o.clienteNombre = data.clienteNombre;
    o.actualizadoEn = new Date().toISOString();

    db.detalleOrden.filter(det => det.ordenId === id).forEach(det => {
      if (data.colorPintura !== undefined) det.colorPintura = data.colorPintura;
      if (data.tuercasTipo !== undefined) det.tuercasTipo = data.tuercasTipo;
    });

    writeMockDb(db);
    return getOrderById(id);
  }
}

export async function updateOrderStatus(id: string, status: EstadoOrden) {
  const isPg = await checkDbMode();
  const orderBefore = await getOrderById(id);
  if (!orderBefore) throw new Error('Orden no encontrada');

  // RF-04: Cancellation limit (1 hour) & block if fabrication already started
  if (status === EstadoOrden.CANCELADA) {
    const creationTime = new Date(orderBefore.creadoEn).getTime();
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - creationTime > oneHour) {
      throw new Error('No es posible cancelar la orden. Ha superado el límite permitido de 1 hora.');
    }

    // Check if fabrication started (any stage complete)
    const hasStarted = orderBefore.procesos.some((p: any) => p.completada);
    if (hasStarted) {
      throw new Error('No es posible cancelar la orden. La fabricación ya ha iniciado.');
    }
  }

  if (isPg) {
    await prisma.$transaction(async (tx: any) => {
      await tx.ordenesFabricacion.update({
        where: { id },
        data: { estado: status },
      });

      // If approved from pending_pago now, execute side effects
      if (status === EstadoOrden.APROBADA && orderBefore.estado === EstadoOrden.PENDIENTE_PAGO) {
        await executeApprovalSideEffects(id, tx);
      }
    });

    return await getOrderById(id);
  } else {
    const db = readMockDb();
    const o = db.ordenesFabricacion.find(ord => ord.id === id);
    if (!o) throw new Error('Orden no encontrada');

    const oldStatus = o.estado;
    o.estado = status;
    o.actualizadoEn = new Date().toISOString();
    writeMockDb(db);

    if (status === EstadoOrden.APROBADA && oldStatus === EstadoOrden.PENDIENTE_PAGO) {
      await executeApprovalSideEffectsMock(id);
    }

    return getOrderById(id);
  }
}

export async function addOrderAbono(id: string, abonoAdicional: number) {
  const isPg = await checkDbMode();
  const orderBefore = await getOrderById(id);
  if (!orderBefore) throw new Error('Orden no encontrada');

  const newMontoAbonado = orderBefore.montoAbonado + abonoAdicional;
  
  if (newMontoAbonado > orderBefore.montoTotal) {
    throw new Error('El monto ingresado supera el saldo pendiente de la orden.');
  }
  
  let nextStatus = orderBefore.estado;
  if (newMontoAbonado >= orderBefore.montoTotal && orderBefore.estado === EstadoOrden.PENDIENTE_PAGO) {
    nextStatus = EstadoOrden.APROBADA;
  }

  if (isPg) {
    await prisma.$transaction(async (tx: any) => {
      await tx.ordenesFabricacion.update({
        where: { id },
        data: {
          montoAbonado: newMontoAbonado,
          estado: nextStatus,
        },
      });

      if (nextStatus === EstadoOrden.APROBADA && orderBefore.estado === EstadoOrden.PENDIENTE_PAGO) {
        await executeApprovalSideEffects(id, tx);
      }
    });

    return await getOrderById(id);
  } else {
    const db = readMockDb();
    const o = db.ordenesFabricacion.find(ord => ord.id === id);
    if (!o) throw new Error('Orden no encontrada');

    const oldStatus = o.estado;
    o.montoAbonado = newMontoAbonado;
    o.estado = nextStatus;
    o.actualizadoEn = new Date().toISOString();
    writeMockDb(db);

    if (nextStatus === EstadoOrden.APROBADA && oldStatus === EstadoOrden.PENDIENTE_PAGO) {
      await executeApprovalSideEffectsMock(id);
    }

    return getOrderById(id);
  }
}

export async function updateProcessStage(id: string, completada: boolean, operarioAsignado?: string) {
  const isPg = await checkDbMode();
  if (isPg) {
    const updated = await prisma.procesoEtapa.update({
      where: { id },
      data: {
        completada,
        operarioAsignado,
        fechaCompletada: completada ? new Date() : null,
      },
    });

    // Check if all stages completed for this order -> Automatically mark order as TERMINADA
    const allStages = await prisma.procesoEtapa.findMany({
      where: { ordenId: updated.ordenId },
    });
    const allDone = allStages.every((s: any) => s.completada);
    if (allDone) {
      await prisma.ordenesFabricacion.update({
        where: { id: updated.ordenId },
        data: { estado: EstadoOrden.TERMINADA },
      });
    }

    return updated;
  } else {
    const db = readMockDb();
    const pe = db.procesoEtapa.find(stage => stage.id === id);
    if (!pe) throw new Error('Etapa no encontrada');

    pe.completada = completada;
    if (operarioAsignado !== undefined) pe.operarioAsignado = operarioAsignado;
    pe.fechaCompletada = completada ? new Date().toISOString() : null;

    // Check auto-complete order
    const allStages = db.procesoEtapa.filter(s => s.ordenId === pe.ordenId);
    const allDone = allStages.every(s => s.completada);
    if (allDone) {
      const o = db.ordenesFabricacion.find(ord => ord.id === pe.ordenId);
      if (o) {
        o.estado = EstadoOrden.TERMINADA;
        o.actualizadoEn = new Date().toISOString();
      }
    }

    writeMockDb(db);
    return pe;
  }
}

export async function registerPurchaseInput(data: {
  materiaPrimaId: string;
  cantidad: number;
  motivo: string; 
  usuarioId: string;
  tipoMovimiento?: TipoMovimiento;
}) {
  const isPg = await checkDbMode();
  const tipo = data.tipoMovimiento || (data.cantidad < 0 ? TipoMovimiento.EGRESO : TipoMovimiento.INGRESO);
  const absoluteQty = Math.abs(data.cantidad);
  const delta = tipo === TipoMovimiento.EGRESO ? -absoluteQty : absoluteQty;

  if (isPg) {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Get raw material
      const mat = await tx.materiaPrima.findUnique({ where: { id: data.materiaPrimaId } });
      if (!mat) throw new Error('Materia prima no encontrada');

      // 2. Update stock
      const nextStock = mat.stockActual + delta;
      await tx.materiaPrima.update({
        where: { id: mat.id },
        data: { stockActual: nextStock },
      });

      // 3. Create Kardex record
      return await tx.kardexInventario.create({
        data: {
          materiaPrimaId: mat.id,
          tipoMovimiento: tipo,
          cantidad: absoluteQty,
          motivo: data.motivo,
          usuarioId: data.usuarioId,
        },
      });
    });
  } else {
    const db = readMockDb();
    const mat = db.materiaPrima.find(mp => mp.id === data.materiaPrimaId);
    if (!mat) throw new Error('Materia prima no encontrada');

    mat.stockActual += delta;
    mat.actualizadoEn = new Date().toISOString();

    const newKdx = {
      id: `kdx-${Date.now()}`,
      materiaPrimaId: mat.id,
      tipoMovimiento: tipo,
      cantidad: absoluteQty,
      motivo: data.motivo,
      usuarioId: data.usuarioId,
      creadoEn: new Date().toISOString(),
    };

    db.kardexInventario.push(newKdx);
    writeMockDb(db);
    return newKdx;
  }
}

export async function authorizeMaterialExit(ordenId: string, jefeTallerId: string) {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.salidaAutorizada.create({
      data: {
        ordenId,
        jefeTallerId,
      },
    });
  } else {
    const db = readMockDb();
    
    // Check if already authorized
    const existing = db.salidaAutorizada.find(sa => sa.ordenId === ordenId);
    if (existing) return existing;

    const newAuth = {
      id: `sa-${Date.now()}`,
      ordenId,
      jefeTallerId,
      autorizadoEn: new Date().toISOString(),
    };
    db.salidaAutorizada.push(newAuth);
    writeMockDb(db);
    return newAuth;
  }
}

export async function getKardex() {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.kardexInventario.findMany({
      include: {
        materiaPrima: true,
        usuario: true,
      },
      orderBy: { creadoEn: 'desc' },
    });
  } else {
    const db = readMockDb();
    return db.kardexInventario.map(k => ({
      ...k,
      materiaPrima: db.materiaPrima.find(mp => mp.id === k.materiaPrimaId),
      usuario: db.users.find(u => u.id === k.usuarioId),
    })).sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  }
}

export async function getReports() {
  const isPg = await checkDbMode();
  
  if (isPg) {
    // 1. Pending & Delivered orders
    const pendingOrdersCount = await prisma.ordenesFabricacion.count({ where: { estado: { notIn: [EstadoOrden.ENTREGADA, EstadoOrden.CANCELADA] } } });
    const deliveredOrdersCount = await prisma.ordenesFabricacion.count({ where: { estado: EstadoOrden.ENTREGADA } });

    // 2. Average completion time in hours
    // (ActualizadoEn - CreadoEn) for orders in state TERMINADA or ENTREGADA
    const completedOrders = await prisma.ordenesFabricacion.findMany({
      where: { estado: { in: [EstadoOrden.TERMINADA, EstadoOrden.ENTREGADA] } },
      select: { creadoEn: true, actualizadoEn: true },
    });
    
    let avgHours = 0;
    if (completedOrders.length > 0) {
      const totalMs = completedOrders.reduce((sum: number, o: any) => {
        return sum + (new Date(o.actualizadoEn).getTime() - new Date(o.creadoEn).getTime());
      }, 0);
      avgHours = (totalMs / completedOrders.length) / (1000 * 60 * 60);
    }

    // 3. Raw materials ranking: group by product or count occurrences
    const details = await prisma.detalleOrden.findMany({
      include: { producto: true },
    });
    const rankingMap: Record<string, number> = {};
    details.forEach((d: any) => {
      rankingMap[d.producto.nombre] = (rankingMap[d.producto.nombre] || 0) + d.cantidadSolicitada;
    });
    const ranking = Object.entries(rankingMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    // 4. Monthly consumption (from Kardex egresos)
    const egresos = await prisma.kardexInventario.findMany({
      where: { tipoMovimiento: TipoMovimiento.EGRESO },
      include: { materiaPrima: true },
    });
    const consumptionMap: Record<string, number> = {};
    egresos.forEach((e: any) => {
      consumptionMap[e.materiaPrima.nombre] = (consumptionMap[e.materiaPrima.nombre] || 0) + e.cantidad;
    });
    const consumption = Object.entries(consumptionMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    return {
      pendingOrdersCount,
      deliveredOrdersCount,
      avgHours: parseFloat(avgHours.toFixed(2)),
      ranking,
      consumption,
    };
  } else {
    // MOCK DB MODE
    const db = readMockDb();
    const pendingOrdersCount = db.ordenesFabricacion.filter(o => o.estado !== EstadoOrden.ENTREGADA && o.estado !== EstadoOrden.CANCELADA).length;
    const deliveredOrdersCount = db.ordenesFabricacion.filter(o => o.estado === EstadoOrden.ENTREGADA).length;

    const completedOrders = db.ordenesFabricacion.filter(o => o.estado === EstadoOrden.TERMINADA || o.estado === EstadoOrden.ENTREGADA);
    let avgHours = 0;
    if (completedOrders.length > 0) {
      const totalMs = completedOrders.reduce((sum, o) => {
        return sum + (new Date(o.actualizadoEn).getTime() - new Date(o.creadoEn).getTime());
      }, 0);
      avgHours = (totalMs / completedOrders.length) / (1000 * 60 * 60);
    }

    const rankingMap: Record<string, number> = {};
    db.detalleOrden.forEach(d => {
      const prod = db.productosFichaTecnica.find(p => p.id === d.productoId);
      if (prod) {
        rankingMap[prod.nombre] = (rankingMap[prod.nombre] || 0) + d.cantidadSolicitada;
      }
    });
    const ranking = Object.entries(rankingMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    const egresos = db.kardexInventario.filter(k => k.tipoMovimiento === TipoMovimiento.EGRESO);
    const consumptionMap: Record<string, number> = {};
    egresos.forEach(e => {
      const mat = db.materiaPrima.find(mp => mp.id === e.materiaPrimaId);
      if (mat) {
        consumptionMap[mat.nombre] = (consumptionMap[mat.nombre] || 0) + e.cantidad;
      }
    });
    const consumption = Object.entries(consumptionMap)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);

    return {
      pendingOrdersCount,
      deliveredOrdersCount,
      avgHours: parseFloat(avgHours.toFixed(2)),
      ranking,
      consumption,
    };
  }
}

```

## src/app/globals.css

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

:root {
  --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Color Palette - Premium Light Theme */
  --bg-main: #f4f7fb;
  --bg-card: rgba(255, 255, 255, 0.85);
  --bg-card-hover: rgba(255, 255, 255, 1);
  --border-color: rgba(15, 23, 42, 0.1);
  --border-hover: rgba(79, 70, 229, 0.4);
  
  --color-primary: #4f46e5;       
  --color-primary-hover: #4338ca;
  --color-secondary: #7e22ce;     
  --color-accent: #0d9488;        
  
  --color-text-primary: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;
  
  --color-success: #059669;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-info: #0284c7;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-glow: 0 0 20px 0 rgba(99, 102, 241, 0.25);
  --shadow-glow-success: 0 0 20px 0 rgba(16, 185, 129, 0.25);
  --shadow-glow-danger: 0 0 20px 0 rgba(239, 68, 68, 0.3);
  
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base Styles */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html, body {
  min-height: 100vh;
  background-color: var(--bg-main);
  background-image: 
    radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(126, 34, 206, 0.08) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(13, 148, 136, 0.05) 0px, transparent 60%);
  background-attachment: fixed;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

body {
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
  line-height: 1.25;
}

p {
  color: var(--color-text-secondary);
}

/* Layout Shell */
.appContainer {
  max-width: 1440px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Header Grid */
.headerSection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.5rem;
}

.logoArea h1 {
  font-size: 2rem;
  background: linear-gradient(135deg, var(--color-text-primary) 30%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logoArea p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* Role Selector Header Bar */
.roleSelectorBar {
  display: flex;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.4rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  gap: 0.25rem;
}

.roleBtn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  padding: 0.5rem 1rem;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.roleBtn:hover {
  color: var(--color-primary);
  background: rgba(0, 0, 0, 0.04);
}

.roleBtnActive {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-glow);
}

.roleBtnActive:hover {
  background: var(--color-primary-hover);
  color: white;
}

/* Glassmorphism Card style */
.card {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: border-color var(--transition-fast), transform var(--transition-fast);
}

.card:hover {
  border-color: var(--border-hover);
}

/* Grid Utilities */
.grid2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.grid3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Inputs & Form Elements */
.formGroup {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.formRow {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.formRow > div {
  flex: 1 1 180px;
  min-width: 0;
}

label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

input, select, textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  font-size: 0.95rem;
  transition: all var(--transition-fast);
  outline: none;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btnPrimary {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-glow);
}

.btnPrimary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btnSecondary {
  background: rgba(0, 0, 0, 0.03);
  color: var(--color-text-primary);
  border: 1px solid var(--border-color);
}

.btnSecondary:hover {
  background: rgba(0, 0, 0, 0.06);
  border-color: var(--color-text-secondary);
}

.btnDanger {
  background: var(--color-danger);
  color: white;
}

.btnDanger:hover {
  background: #dc2626;
}

.btnSuccess {
  background: var(--color-success);
  color: white;
}

.btnSuccess:hover {
  background: #059669;
}

/* Badges / Pill Tags */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.badgePendiente {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badgeAprobada {
  background: rgba(6, 182, 212, 0.15);
  color: var(--color-info);
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.badgeTerminada {
  background: rgba(168, 85, 247, 0.15);
  color: var(--color-secondary);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.badgeEntregada {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badgeCancelada {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Kanban Board Styling */
.kanbanBoard {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.kanbanColumn {
  flex: 1;
  min-width: 280px;
  background: rgba(241, 245, 249, 0.6);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.kanbanColHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.kanbanColTitle {
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kanbanCount {
  background: rgba(0, 0, 0, 0.08);
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 20px;
}

.kanbanCard {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.kanbanCard:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.kanbanCardUrgente {
  border-left: 4px solid var(--color-danger);
  box-shadow: 0 0 10px 0 rgba(239, 68, 68, 0.1);
}

/* Stock alerts styles */
.stockLow {
  border-color: var(--color-danger) !important;
  box-shadow: var(--shadow-glow-danger);
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

/* Table styling */
.tableContainer {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

th, td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

th {
  background: rgba(241, 245, 249, 0.9);
  font-weight: 600;
  color: var(--color-text-secondary);
}

tr:hover td {
  background: rgba(0, 0, 0, 0.02);
}

/* Alert notifications styles */
.alertBanner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alertBannerInfo {
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: var(--color-text-primary);
}

/* Mode Notification Banner */
.devModeBanner {
  background: linear-gradient(90deg, #b45309, #d97706);
  padding: 0.5rem 1rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  border-radius: var(--radius-sm);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

/* Tab contents and views */
.tabContent {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Metrics and figures dashboard cards */
.metricCard {
  text-align: center;
  padding: 1.5rem;
}

.metricValue {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1.2;
  margin: 0.5rem 0;
}

.metricTitle {
  font-size: 0.875rem;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* Progress Stage line list */
.progressList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.progressItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  border: 1px solid var(--border-color);
}

.progressItemDone {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.05);
}

.progressDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-muted);
  display: inline-block;
}

.progressDotDone {
  background: var(--color-success);
  box-shadow: 0 0 8px var(--color-success);
}

```

## src/app/layout.tsx

```ts
import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Metal System - Control de Producción e Inventario',
  description: 'Sistema integral de fabricación, inventario y cotizaciones en taller metalúrgico',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

```

## src/app/page.module.css

```css
.page {
  --background: #fafafa;
  --foreground: #fff;

  --text-primary: #000;
  --text-secondary: #666;

  --button-primary-hover: #383838;
  --button-secondary-hover: #f2f2f2;
  --button-secondary-border: #ebebeb;

  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-geist-sans);
  background-color: var(--background);
}

.authScreen {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(360px, 0.88fr);
  min-height: 100dvh;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 45%, #e2e8f0 100%);
}

.authHero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 3vw, 3rem);
  background-image:
    linear-gradient(180deg, rgba(15, 23, 42, 0.22), rgba(15, 23, 42, 0.54)),
    url('/factory-bg.png');
  background-size: cover;
  background-position: center;
  border-right: 1px solid rgba(15, 23, 42, 0.12);
}

.authHeroCard {
  width: min(100%, 520px);
  margin: auto;
  padding: 1.25rem 1.5rem;
  border-radius: 22px;
  border: 1px solid rgba(120, 113, 108, 0.18);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 45px rgba(120, 113, 108, 0.14);
}

.authHeroCard h2 {
  font-size: clamp(1.1rem, 1.5vw, 1.45rem);
  line-height: 1.2;
  color: #1d4ed8 !important;
  font-weight: 800;
}

.authHeroCard p {
  font-size: clamp(0.9rem, 1.15vw, 0.98rem);
  line-height: 1.55;
  color: #2563eb !important;
}

.authFormWrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 3vw, 2rem);
}

.authCard {
  width: min(100%, 460px);
  max-height: none;
  overflow: hidden;
  padding: clamp(1.25rem, 2.2vw, 2rem);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 30px 70px rgba(79, 70, 229, 0.12);
}

.authCard > div:first-child {
  margin-bottom: 1.25rem !important;
}

.authCard form {
  gap: 1rem !important;
}

.authCard label {
  margin-bottom: 0.3rem !important;
  font-size: 0.82rem !important;
}

.authCard input {
  padding: 0.8rem 1rem !important;
  font-size: 0.92rem !important;
}

.authCard button[type='submit'] {
  padding: 0.85rem !important;
  margin-top: 0.25rem !important;
  font-size: 0.95rem !important;
}

@media (max-width: 980px) {
  .authScreen {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .authHero {
    display: none;
  }

  .authFormWrap {
    padding-top: 0;
    padding-bottom: clamp(1rem, 4vw, 2rem);
    min-height: 100dvh;
    background-image:
      linear-gradient(180deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.42)),
      url('/factory-bg.png');
    background-size: cover;
    background-position: center;
    position: relative;
  }

  .authCard {
    max-height: none;
    background: rgba(255, 255, 255, 0.92);
  }
}

@media (max-width: 600px) {
  .authHero {
    display: none;
  }

  .authFormWrap {
    padding: 0.75rem 1rem 1.5rem;
  }

  .authCard {
    padding: 0.95rem;
    border-radius: 16px;
  }
}

@media (max-height: 820px) {
  .authHero {
    padding: 0.75rem;
  }

  .authHeroCard {
    width: min(100%, 460px);
  }

  .authFormWrap {
    padding: 0.75rem 1rem;
  }

  .authCard {
    padding: 1rem 1.15rem;
    background: rgba(255, 255, 255, 0.92);
  }

  .authCard > div:first-child {
    margin-bottom: 0.95rem !important;
  }

  .authCard form {
    gap: 0.8rem !important;
  }

  .authCard button[type='submit'] {
    margin-top: 0.1rem !important;
  }

  .authCard img {
    height: 72px !important;
  }

  .authCard h1 {
    font-size: 1.5rem !important;
    margin-bottom: 0.35rem !important;
  }

  .authCard p {
    font-size: 0.88rem !important;
  }

  .authCard .dividerCompact {
    margin: 0.9rem 0 !important;
  }
}

.main {
  display: flex;
  flex: 1;
  width: 100%;
  max-width: 800px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  background-color: var(--foreground);
  padding: 120px 60px;
}

.intro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 24px;
}

.intro h1 {
  max-width: 320px;
  font-size: 40px;
  font-weight: 600;
  line-height: 48px;
  letter-spacing: -2.4px;
  text-wrap: balance;
  color: var(--text-primary);
}

.intro p {
  max-width: 440px;
  font-size: 18px;
  line-height: 32px;
  text-wrap: balance;
  color: var(--text-secondary);
}

.intro a {
  font-weight: 500;
  color: var(--text-primary);
}

.ctas {
  display: flex;
  flex-direction: row;
  width: 100%;
  max-width: 440px;
  gap: 16px;
  font-size: 14px;
}

.ctas a {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  border-radius: 128px;
  border: 1px solid transparent;
  transition: 0.2s;
  cursor: pointer;
  width: fit-content;
  font-weight: 500;
}

a.primary {
  background: var(--text-primary);
  color: var(--background);
  gap: 8px;
}

a.secondary {
  border-color: var(--button-secondary-border);
}

/* Enable hover only on non-touch devices */
@media (hover: hover) and (pointer: fine) {
  a.primary:hover {
    background: var(--button-primary-hover);
    border-color: transparent;
  }

  a.secondary:hover {
    background: var(--button-secondary-hover);
    border-color: transparent;
  }
}

@media (max-width: 600px) {
  .main {
    padding: 48px 24px;
  }

  .intro {
    gap: 16px;
  }

  .intro h1 {
    font-size: 32px;
    line-height: 40px;
    letter-spacing: -1.92px;
  }
}

@media (prefers-color-scheme: dark) {
  .logo {
    filter: invert();
  }

  .page {
    --background: #000;
    --foreground: #000;

    --text-primary: #ededed;
    --text-secondary: #999;

    --button-primary-hover: #ccc;
    --button-secondary-hover: #1a1a1a;
    --button-secondary-border: #1a1a1a;
  }
}

```

## src/app/page.tsx

```ts
"use client";

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import styles from './page.module.css';
import {
  LayoutDashboard,
  ClipboardList,
  PackageOpen,
  BarChart3,
  Users,
  Plus,
  Factory,
  ListOrdered,
  LogOut,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Truck,
  XCircle,
  Menu,
  X,
  Eye,
  EyeOff,
  Calendar,
  Trash2,
  Camera,
  Upload,
  Edit,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import CalendarioProduccion from './components/CalendarioProduccion';
import SeguimientoOrdenes from './components/SeguimientoOrdenes';

// Sidebar Button Component
const SidebarButton = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '0.75rem 0.875rem',
        borderRadius: '10px',
        background: active ? '#4F46E5' : 'transparent',
        color: active ? '#FFFFFF' : '#475569',
        border: 'none',
        textAlign: 'left',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#EFF6FF';
          e.currentTarget.style.color = '#2563EB';
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#475569';
        }
      }}
    >
      {React.cloneElement(icon as any, { 
        strokeWidth: 2, 
        style: { 
          ...(icon as any).props?.style, 
          color: active ? '#FFFFFF' : (icon as any).props?.style?.color || '#64748B' 
        } 
      })}
      {label}
    </button>
  );
};



function AuthErrorHandler({ onError }: { onError: (message: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams.get('authError') ?? searchParams.get('error');
    if (authError === 'not-registered' || authError === 'AccessDenied') {
      onError('Este kbro no esta registrado');
    }
  }, [onError, searchParams]);

  return null;
}

export default function Home() {
  // Authentication State with NextAuth
  const { data: session, status, update } = useSession();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // When session changes, update currentUser!
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setCurrentUser({
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role,
      });
    } else if (status === "unauthenticated") {
      setCurrentUser(null);
    }
  }, [session, status]);
  
  // Users state for Usuarios tab
  const [users, setUsers] = useState<any[]>([]);
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Login State (for legacy login with email/password)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Unified Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [kardex, setKardex] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);

  // Active Tab Selection
  const [activeTab, setActiveTab] = useState<string>('orders');
  
  // Production Module Internal Tab Selection
  const [productionActiveTab, setProductionActiveTab] = useState<'calendario' | 'seguimiento'>('calendario');

  // Modals & Detail Simulation State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [adicionalAbono, setAdicionalAbono] = useState<string>('');
  const [confirmingPaymentOrderId, setConfirmingPaymentOrderId] = useState<string | null>(null);
  const [ocSearchQuery, setOcSearchQuery] = useState<string>('OC-');
  const [activeExternalToken, setActiveExternalToken] = useState<string | null>(null);
  const [externalOrderData, setExternalOrderData] = useState<any>(null);
  const [stageOperario, setStageOperario] = useState<{ [key: string]: string }>({});

  // Form States
  const [orderForm, setOrderForm] = useState({
    clienteNombre: '',
    tipoCliente: 'TIENDA' as 'TIENDA' | 'EMPRESA',
    fechaComprometida: '',
    montoTotal: 0 as number | '',
    montoAbonado: 0 as number | '',
    metodoPago: 'EFECTIVO',
    esUrgente: false,
    productoId: '',
    descripcionProducto: '',
    numeroOrdenCompra: '',
    calidadAcero: 'A36',
    colorPintura: 'Ninguno',
    tuercasTipo: 'Ninguno',
    cantidadSolicitada: 10,
  });

  const [restockForm, setRestockForm] = useState({
    materiaPrimaId: '',
    cantidad: 50,
    tipoMovimiento: 'INGRESO',
    motivo: '',
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VENDEDOR',
    image: '',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [mpForm, setMpForm] = useState({
    codigo: '',
    nombre: '',
    tipo: 'VARILLA',
    diametro: '',
    espesor: '',
    stockActual: 0,
    stockMinimo: 0,
  });
  const [isCreatingMP, setIsCreatingMP] = useState(false);
  const [editingMPId, setEditingMPId] = useState<string | null>(null);

  const [inventorySubTab, setInventorySubTab] = useState<'produccion' | 'comercial'>('produccion');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // ----------------------------------------------------
  // DATA FETCHING & API INTERACTION
  // ----------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setLoginForm({ email: '', password: '' });
      } else {
        setLoginError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setLoginError('Error de red al intentar iniciar sesión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false }); // Don't redirect, we'll handle state
    setCurrentUser(null);
    setOrders([]);
    setMaterials([]);
    setFichas([]);
    setKardex([]);
    setReports(null);
  };


  const getHeaders = useCallback((): Record<string, string> => {
    if (!currentUser) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'x-user-role': currentUser.role,
      'x-user-email': currentUser.email,
    };
  }, [currentUser]);

  const loadData = useCallback(async () => {
    if (!currentUser) return; // Prevent fetching if not logged in
    try {
      // 1. Fetch Orders
      const ordersRes = await fetch('/api/orders', { headers: getHeaders() });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      // 2. Fetch Inventory
      const invRes = await fetch('/api/inventory', { headers: getHeaders() });
      if (invRes.ok) {
        const invData = await invRes.json();
        setMaterials(invData.materials || []);
        setFichas(invData.fichas || []);
        setKardex(invData.kardex || []);
      }

      // 3. Fetch Reports (Only for ADMIN)
      if (currentUser?.role === 'ADMIN') {
        const repRes = await fetch('/api/reports', { headers: getHeaders() });
        if (repRes.ok) {
          const repData = await repRes.json();
          setReports(repData);
        }

        // 4. Fetch Users (Only for ADMIN)
        const usersRes = await fetch(`/api/users?_t=${Date.now()}`, { 
          headers: { ...getHeaders(), 'Cache-Control': 'no-cache' },
          cache: 'no-store'
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        } else {
          console.error("Failed to fetch users:", await usersRes.text());
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [currentUser, getHeaders]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Auto-switch tabs to a valid option when role changes
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'VENDEDOR') {
      setActiveTab('orders');
    } else if (currentUser.role === 'JEFE_TALLER') {
      setActiveTab('production');
    } else if (currentUser.role === 'ALMACENERO') {
      setActiveTab('inventory');
    } else if (currentUser.role === 'ADMIN') {
      setActiveTab('dashboard');
      loadData();
    }
  }, [currentUser, loadData]);

  // Fetch external public view when simulated
  const handleLoadExternal = async (token: string) => {
    try {
      const res = await fetch(`/api/external/${token}`);
      if (res.ok) {
        const data = await res.json();
        setExternalOrderData(data);
        setActiveExternalToken(token);
      } else {
        alert('No se pudo encontrar el enlace público.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // CALCULATIONS (RF-11 Client Preview)
  // ----------------------------------------------------

  const getCalculatedMaterial = () => {
    if (!orderForm.productoId) return { qty: 0, unit: 'metros', material: '' };
    const p = fichas.find(ft => ft.id === orderForm.productoId);
    if (!p) return { qty: 0, unit: 'metros', material: '' };

    return {
      qty: 0,
      unit: 'metros',
      material: p.materiaPrima ? p.materiaPrima.nombre : 'Insumo',
    };
  };

  const matPreview = getCalculatedMaterial();

  const filteredOrders = orders.filter(order => {
    if (ocSearchQuery === 'OC-' || !ocSearchQuery) return true;
    return order.numeroOrdenCompra && order.numeroOrdenCompra.toLowerCase().includes(ocSearchQuery.toLowerCase());
  });

  // Watch change in form to adjust base pricing automatically
  const handleFormChange = (field: string, value: any) => {
    setOrderForm(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field !== 'montoTotal') {
        let basePrice = 20; 
        const subtotal = basePrice * updated.cantidadSolicitada;

        let extra = 0;
        if (updated.colorPintura && updated.colorPintura !== 'Ninguno') extra += 5 * updated.cantidadSolicitada;
        if (updated.tuercasTipo && updated.tuercasTipo !== 'Ninguno') extra += 8 * updated.cantidadSolicitada;

        updated.montoTotal = subtotal + extra;
      }

      return updated;
    });
  };

  const isWorkshopAtCapacity = orders.filter(o => o.estado === 'APROBADA').length >= 5;

  // ----------------------------------------------------
  // SUBMISSIONS
  // ----------------------------------------------------

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!orderForm.clienteNombre) {
      setFormError('Debe ingresar el nombre del cliente.');
      return;
    }
    if (!orderForm.productoId) {
      setFormError('Debe seleccionar un producto de la ficha técnica.');
      return;
    }
    if (!orderForm.fechaComprometida) {
      setFormError('Debe definir la fecha comprometida de entrega.');
      return;
    }



    try {
      const payload = {
        clienteNombre: orderForm.clienteNombre,
        tipoCliente: orderForm.tipoCliente,
        fechaComprometida: orderForm.fechaComprometida,
        montoTotal: Number(orderForm.montoTotal) || 0,
        montoAbonado: Number(orderForm.montoAbonado) || 0,
        metodoPago: orderForm.metodoPago,
        esUrgente: orderForm.esUrgente,
        detalles: [{
          productoId: orderForm.productoId,
          descripcionProducto: orderForm.descripcionProducto,
          calidadAcero: orderForm.calidadAcero,
          colorPintura: orderForm.colorPintura !== 'Ninguno' ? orderForm.colorPintura : undefined,
          tuercasTipo: orderForm.tuercasTipo !== 'Ninguno' ? orderForm.tuercasTipo : undefined,
          cantidadSolicitada: Number(orderForm.cantidadSolicitada),
        }]
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setFormSuccess(`Orden #${result.codigoCorrelativoUnico} creada exitosamente. Estado: ${result.estado}.`);
        loadData();
        setOrderForm({
          clienteNombre: '',
          tipoCliente: 'TIENDA',
          fechaComprometida: '',
          montoTotal: 0 as number | '',
          montoAbonado: 0 as number | '',
          metodoPago: 'EFECTIVO',
          esUrgente: false,
          productoId: '',
          descripcionProducto: '',
          numeroOrdenCompra: '',
          calidadAcero: 'A36',
          colorPintura: 'Ninguno',
          tuercasTipo: 'Ninguno',
          cantidadSolicitada: 10,
        });
      } else {
        setFormError(result.error || 'No se pudo crear la orden.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error de red.');
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ estado: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        loadData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAbonoSubmit = async (orderId: string) => {
    const amt = parseFloat(adicionalAbono);
    if (isNaN(amt) || amt <= 0) {
      alert('Ingrese un monto de abono válido mayor a cero.');
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ abonoAdicional: amt }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedOrder(data);
        setAdicionalAbono('');
        loadData();
      } else {
        alert(`Error: ${data.error || 'El monto ingresado supera el saldo pendiente de la orden.'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error de conexión.');
    }
  };

  const handleModifyOrder = async (orderId: string, color: string, nuts: string, date: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          colorPintura: color,
          tuercasTipo: nuts,
          fechaComprometida: date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Orden modificada correctamente.');
        loadData();
        setSelectedOrder(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStage = async (stageId: string, currentOrder: any, completed: boolean) => {
    const op = stageOperario[stageId] || '';
    try {
      const res = await fetch(`/api/stages/${stageId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ completada: completed, operarioAsignado: op }),
      });
      if (res.ok) {
        loadData();
        // Update selection details
        const updatedOrdRes = await fetch(`/api/orders/${currentOrder.id}`, { headers: getHeaders() });
        if (updatedOrdRes.ok) {
          const updatedOrd = await updatedOrdRes.json();
          setSelectedOrder(updatedOrd);
        }
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!restockForm.materiaPrimaId) {
      setFormError('Seleccione la materia prima a reabastecer.');
      return;
    }

    try {
      const selectedMat = materials.find(m => m.id === restockForm.materiaPrimaId);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          materiaPrimaId: restockForm.materiaPrimaId,
          cantidad: Number(restockForm.cantidad),
          tipoMovimiento: restockForm.tipoMovimiento,
          motivo: restockForm.motivo || (restockForm.tipoMovimiento === 'EGRESO' ? 'Consumo manual en taller' : 'Ingreso manual de material'),
        }),
      });

      if (res.ok) {
        setFormSuccess(`Movimiento de ${restockForm.tipoMovimiento === 'EGRESO' ? 'Salida' : 'Ingreso'} registrado con éxito para ${selectedMat.nombre}.`);
        loadData();
        setRestockForm({ materiaPrimaId: '', cantidad: 50, tipoMovimiento: 'INGRESO', motivo: '' });
      } else {
        const err = await res.json();
        setFormError(err.error || 'Error al actualizar inventario.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error de red.');
    }
  };

  const handleAuthorizeRelease = async (orderId: string) => {
    try {
      const res = await fetch('/api/inventory/authorize', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ordenId: orderId }),
      });
      if (res.ok) {
        alert('Salida física del material autorizada correctamente.');
        loadData();
        const updatedOrdRes = await fetch(`/api/orders/${orderId}`, { headers: getHeaders() });
        if (updatedOrdRes.ok) {
          setSelectedOrder(await updatedOrdRes.json());
        }
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(editingUserId ? 'Usuario actualizado exitosamente.' : 'Usuario creado exitosamente.');
        setUserForm({ name: '', email: '', password: '', role: 'VENDEDOR', image: '' });
        setIsCreatingUser(false);
        setEditingUserId(null);
        loadData();
      } else {
        setFormError(data.error || (editingUserId ? 'Error al actualizar usuario.' : 'Error al crear usuario.'));
      }
    } catch (err: any) {
      setFormError(editingUserId ? 'Error de red al actualizar usuario.' : 'Error de red al crear usuario.');
    }
  };

  const handleEditUserClick = (user: any) => {
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      image: user.image || '',
    });
    setEditingUserId(user.id);
    setIsCreatingUser(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setFormSuccess('Usuario eliminado.');
        loadData();
      } else {
        setFormError('Error al eliminar usuario.');
      }
    } catch (err: any) {
      setFormError('Error de red al eliminar usuario.');
    }
  };

  const handleSaveMPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const url = editingMPId ? `/api/materia-prima/${editingMPId}` : '/api/materia-prima';
      const method = editingMPId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(mpForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(editingMPId ? 'Materia Prima actualizada.' : 'Materia Prima creada.');
        setMpForm({ codigo: '', nombre: '', tipo: 'VARILLA', diametro: '', espesor: '', stockActual: 0, stockMinimo: 0 });
        setIsCreatingMP(false);
        setEditingMPId(null);
        loadData();
      } else {
        setFormError(data.error || 'Error al guardar materia prima.');
      }
    } catch (err: any) {
      setFormError('Error de red.');
    }
  };

  const handleEditMPClick = (mp: any) => {
    setMpForm({
      codigo: mp.codigo,
      nombre: mp.nombre,
      tipo: mp.tipo,
      diametro: mp.diametro || '',
      espesor: mp.espesor || '',
      stockActual: mp.stockActual,
      stockMinimo: mp.stockMinimo,
    });
    setEditingMPId(mp.id);
    setIsCreatingMP(true);
  };

  const handleDeleteMP = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta materia prima?')) return;
    try {
      const res = await fetch(`/api/materia-prima/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Materia prima eliminada.');
        loadData();
      } else {
        setFormError(data.error || 'Error al eliminar materia prima.');
      }
    } catch (err: any) {
      setFormError('Error de red.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ----------------------------------------------------
  // INTERFACE RENDERING HELPERS
  // ----------------------------------------------------

  const getStageDotClass = (stage: any) => {
    return stage.completada ? 'progressDot progressDotDone' : 'progressDot';
  };

  const canCancelOrder = (order: any) => {
    if (order.estado === 'CANCELADA' || order.estado === 'ENTREGADA') return false;
    const creationTime = new Date(order.creadoEn).getTime();
    const oneHour = 60 * 60 * 1000;
    const hasStarted = order.procesos?.some((p: any) => p.completada);
    return (Date.now() - creationTime <= oneHour) && !hasStarted;
  };

  if (!currentUser) {
    return (
      <div className={styles.authScreen}>
        <div className={styles.authHero}>
          <div className={styles.authHeroCard}>
            <h2 style={{ color: '#1d4ed8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Factoría Sánchez
            </h2>
            <p style={{ color: '#2563eb', fontSize: '0.95rem' }}>
              "Si no lo tenemos en Sánchez, lo hacemos". <br /><br />
              Sistema de gestión integral operativa para líderes en fabricación metal-mecánica y distribución de autopartes para vehículos pesados y agroindustria.
            </p>
          </div>
        </div>

        <div className={styles.authFormWrap}>
          <div className={styles.authCard}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <img src="/logo.png" alt="Logo Factoría Sánchez" style={{ height: '100px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.5rem', fontWeight: 800 }}>Factoría Sánchez</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Ingreso Seguro al Sistema Central</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="formGroup" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="Ingrese su correo electrónico..."
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  style={{ padding: '0.9rem 1rem', borderRadius: '10px', fontSize: '0.95rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div className="formGroup" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ingrese su contraseña..."
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    style={{ padding: '0.9rem 3rem 0.9rem 1rem', borderRadius: '10px', fontSize: '0.95rem', background: '#f8fafc', border: '1px solid #e2e8f0', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{ padding: '1rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#b91c1c', fontWeight: 600 }}>{loginError}</span>
                </div>
              )}

              <button type="submit" className="btn btnPrimary" disabled={isLoggingIn} style={{ padding: '1rem', marginTop: '0.5rem', fontWeight: 'bold', borderRadius: '10px', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)' }}>
                {isLoggingIn ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </form>
            
            <div className={styles.dividerCompact} style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>o inicia sesión con</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
            
            <button
              onClick={() => signIn('google')}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#475569',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.32 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#4285F4" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Iniciar sesión con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', position: 'relative' }}>
      {/* Mobile overlay */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          display: (isMobile && isMobileSidebarOpen) ? 'block' : 'none',
          flexDirection: 'column'
        }}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        style={{
          width: '260px',
          background: '#FFFFFF',
          color: '#1E293B',
          padding: '1.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          borderRight: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          zIndex: 50,
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? (isMobileSidebarOpen ? '0' : '-260px') : '0',
          top: 0,
          bottom: 0,
          transition: 'left 0.2s ease, transform 0.2s ease'
        }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.5rem' }}>
              <img src="/logo.png" alt="Logo Factoría Sánchez" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} onError={(e) => { 
                e.currentTarget.style.display = 'none'; 
              }} />
              <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>Factoría Sánchez</h1>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, paddingLeft: '3rem' }}>Sistema de Gestión</p>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            style={{
              display: isMobile ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#475569'
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* Admin Links */}
          {currentUser.role === 'ADMIN' && (
            <>
              <SidebarButton
                active={activeTab === 'dashboard'}
                icon={<LayoutDashboard size={18} strokeWidth={2} />}
                label="Dashboard"
                onClick={() => setActiveTab('dashboard')}
              />
              <SidebarButton
                active={activeTab === 'orders'}
                icon={<ClipboardList size={18} strokeWidth={2} />}
                label="Órdenes"
                onClick={() => setActiveTab('orders')}
              />
              <SidebarButton
                active={activeTab === 'inventory'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Inventario Dual"
                onClick={() => setActiveTab('inventory')}
              />
              <SidebarButton
                active={activeTab === 'reports'}
                icon={<BarChart3 size={18} strokeWidth={2} />}
                label="Reportes Técnicos"
                onClick={() => setActiveTab('reports')}
              />
              <SidebarButton
                active={activeTab === 'users'}
                icon={<Users size={18} strokeWidth={2} />}
                label="Usuarios"
                onClick={() => setActiveTab('users')}
              />
              <SidebarButton
                active={activeTab === 'produccion'}
                icon={<Calendar size={18} strokeWidth={2} />}
                label="Producción"
                onClick={() => setActiveTab('produccion')}
              />
            </>
          )}

          {/* Vendedor Links */}
          {currentUser.role === 'VENDEDOR' && (
            <>
              <SidebarButton
                active={activeTab === 'orders'}
                icon={<ClipboardList size={18} strokeWidth={2} />}
                label="Ver Órdenes"
                onClick={() => setActiveTab('orders')}
              />
              <SidebarButton
                active={activeTab === 'new_order'}
                icon={<Plus size={18} strokeWidth={2} />}
                label="Nueva Cotización"
                onClick={() => { setActiveTab('new_order'); setFormError(null); setFormSuccess(null); }}
              />
            </>
          )}

          {/* Jefe Taller Links */}
          {currentUser.role === 'JEFE_TALLER' && (
            <>
              <SidebarButton
                active={activeTab === 'production'}
                icon={<Factory size={18} strokeWidth={2} />}
                label="Líneas de Fabricación"
                onClick={() => setActiveTab('production')}
              />
              <SidebarButton
                active={activeTab === 'inventory'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Stock Insumos"
                onClick={() => setActiveTab('inventory')}
              />
              <SidebarButton
                active={activeTab === 'produccion'}
                icon={<Calendar size={18} strokeWidth={2} />}
                label="Producción"
                onClick={() => setActiveTab('produccion')}
              />
            </>
          )}

          {/* Almacenero Links */}
          {currentUser.role === 'ALMACENERO' && (
            <>
              <SidebarButton
                active={activeTab === 'restock'}
                icon={<ShoppingCart size={18} strokeWidth={2} />}
                label="Ingresar Compra"
                onClick={() => { setActiveTab('restock'); setFormError(null); setFormSuccess(null); }}
              />
              <SidebarButton
                active={activeTab === 'materia_prima'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Materia Prima (CRUD)"
                onClick={() => setActiveTab('materia_prima')}
              />
              <SidebarButton
                active={activeTab === 'inventory'}
                icon={<PackageOpen size={18} strokeWidth={2} />}
                label="Inventario Dual"
                onClick={() => setActiveTab('inventory')}
              />
              <SidebarButton
                active={activeTab === 'kardex'}
                icon={<ListOrdered size={18} strokeWidth={2} />}
                label="Kardex de Movimientos"
                onClick={() => setActiveTab('kardex')}
              />
            </>
          )}
        </nav>

        {/* User Info & Logout */}
        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#FFFFFF'
            }}>
              {currentUser.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</p>
              <span style={{ fontSize: '0.725rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>{currentUser.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.7rem 0.875rem',
              borderRadius: '10px',
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FECACA';
              e.currentTarget.style.color = '#B91C1C';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#FEE2E2';
              e.currentTarget.style.color = '#DC2626';
            }}
          >
            <LogOut size={18} strokeWidth={2} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          gap: '1rem'
        }}>
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            style={{
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="Logo Factoría Sánchez" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>Factoría Sánchez</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Sistema de Gestión</span>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#1e293b' }}>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'orders' && 'Órdenes'}
                {activeTab === 'inventory' && 'Inventario Dual'}
                {activeTab === 'reports' && 'Reportes Técnicos'}
                {activeTab === 'users' && 'Usuarios'}
                {activeTab === 'new_order' && 'Nueva Cotización'}
                {activeTab === 'production' && 'Líneas de Fabricación'}
                {activeTab === 'produccion' && 'Producción y Seguimiento de Fabricación'}
                {activeTab === 'kardex' && 'Kardex de Movimientos'}
                {activeTab === 'restock' && 'Ingresar Compra'}
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                Bienvenido al sistema de gestión de Factoría Sánchez
              </p>
            </div>
          </header>

        {formError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span style={{ color: '#991b1b', fontWeight: 500 }}><strong>Error:</strong> {formError}</span>
          </div>
        )}
        {formSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            fontSize: '0.8rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
            <span style={{ color: '#166534', fontWeight: 500 }}><strong>Éxito:</strong> {formSuccess}</span>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                background: '#FFFFFF', 
                padding: '1.125rem 1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>Órdenes Totales</span>
                  <div style={{ 
                    background: 'rgba(79,70,229,0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '8px' 
                  }}>
                    <ClipboardList size={18} style={{ color: '#4F46E5' }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{orders.length}</p>
              </div>

              <div style={{ 
                background: '#FFFFFF', 
                padding: '1.125rem 1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>Ordenes Pendientes</span>
                  <div style={{ 
                    background: 'rgba(251,191,36,0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '8px' 
                  }}>
                    <AlertCircle size={18} style={{ color: '#F59E0B' }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{orders.filter(o => o.estado === 'PENDIENTE_PAGO').length}</p>
              </div>

              <div style={{ 
                background: '#FFFFFF', 
                padding: '1.125rem 1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>Productos en Inventario</span>
                  <div style={{ 
                    background: 'rgba(16,185,129,0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '8px' 
                  }}>
                    <PackageOpen size={18} style={{ color: '#10B981' }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{materials.length}</p>
              </div>

              <div style={{ 
                background: '#FFFFFF', 
                padding: '1.125rem 1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 500 }}>Usuarios Activos</span>
                  <div style={{ 
                    background: 'rgba(79,70,229,0.1)', 
                    padding: '0.5rem', 
                    borderRadius: '8px' 
                  }}>
                    <Users size={18} style={{ color: '#4F46E5' }} />
                  </div>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{users.length}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Estado de Órdenes</h3>
                <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Pendientes', value: orders.filter(o => o.estado === 'PENDIENTE_PAGO').length, color: '#F59E0B' },
                          { name: 'Aprobadas', value: orders.filter(o => o.estado === 'APROBADA').length, color: '#10B981' },
                          { name: 'En Producción', value: orders.filter(o => o.estado === 'EN_PRODUCCION').length, color: '#3B82F6' },
                          { name: 'Terminadas', value: orders.filter(o => o.estado === 'TERMINADA').length, color: '#6366F1' },
                          { name: 'Entregadas', value: orders.filter(o => o.estado === 'ENTREGADA').length, color: '#8B5CF6' }
                        ].filter(d => d.value > 0)} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {[
                          { name: 'Pendientes', value: orders.filter(o => o.estado === 'PENDIENTE_PAGO').length, color: '#F59E0B' },
                          { name: 'Aprobadas', value: orders.filter(o => o.estado === 'APROBADA').length, color: '#10B981' },
                          { name: 'En Producción', value: orders.filter(o => o.estado === 'EN_PRODUCCION').length, color: '#3B82F6' },
                          { name: 'Terminadas', value: orders.filter(o => o.estado === 'TERMINADA').length, color: '#6366F1' },
                          { name: 'Entregadas', value: orders.filter(o => o.estado === 'ENTREGADA').length, color: '#8B5CF6' }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Stock vs Mínimo</h3>
                <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer>
                    <BarChart data={materials.map(m => ({
                      name: m.nombre.length > 10 ? m.nombre.substring(0, 10) + '...' : m.nombre,
                      Stock: m.stockActual,
                      'Mínimo': m.stockMinimo
                    })).slice(0, 5)}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Stock" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Mínimo" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ 
              background: '#FFFFFF', 
              padding: '1.25rem', 
              borderRadius: '10px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
              border: '1px solid #E2E8F0'
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Órdenes Recientes</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 600 }}>Código</th>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 600 }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 600 }}>Estado</th>
                      <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 600 }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: '#1E293B', fontSize: '0.85rem' }}>Orden {order.codigoCorrelativoUnico}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#475569', fontSize: '0.85rem' }}>{order.clienteNombre}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: order.estado === 'APROBADA' ? '#DCFCE7' : 
                                       order.estado === 'TERMINADA' ? '#E0F2FE' :
                                       order.estado === 'ENTREGADA' ? '#FEF3C7' : '#FEE2E2',
                            color: order.estado === 'APROBADA' ? '#16A34A' :
                                       order.estado === 'TERMINADA' ? '#0369A1' :
                                       order.estado === 'ENTREGADA' ? '#B45309' : '#DC2626'
                          }}>
                            {order.estado === 'PENDIENTE_PAGO' && <AlertCircle size={12} />}
                            {order.estado === 'APROBADA' && <CheckCircle2 size={12} />}
                            {order.estado === 'TERMINADA' && <CheckCircle2 size={12} />}
                            {order.estado === 'ENTREGADA' && <Truck size={12} />}
                            {order.estado === 'CANCELADA' && <XCircle size={12} />}
                            {order.estado}
                          </span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>S/. {order.montoTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ 
            background: '#FFFFFF', 
            padding: '1.25rem', 
            borderRadius: '10px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: '0', fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>Lista de Usuarios</h3>
              <button 
                className="btn btnPrimary" 
                onClick={() => { setIsCreatingUser(!isCreatingUser); setEditingUserId(null); setUserForm({ name: '', email: '', password: '', role: 'VENDEDOR', image: '' }); }}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                {isCreatingUser ? 'Cerrar Formulario' : '+ Crear Usuario'}
              </button>
            </div>

            {isCreatingUser && (
              <form onSubmit={handleSaveUserSubmit} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>{editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="formGroup">
                    <label>Nombre</label>
                    <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                  </div>
                  <div className="formGroup">
                    <label>Correo Electrónico</label>
                    <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                  </div>
                  <div className="formGroup">
                    <label>{editingUserId ? 'Contraseña (Dejar en blanco para no cambiar)' : 'Contraseña'}</label>
                    <input type="password" required={!editingUserId} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                  </div>
                  <div className="formGroup">
                    <label>Rol</label>
                    <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                      <option value="VENDEDOR">VENDEDOR</option>
                      <option value="JEFE_TALLER">JEFE_TALLER</option>
                      <option value="ALMACENERO">ALMACENERO</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="formGroup" style={{ gridColumn: '1 / -1' }}>
                    <label>Foto de Perfil (Opcional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="file" accept="image/*" id="user-image" style={{ display: 'none' }} onChange={handleImageUpload} />
                      <label htmlFor="user-image" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Upload size={16} /> Subir Imagen
                      </label>
                      {userForm.image && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={userForm.image} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setUserForm({...userForm, image: ''})} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem' }}>Quitar</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btnPrimary">Guardar Usuario</button>
                </div>
              </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {users.map((user) => (
                <div key={user.email} style={{
                  padding: '1rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  background: '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => handleEditUserClick(user)}
                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.25rem' }}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    {user.id !== currentUser.id && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.25rem' }}>
                    {user.image ? (
                      <img src={user.image} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '0.95rem',
                        fontWeight: 700
                      }}>
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '1.5rem' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        background: 'rgba(79,70,229,0.1)',
                        color: '#4F46E5',
                        marginTop: '0.2rem'
                      }}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.775rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    {user.email}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="tabContent">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3>Historial de Órdenes de Fabricación</h3>
                {(currentUser.role === 'VENDEDOR' || currentUser.role === 'ADMIN') && (
                  <button className="btn btnPrimary" onClick={() => setActiveTab('new_order')}>+ Crear Cotización</button>
                )}
              </div>

              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Buscar por Código OC:</label>
                <input
                  type="text"
                  value={ocSearchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('OC-')) {
                      setOcSearchQuery(val);
                    } else if (val.length < 3) {
                      setOcSearchQuery('OC-');
                    } else {
                      const clean = val.replace('OC-', '');
                      setOcSearchQuery('OC-' + clean);
                    }
                  }}
                  placeholder="Ej. 26-00001"
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: '#FFFFFF',
                    color: '#000000',
                    fontWeight: 'bold',
                    width: '240px'
                  }}
                />
                {ocSearchQuery !== 'OC-' && (
                  <button
                    className="btn btnSecondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    onClick={() => setOcSearchQuery('OC-')}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="tableContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Cód. Correlativo</th>
                      <th>Código OC</th>
                      <th>Cliente</th>
                      <th>Cometido Entrega</th>
                      <th>Monto Total</th>
                      <th>Monto Abonado</th>
                      <th>Estado</th>
                      <th>Prioridad</th>
                      <th>Enlace Externo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No hay órdenes de fabricación registradas.</td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td><strong>{order.codigoCorrelativoUnico}</strong></td>
                          <td><code>{order.numeroOrdenCompra || '-'}</code></td>
                          <td>
                            {order.clienteNombre}
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.4rem' }}>
                              ({order.tipoCliente})
                            </span>
                          </td>
                          <td>{new Date(order.fechaComprometida).toLocaleDateString('es-PE')}</td>
                          <td>S/. {order.montoTotal}</td>
                          <td>S/. {order.montoAbonado}</td>
                          <td>
                            <span className={`badge ${order.estado === 'PENDIENTE_PAGO' ? 'badgePendiente' :
                              order.estado === 'APROBADA' ? 'badgeAprobada' :
                                order.estado === 'TERMINADA' ? 'badgeTerminada' :
                                  order.estado === 'ENTREGADA' ? 'badgeEntregada' : 'badgeCancelada'
                              }`}>
                              {order.estado}
                            </span>
                          </td>
                          <td>
                            {order.esUrgente ? (
                              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}>URGENTE</span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>Normal</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btnSecondary"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => handleLoadExternal(order.tokenConsulta)}
                            >
                              🔗 Compartir
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="btn btnSecondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                onClick={() => setSelectedOrder(order)}
                              >
                                Ver Ficha
                              </button>

                              {currentUser.role === 'VENDEDOR' && order.estado === 'PENDIENTE_PAGO' && (
                                <button
                                  className="btn btnSuccess"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                  onClick={() => setConfirmingPaymentOrderId(order.id)}
                                >
                                  Aprobar Pago
                                </button>
                              )}

                              {currentUser.role === 'VENDEDOR' && order.estado === 'TERMINADA' && (
                                <button
                                  className="btn btnPrimary"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                  onClick={() => handleStatusTransition(order.id, 'ENTREGADA')}
                                >
                                  Entregar
                                </button>
                              )}

                              {canCancelOrder(order) && (
                                <button
                                  className="btn btnDanger"
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                  onClick={() => handleStatusTransition(order.id, 'CANCELADA')}
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'new_order' && (
          <div className="tabContent">
            <div className="grid2">
              <div className="card">
                <h3>Cotización y Características Físicas</h3>
                <form onSubmit={handleCreateOrderSubmit} style={{ marginTop: '1.25rem' }}>
                  <div className="formRow">
                    <div className="formGroup">
                      <label>Nombre del Cliente</label>
                      <input
                        type="text"
                        value={orderForm.clienteNombre}
                        placeholder="Ej. Consorcio Damper"
                        onChange={(e) => handleFormChange('clienteNombre', e.target.value)}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Tipo de Cliente</label>
                      <select
                        value={orderForm.tipoCliente}
                        onChange={(e) => handleFormChange('tipoCliente', e.target.value)}
                      >
                        <option value="TIENDA">Cliente Tienda (Venta Directa)</option>
                        <option value="EMPRESA">Empresa Externa</option>
                      </select>
                    </div>
                  </div>

                  <div className="formGroup" style={{ marginBottom: '1rem' }}>
                    <label>Descripción del Producto (Medidas y Forma)</label>
                    <input
                      type="text"
                      value={orderForm.descripcionProducto || ''}
                      placeholder="Ej. Abrazadera forma cuadrada de 3/4 x 3 x 16 o Media redonda 1/2 x 2 x 10"
                      onChange={(e) => handleFormChange('descripcionProducto', e.target.value)}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label>Producto de Ficha Técnica</label>
                    <select
                      value={orderForm.productoId}
                      onChange={(e) => handleFormChange('productoId', e.target.value)}
                    >
                      <option value="">-- Seleccionar --</option>
                      {fichas.map((f) => (
                        <option key={f.id} value={f.id}>{f.nombre} ({f.codigo})</option>
                      ))}
                    </select>
                  </div>

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Calidad del Acero</label>
                      <select
                        value={orderForm.calidadAcero}
                        onChange={(e) => handleFormChange('calidadAcero', e.target.value)}
                      >
                        <option value="A36">A36 (Acero Dulce)</option>
                        <option value="1045">1045 (Medio Carbono)</option>
                        <option value="BCL">BCL (Muelle Especial)</option>
                        <option value="Fierro">Fierro Común</option>
                      </select>
                    </div>
                    <div className="formGroup">
                      <label>Cantidad Solicitada</label>
                      <input
                        type="number"
                        value={orderForm.cantidadSolicitada}
                        onChange={(e) => handleFormChange('cantidadSolicitada', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Color de Pintura (Opcional)</label>
                      <input
                        type="text"
                        value={orderForm.colorPintura}
                        onChange={(e) => handleFormChange('colorPintura', e.target.value)}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Tipo de Tuercas / Arandelas (Opcional)</label>
                      <input
                        type="text"
                        value={orderForm.tuercasTipo}
                        onChange={(e) => handleFormChange('tuercasTipo', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="formGroup">
                    <label>Fecha Prometida de Entrega</label>
                    <input
                      type="date"
                      value={orderForm.fechaComprometida}
                      onChange={(e) => handleFormChange('fechaComprometida', e.target.value)}
                    />
                  </div>

                  <div className="formRow" style={{ alignItems: 'center', margin: '0.5rem 0 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="urgente"
                        checked={orderForm.esUrgente}
                        onChange={(e) => handleFormChange('esUrgente', e.target.checked)}
                      />
                      <label htmlFor="urgente" style={{ color: orderForm.esUrgente ? 'var(--color-danger)' : 'inherit', cursor: 'pointer' }}>
                        💥 ¿Marcar como Pedido URGENTE?
                      </label>
                    </div>
                  </div>

                  {isWorkshopAtCapacity && orderForm.esUrgente && (
                    <div className="alertBanner" style={{ padding: '0.6rem', fontSize: '0.85rem' }}>
                      <span>⚠️ Taller al límite de capacidad. Se aplicará un 15% de recargo por concepto de horas extras automáticas.</span>
                    </div>
                  )}

                  <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Precio Total (S/.)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.montoTotal}
                        onChange={(e) => handleFormChange('montoTotal', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        style={{ fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Abono Inicial del Pago</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.montoAbonado}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, montoAbonado: e.target.value === '' ? '' : Number(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                  </div>

                  <button className="btn btnPrimary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Generar Órden de Fabricación
                  </button>
                </form>
              </div>

              <div className="card" style={{ alignSelf: 'start' }}>
                <h3>Ficha Técnica & Cálculo de Material</h3>
                {orderForm.productoId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Producto Seleccionado:</span>
                      <p style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', margin: '0.2rem 0', fontWeight: 'bold' }}>
                        {fichas.find(f => f.id === orderForm.productoId)?.nombre}
                      </p>
                    </div>

                    <div className="alertBanner alertBannerInfo" style={{ fontSize: '0.85rem', padding: '0.8rem', margin: 0 }}>
                      <span>📋 La orden será procesada mediante el código y registrado en el Kardex al aprobarse la orden.</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                    <span>Seleccione un producto para visualizar la ficha técnica.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'production' && (
          <div className="tabContent">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Organizador Diario de Fabricación</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Filtro: Ordenado por Urgencia</span>
            </div>

            <div className="kanbanBoard">
              {['PENDIENTE_PAGO', 'APROBADA', 'TERMINADA', 'ENTREGADA', 'CANCELADA'].map((status) => {
                const colOrders = orders
                  .filter(o => o.estado === status)
                  .sort((a, b) => new Date(a.fechaComprometida).getTime() - new Date(b.fechaComprometida).getTime());

                return (
                  <div key={status} className="kanbanColumn">
                    <div className="kanbanColHeader">
                      <span className="kanbanColTitle">{status}</span>
                      <span className="kanbanCount">{colOrders.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
                      {colOrders.map(o => (
                        <div key={o.id} className="kanbanCard" onClick={() => setSelectedOrder(o)}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Orden #{o.codigoCorrelativoUnico}</span>
                          <p style={{ fontSize: '0.85rem' }}>{o.clienteNombre}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'materia_prima' && (
          <div className="tabContent">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3>Gestión de Materia Prima</h3>
                <button 
                  className="btn btnPrimary" 
                  onClick={() => { setIsCreatingMP(!isCreatingMP); setEditingMPId(null); setMpForm({ codigo: '', nombre: '', tipo: 'VARILLA', diametro: '', espesor: '', stockActual: 0, stockMinimo: 0 }); }}
                >
                  {isCreatingMP ? 'Cancelar' : '+ Nueva Materia Prima'}
                </button>
              </div>

              {isCreatingMP && (
                <form onSubmit={handleSaveMPSubmit} style={{ background: 'rgba(79,70,229,0.03)', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid rgba(79,70,229,0.1)' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-primary)' }}>{editingMPId ? 'Editar Materia Prima' : 'Nueva Materia Prima'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="formGroup">
                      <label>Código Interno</label>
                      <input type="text" required value={mpForm.codigo} onChange={e => setMpForm({...mpForm, codigo: e.target.value})} placeholder="Ej: MAT-001" />
                    </div>
                    <div className="formGroup" style={{ gridColumn: 'span 2' }}>
                      <label>Nombre / Descripción</label>
                      <input type="text" required value={mpForm.nombre} onChange={e => setMpForm({...mpForm, nombre: e.target.value})} placeholder="Ej: Acero Inoxidable 304" />
                    </div>
                    <div className="formGroup">
                      <label>Stock Actual</label>
                      <input type="number" step="0.01" required value={mpForm.stockActual} onChange={e => setMpForm({...mpForm, stockActual: parseFloat(e.target.value) || 0})} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btnPrimary">{editingMPId ? 'Guardar Cambios' : 'Registrar Materia Prima'}</button>
                  </div>
                </form>
              )}

              <div className="tableContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Stock</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(mp => (
                      <tr key={mp.id}>
                        <td><code>{mp.codigo}</code></td>
                        <td>{mp.nombre}</td>
                        <td>{mp.stockActual}</td>
                        <td>
                          <button onClick={() => handleEditMPClick(mp)} className="btn btnSecondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}>Editar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="tabContent">
            <div className="card">
              <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setInventorySubTab('produccion')}
                  style={{
                    background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                    color: inventorySubTab === 'produccion' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  Insumos
                </button>
              </div>

              {inventorySubTab === 'produccion' && (
                <div className="tableContainer">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Stock Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((mat) => (
                        <tr key={mat.id}>
                          <td><code>{mat.codigo}</code></td>
                          <td>{mat.nombre}</td>
                          <td><strong>{mat.stockActual.toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'kardex' && (
          <div className="tabContent">
            <div className="card">
              <h3>Libro del Kardex</h3>
              <div className="tableContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Material</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kardex.map((kdx) => (
                      <tr key={kdx.id}>
                        <td>{new Date(kdx.creadoEn).toLocaleString('es-PE')}</td>
                        <td>{kdx.materiaPrima?.nombre}</td>
                        <td>{kdx.tipoMovimiento}</td>
                        <td>{kdx.cantidad}</td>
                        <td>{kdx.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'restock' && (
          <div className="tabContent">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3>Registrar Movimiento de Inventario</h3>
              <form onSubmit={handleRestockSubmit}>
                <div className="formGroup">
                  <label>Materia Prima</label>
                  <select
                    value={restockForm.materiaPrimaId}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, materiaPrimaId: e.target.value }))}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="formGroup">
                  <label>Tipo de Movimiento</label>
                  <select
                    value={restockForm.tipoMovimiento}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, tipoMovimiento: e.target.value }))}
                  >
                    <option value="INGRESO">Ingreso</option>
                    <option value="EGRESO">Egreso</option>
                  </select>
                </div>

                <div className="formGroup">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    value={restockForm.cantidad}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, cantidad: Number(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label>Motivo</label>
                  <input
                    type="text"
                    value={restockForm.motivo}
                    onChange={(e) => setRestockForm(prev => ({ ...prev, motivo: e.target.value }))}
                    required
                  />
                </div>

                <button className="btn btnPrimary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Registrar
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'reports' && reports && (
          <div className="tabContent">
            <div className="grid3" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <h3>Pendientes</h3>
                <p>{reports.pendingOrdersCount}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'produccion' && (
          <div className="tabContent">
            <div className="roleSelectorBar" style={{ marginBottom: '2rem' }}>
              <button
                onClick={() => setProductionActiveTab('calendario')}
                className={`roleBtn ${productionActiveTab === 'calendario' ? 'roleBtnActive' : ''}`}
              >
                Calendario
              </button>
              <button
                onClick={() => setProductionActiveTab('seguimiento')}
                className={`roleBtn ${productionActiveTab === 'seguimiento' ? 'roleBtnActive' : ''}`}
              >
                Seguimiento
              </button>
            </div>
            {productionActiveTab === 'calendario' ? (
              <CalendarioProduccion />
            ) : (
              <SeguimientoOrdenes />
            )}
          </div>
        )}

        {selectedOrder && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <h4>Ficha de Producción: Orden #{selectedOrder.codigoCorrelativoUnico}</h4>
                <button className="btn btnSecondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setSelectedOrder(null)}>✕ Cerrar</button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <p><strong>Cliente:</strong> {selectedOrder.clienteNombre} ({selectedOrder.tipoCliente}){selectedOrder.numeroOrdenCompra && ` [OC: ${selectedOrder.numeroOrdenCompra}]`}</p>
                  <p><strong>Fecha Comprometida:</strong> {new Date(selectedOrder.fechaComprometida).toLocaleDateString('es-PE')}</p>
                  <p><strong>Monto Facturado:</strong> S/. {selectedOrder.montoTotal} {selectedOrder.cargoUrgencia > 0 && `(Inc. recargo S/. ${selectedOrder.cargoUrgencia} por urgencia)`}</p>
                  <p><strong>Monto Abonado:</strong> S/. {selectedOrder.montoAbonado}</p>
                  {selectedOrder.montoTotal > 2000 && (
                    <p style={{ margin: '0.25rem 0 0.5rem 0' }}>
                      <strong>Clasificación:</strong>{' '}
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.4)', fontWeight: 'bold', fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        Bancario
                      </span>
                    </p>
                  )}
                  {selectedOrder.estado === 'PENDIENTE_PAGO' && (currentUser.role === 'VENDEDOR' || currentUser.role === 'ADMIN') && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="Agregar abono (S/.)"
                        value={adicionalAbono}
                        onChange={(e) => setAdicionalAbono(e.target.value)}
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '130px', background: 'white', color: 'black' }}
                      />
                      <button
                        className="btn btnSuccess"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => handleAddAbonoSubmit(selectedOrder.id)}
                      >
                        Agregar Abono
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <p><strong>Metodo Pago:</strong> {selectedOrder.metodoPago}</p>
                  <p><strong>Estado:</strong> <span className="badge badgeAprobada" style={{ padding: '0.1rem 0.4rem' }}>{selectedOrder.estado}</span></p>
                  <p><strong>Fecha Registro:</strong> {new Date(selectedOrder.creadoEn).toLocaleString()}</p>
                  <p><strong>Autorización de Salida:</strong> {selectedOrder.salidaAutorizada ? `✅ Autorizado por ${selectedOrder.salidaAutorizada.jefeTaller?.name}` : '❌ Pendiente Autorizar'}</p>
                </div>
              </div>

              {/* Physical specifications */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                <h5 style={{ marginBottom: '0.5rem' }}>Detalle de Producto</h5>
                {selectedOrder.detalles?.map((d: any) => (
                  <div key={d.id} style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <p><strong>Producto:</strong> {d.producto?.nombre}</p>
                    <p><strong>Cantidad:</strong> {d.cantidadSolicitada} unidades</p>
                    {d.descripcionProducto ? (
                      <p style={{ gridColumn: 'span 2' }}><strong>Descripción:</strong> {d.descripcionProducto}</p>
                    ) : (
                      <>
                        <p><strong>Largo:</strong> {d.largo} m</p>
                        <p><strong>Ancho:</strong> {d.ancho} m</p>
                        <p><strong>Espesor:</strong> {d.espesor} pulg/mm</p>
                      </>
                    )}
                    <p><strong>Calidad Acero:</strong> {d.calidadAcero}</p>
                    {d.colorPintura && <p><strong>Pintura:</strong> {d.colorPintura}</p>}
                    {d.tuercasTipo && <p><strong>Tuercas:</strong> {d.tuercasTipo}</p>}
                  </div>
                ))}
              </div>

              {/* Process line (RF-07) */}
              {selectedOrder.estado !== 'PENDIENTE_PAGO' && selectedOrder.procesos && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>Línea de Proceso y Operarios</h5>
                  <div className="progressList">
                    {selectedOrder.procesos.map((stage: any) => {
                      const isJefe = currentUser.role === 'JEFE_TALLER' || currentUser.role === 'ADMIN';
                      return (
                        <div key={stage.id} className={`progressItem ${stage.completada ? 'progressItemDone' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={getStageDotClass(stage)} />
                            <span><strong>{stage.etapaNombre}</strong> (Paso {stage.ordenSecuencia})</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {stage.completada ? (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                Realizado por: <strong>{stage.operarioAsignado || 'Operario'}</strong>
                              </span>
                            ) : isJefe ? (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <input
                                  type="text"
                                  placeholder="Operario"
                                  value={stageOperario[stage.id] || stage.operarioAsignado || ''}
                                  onChange={(e) => setStageOperario(prev => ({ ...prev, [stage.id]: e.target.value }))}
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: '100px', background: 'white', color: 'black' }}
                                />
                                <button
                                  className="btn btnSuccess"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => handleUpdateStage(stage.id, selectedOrder, true)}
                                >
                                  Listo
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Pendiente</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modify Order Form (RF-03: Vendedor or Jefe) */}
              {(currentUser.role === 'VENDEDOR' || currentUser.role === 'JEFE_TALLER') && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>Modificar Parámetros de Orden</h5>
                  <div className="formRow" style={{ gap: '0.5rem' }}>
                    <div className="formGroup" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Color Pintura</label>
                      <input
                        type="text"
                        id="modColor"
                        defaultValue={selectedOrder.detalles?.[0]?.colorPintura || ''}
                        style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div className="formGroup" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Tuercas/Accesorios</label>
                      <input
                        type="text"
                        id="modNuts"
                        defaultValue={selectedOrder.detalles?.[0]?.tuercasTipo || ''}
                        style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div className="formGroup" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Fecha Entrega</label>
                      <input
                        type="date"
                        id="modDate"
                        defaultValue={selectedOrder.fechaComprometida ? selectedOrder.fechaComprometida.substring(0, 10) : ''}
                        style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btnSecondary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => {
                      const colorEl = document.getElementById('modColor') as HTMLInputElement;
                      const nutsEl = document.getElementById('modNuts') as HTMLInputElement;
                      const dateEl = document.getElementById('modDate') as HTMLInputElement;
                      handleModifyOrder(selectedOrder.id, colorEl.value, nutsEl.value, dateEl.value);
                    }}
                  >
                    Guardar Cambios
                  </button>
                </div>
              )}

              {/* Physical release authorization triggers (RF-15) */}
              {currentUser.role === 'JEFE_TALLER' && selectedOrder.estado === 'APROBADA' && !selectedOrder.salidaAutorizada && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong>Autorizar Salida del Almacén</strong>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Firma la entrega de varillas/insumos al taller de metalúrgica.</p>
                  </div>
                  <button className="btn btnSuccess" onClick={() => handleAuthorizeRelease(selectedOrder.id)}>
                    ✍️ Autorizar Salida
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeExternalToken && externalOrderData && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5,8,16,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--color-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <h4>Consulta de Estado Externa</h4>
                <button className="btn btnSecondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setActiveExternalToken(null); setExternalOrderData(null); }}>✕ Salir</button>
              </div>

              <h3>{externalOrderData.clienteNombre}</h3>
              <p>Orden #{externalOrderData.codigoCorrelativoUnico}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {externalOrderData.detalles?.map((d: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <p style={{ fontWeight: 'bold', color: 'white' }}>{d.cantidadSolicitada}x {d.productoNombre}</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                      {d.descripcionProducto ? `Descripción: ${d.descripcionProducto}` : `Especificaciones: Largo ${d.largo}m, Ancho ${d.ancho}m, Espesor ${d.espesor}mm, Estructura: ${d.forma}`}
                    </p>
                  </div>
                ))}
              </div>
              <h5 style={{ marginBottom: '0.5rem' }}>Avance de la Fabricación en Taller</h5>
              <div className="progressList">
                {externalOrderData.procesos?.length > 0 ? (
                  externalOrderData.procesos.map((stage: any, idx: number) => (
                    <div key={idx} className={`progressItem ${stage.completada ? 'progressItemDone' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={stage.completada ? 'progressDot progressDotDone' : 'progressDot'} />
                        <span>{stage.etapaNombre}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {stage.completada ? `Completada el ${new Date(stage.fechaCompletada).toLocaleDateString()}` : 'Pendiente en línea'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Esperando aprobación para iniciar el flujo de fabricación (Corte ➡️ Roscado ➡️ Doblado ➡️ Pintura).</p>
                )}
              </div>
            </div>
          </div>
        )}
        {confirmingPaymentOrderId && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100, padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'white' }}>Confirmar Pago Total</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                ¿Está seguro de que va a pagar la totalidad de la orden?
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  className="btn btnSuccess"
                  onClick={() => {
                    handleStatusTransition(confirmingPaymentOrderId, 'APROBADA');
                    setConfirmingPaymentOrderId(null);
                  }}
                >
                  SÍ
                </button>
                <button
                  className="btn btnSecondary"
                  onClick={() => setConfirmingPaymentOrderId(null)}
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        )}
        </div> {/* Close content area div */}
      </main>
    </div>
  );
}

```

## src/app/providers.tsx

```ts
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

```

## .env

```bash
# Archivo .env existe, valores reales omitidos por seguridad.
```

## next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

## package.json

```json
{
  "name": "metal-prod-system",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.11.2",
    "@prisma/client": "^6.19.3",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "lucide-react": "^1.24.0",
    "next": "16.2.10",
    "next-auth": "^5.0.0-beta.31",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.9.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.10",
    "prisma": "^6.19.3",
    "ts-node": "^10.9.2",
    "typescript": "^5"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}

```

## prisma/tsconfig.json

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ESNext",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "moduleResolution": "node"
  }
}

```

## test-db.js

```js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS IN DB:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());

```

## test-endpoints.js

```js
const BASE_URL = 'http://localhost:3000';

// Helper to log in and get the auth_token cookie
async function loginAndGetCookie(email, password) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Login failed for ${email}: ${err.error}`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`No Set-Cookie header returned for ${email}`);
  }

  const token = setCookie.split(';')[0];
  return token;
}

async function testSuite() {
  console.log('🏁 Starting Programmatic Verification Suite with Simplified Specs and Manual Kardex...');

  try {
    // 1. Programmatically log in to get session cookies for all roles
    console.log('\nLogging in for all roles...');
    
    const vendedorCookie = await loginAndGetCookie('vendedor@metal.com', 'vendedor123');
    console.log('✅ Logged in as VENDEDOR (Laura)');

    const almaceneroCookie = await loginAndGetCookie('almacenero@metal.com', 'almacenero123');
    console.log('✅ Logged in as ALMACENERO (Juan)');

    const jefeCookie = await loginAndGetCookie('jefe@metal.com', 'jefe123');
    console.log('✅ Logged in as JEFE_TALLER (Manuel)');

    const adminCookie = await loginAndGetCookie('admin@metal.com', 'admin123');
    console.log('✅ Logged in as ADMIN (Carlos)');

    // Headers with Cookie auth for each role
    const sellerHeaders = {
      'Content-Type': 'application/json',
      'Cookie': vendedorCookie
    };

    const almaceneroHeaders = {
      'Content-Type': 'application/json',
      'Cookie': almaceneroCookie
    };

    const jefeHeaders = {
      'Content-Type': 'application/json',
      'Cookie': jefeCookie
    };

    const adminHeaders = {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    };

    // ----------------------------------------------------
    // START TEST SUITE WORKFLOW
    // ----------------------------------------------------

    // 1. Check current inventory stock levels
    console.log('\nStep 1: Fetching initial inventory...');
    const invRes = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    if (!invRes.ok) {
      const errText = await invRes.text();
      throw new Error(`Failed to fetch inventory: ${invRes.status} - ${errText}`);
    }
    const { materials, fichas } = await invRes.json();
    
    const varilla58 = materials.find(m => m.codigo === 'MP-VAR-58');
    const initialStock = varilla58 ? varilla58.stockActual : 0;
    console.log(`✅ Success. Initial Varilla 5/8" stock: ${initialStock}`);

    const uboltFicha = fichas.find(f => f.codigo === 'PROD-UBOLT-58');
    if (!uboltFicha) throw new Error('Ficha PROD-UBOLT-58 not found');

    // 2. Create an order for Consorcio Damper (corporate exempt client, with Purchase Order OC)
    console.log('\nStep 2: Creating a new corporate order with Purchase Order (OC-9842)...');
    const orderPayload = {
      clienteNombre: 'Consorcio Damper',
      tipoCliente: 'EMPRESA',
      fechaComprometida: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      montoTotal: 600,
      montoAbonado: 0, // Exempt from 50% abono!
      metodoPago: 'TRANSFERENCIA_BANCARIA',
      esUrgente: false,
      numeroOrdenCompra: 'OC-2026-9842', // Mandatory for corporate OC client
      detalles: [{
        productoId: uboltFicha.id,
        descripcionProducto: 'Abrazadera forma cuadrada de 3/4 x 3 x 16', // Point 1: Single description field
        calidadAcero: 'A36',
        colorPintura: 'Azul Epóxico',
        tuercasTipo: 'Tuerca Rápida 5/8',
        cantidadSolicitada: 20
      }]
    };

    const createRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: sellerHeaders,
      body: JSON.stringify(orderPayload)
    });
    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(`Failed to create order: ${err.error}`);
    }
    const order = await createRes.json();
    console.log(`✅ Success. Order #${order.codigoCorrelativoUnico} created. ID: ${order.id}. Estado: ${order.estado}`);
    
    if (order.estado !== 'APROBADA') {
      throw new Error(`Assertion failed: Order state is ${order.estado}, expected APROBADA (exemption approved)`);
    }

    if (!order.numeroOrdenCompra || !/^OC-\d{2}-\d{5}$/.test(order.numeroOrdenCompra)) {
      throw new Error(`Assertion failed: Order OC is "${order.numeroOrdenCompra}", expected strict format OC-YY-NNNNN (e.g. OC-26-00001)`);
    }
    console.log(`✅ Assertion passed: Strict OC format verified: ${order.numeroOrdenCompra}`);
    console.log('✅ Assertion passed: Corporate Order with Purchase Order is auto-approved with S/. 0 deposit.');

    // 3. Verify stock is NOT automatically deducted on order approval (Point 2: Discard rigid auto-egress)
    console.log('\nStep 3: Checking that inventory stock was NOT automatically deducted...');
    const invRes2 = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    const invData2 = await invRes2.json();
    const varilla58After = invData2.materials.find(m => m.codigo === 'MP-VAR-58');
    const afterStock = varilla58After ? varilla58After.stockActual : 0;
    console.log(`✅ Success. Varilla 5/8" stock after approval: ${afterStock}`);
    
    if (afterStock !== initialStock) {
      throw new Error(`Assertion failed: Stock is ${afterStock}, expected it to remain unchanged at ${initialStock}`);
    }
    console.log('✅ Assertion passed: Auto stock deduction is disabled.');

    // 4. Register a manual consumption (EGRESO) of 28.0 meters by the Almacenero (Point 2: Flexible manual movements)
    console.log('\nStep 4: Registering a manual material consumption (EGRESO) of 28.0 meters...');
    const egressRes = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: almaceneroHeaders,
      body: JSON.stringify({
        materiaPrimaId: varilla58After.id,
        cantidad: 28.0,
        tipoMovimiento: 'EGRESO',
        motivo: `Consumo para la fabricación de la Orden #${order.codigoCorrelativoUnico}`
      })
    });
    if (!egressRes.ok) {
      const err = await egressRes.json();
      throw new Error(`Failed to register manual egress: ${err.error}`);
    }
    console.log('✅ Success. Manual egress consumption logged.');

    // 5. Verify stock deduction after manual egress
    console.log('\nStep 5: Verifying stock deduction after manual egress...');
    const invRes3 = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    const invData3 = await invRes3.json();
    const varilla58Egress = invData3.materials.find(m => m.codigo === 'MP-VAR-58');
    const stockAfterEgress = varilla58Egress ? varilla58Egress.stockActual : 0;
    console.log(`✅ Success. Varilla 5/8" stock after egress: ${stockAfterEgress}`);
    
    const expectedStock = initialStock - 28.0;
    if (stockAfterEgress !== expectedStock) {
      throw new Error(`Assertion failed: Stock is ${stockAfterEgress}, expected ${expectedStock}`);
    }
    console.log('✅ Assertion passed: Material stock correctly updated via manual egress.');

    // 6. Verify Kardex log contains manual egress entry
    console.log('\nStep 6: Verifying manual Kardex entry...');
    const kdxEntry = invData3.kardex.find(k => k.tipoMovimiento === 'EGRESO' && k.motivo.includes(`Orden #${order.codigoCorrelativoUnico}`));
    if (!kdxEntry) {
      throw new Error('Kardex log manual entry not found');
    }
    console.log(`✅ Success. Found manual Kardex entry: [${kdxEntry.tipoMovimiento}] - Cantidad: ${kdxEntry.cantidad} - Motivo: ${kdxEntry.motivo}`);

    // 7. Restock Varilla 5/8" with 100 units from distributor Ansec (Almacenero manual refill)
    console.log('\nStep 7: Restocking Varilla 5/8" with 100 units manually...');
    const restockRes = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: almaceneroHeaders,
      body: JSON.stringify({
        materiaPrimaId: varilla58After.id,
        cantidad: 100,
        tipoMovimiento: 'INGRESO',
        motivo: 'Ingreso por reabastecimiento mensual. Distribuidor Ansec'
      })
    });
    if (!restockRes.ok) throw new Error('Restock failed');
    console.log('✅ Success. Refill completed.');

    // 8. Verify inventory stock increased by 100
    console.log('\nStep 8: Checking inventory stock increase...');
    const invRes4 = await fetch(`${BASE_URL}/api/inventory`, { headers: almaceneroHeaders });
    const invData4 = await invRes4.json();
    const varilla58Final = invData4.materials.find(m => m.codigo === 'MP-VAR-58');
    const finalStock = varilla58Final ? varilla58Final.stockActual : 0;
    console.log(`✅ Success. Varilla 5/8" final stock: ${finalStock}`);
    if (finalStock !== (stockAfterEgress + 100)) {
      throw new Error(`Assertion failed: Final stock is ${finalStock}, expected ${stockAfterEgress + 100}`);
    }
    console.log('✅ Assertion passed: Stock correctly increased by 100 units.');

    // 9. Authorize material exit (Jefe de Taller)
    console.log('\nStep 9: Authorizing material release physical exit...');
    const authRes = await fetch(`${BASE_URL}/api/inventory/authorize`, {
      method: 'POST',
      headers: jefeHeaders,
      body: JSON.stringify({ ordenId: order.id })
    });
    if (!authRes.ok) {
      const err = await authRes.json();
      throw new Error(`Authorization failed: ${err.error}`);
    }
    console.log('✅ Success. Material exit release authorized.');

    console.log('\n🎉 ALL VERIFICATION PASSED SUCCESSFULLY! The application with manual Kardex and OC rules works 100% correctly.');

  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

testSuite();

```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```

## .gitignore

```gitignore
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
db.json

```

## MEMORIA_DESCRIPTIVA.md

```md
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

```

## next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

## package-lock.json

```json
{
  "name": "metal-prod-system",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "metal-prod-system",
      "version": "0.1.0",
      "dependencies": {
        "@auth/prisma-adapter": "^2.11.2",
        "@prisma/client": "^6.19.3",
        "bcryptjs": "^3.0.3",
        "jsonwebtoken": "^9.0.3",
        "lucide-react": "^1.24.0",
        "next": "16.2.10",
        "next-auth": "^5.0.0-beta.31",
        "react": "19.2.4",
        "react-dom": "19.2.4",
        "recharts": "^3.9.2"
      },
      "devDependencies": {
        "@types/bcryptjs": "^2.4.6",
        "@types/jsonwebtoken": "^9.0.10",
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "eslint": "^9",
        "eslint-config-next": "16.2.10",
        "prisma": "^6.19.3",
        "ts-node": "^10.9.2",
        "typescript": "^5"
      }
    },
    "node_modules/@auth/core": {
      "version": "0.41.2",
      "resolved": "https://registry.npmjs.org/@auth/core/-/core-0.41.2.tgz",
      "integrity": "sha512-Hx5MNBxN2fJTbJKGUKAA0wca43D0Akl3TvufY54Gn8lop7F+34vU1zA1pn0vQfIoVuLIrpfc2nkyjwIaPJMW7w==",
      "license": "ISC",
      "dependencies": {
        "@panva/hkdf": "^1.2.1",
        "jose": "^6.0.6",
        "oauth4webapi": "^3.3.0",
        "preact": "10.24.3",
        "preact-render-to-string": "6.5.11"
      },
      "peerDependencies": {
        "@simplewebauthn/browser": "^9.0.1",
        "@simplewebauthn/server": "^9.0.2",
        "nodemailer": "^7.0.7"
      },
      "peerDependenciesMeta": {
        "@simplewebauthn/browser": {
          "optional": true
        },
        "@simplewebauthn/server": {
          "optional": true
        },
        "nodemailer": {
          "optional": true
        }
      }
    },
    "node_modules/@auth/prisma-adapter": {
      "version": "2.11.2",
      "resolved": "https://registry.npmjs.org/@auth/prisma-adapter/-/prisma-adapter-2.11.2.tgz",
      "integrity": "sha512-GyNEUNtrPgDPs0M4xX6F5i7jTsCKwU6BXV9zutctcoo6K1Ud+juckrmQS11uyNgeWsw6sliextHbU/e+8lsizQ==",
      "license": "ISC",
      "dependencies": {
        "@auth/core": "0.41.2"
      },
      "peerDependencies": {
        "@prisma/client": ">=2.26.0 || >=3 || >=4 || >=5 || >=6"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.7.tgz",
      "integrity": "sha512-locTkQyKvwIEgBzVrn8693ebc97F2U8ZHjbXwDXJ5Fn2TCpNwTlKcaKLkdHop5c/icOFE7qt7Q9JC5hnKNa6Gg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.7.tgz",
      "integrity": "sha512-RgHBCvtjbOK2gXSNBNIkNoEc9qoVEtau3hj8gEqKQuL3HZAibKarWFEI3Lfm6EYKkLalOh8eSrj9b+ch9H/VBA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.7",
        "@babel/helper-compilation-targets": "^7.29.7",
        "@babel/helper-module-transforms": "^7.29.7",
        "@babel/helpers": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/template": "^7.29.7",
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.7.tgz",
      "integrity": "sha512-DkXD5OJQaAQIdZ1bt3UZdEnHAn9Imd3IVBdX03UFe+ony9Ojw5pzr9YVKGDY1jt+Gcn/FnGkNf8r+Vj5NOJWtQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.29.7.tgz",
      "integrity": "sha512-wem6WaBj4NaVYVdNhLPPVacES6ZJ+KBBfSkTMD3YZxbP3rm3Di85tJU5ljaUNhaOynt+Aj0xruhYuzQBt8n71g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.29.7",
        "@babel/helper-validator-option": "^7.29.7",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-globals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.29.7.tgz",
      "integrity": "sha512-ejHwrQQYcm9xnTivShn2IDOlIzInN34AXskvq9QicvCtEzq1Vzclu/tKF8Jq1Cg8JG2GL6/EmjgsCT7lXepE3g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-transforms": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.29.7.tgz",
      "integrity": "sha512-UPUVSyXbOh627KiCIGQSgwWzGeBKLkaJ9PJEdrngIwMSzxLR4jS4+f1f1jb7VzBbg8nFLaYotvVPFCTqdrmTAg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.29.7.tgz",
      "integrity": "sha512-N9ZErrD+yW5geCDtBqnOoxmR8+tNKiGuxKlDpuJxfsqpa2dFcexaziGAE/qoHLiDDreVNMupxGmSoNlyvsA3gw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helpers": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.29.7.tgz",
      "integrity": "sha512-1k2lAGRMfHTcwuNYcCNUmaUffmQv8KWMfh2iJUUeRlwlwH4FdNG7mfPI10NPfLHJFThE4Tyr4mv7kTNZOiPuBg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.7.tgz",
      "integrity": "sha512-hnORnjP/1P/zFEndoeX+n+t1RwWRJiJpM/jO7FW32Kn9r5+sJB2JWOdYo4L6k78j15eCwY3Gm/7364B1EMwtNg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.7"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/template": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.7.tgz",
      "integrity": "sha512-EhlfNQtZ+NK22w5BM61ciuiq1m58ed33Wr1Xan//ZRTy6hgjnwyCffRYwzsGXdASJSUJ1guZILsErh1eQcl+zw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.7",
        "@babel/helper-globals": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.7",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.7.tgz",
      "integrity": "sha512-4zBIxpPzowiZpusoFkyGVwakdRJUyuH5PxQ/PrqghfdFWWasvnCdPfQXHrenDai+gyLARulZjZowCOj6fjT4pA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@cspotcode/source-map-support": {
      "version": "0.8.1",
      "resolved": "https://registry.npmjs.org/@cspotcode/source-map-support/-/source-map-support-0.8.1.tgz",
      "integrity": "sha512-IchNf6dN4tHoMFIn/7OE8LWZ19Y6q/67Bmf6vnGREv8RSbBVb9LPJxEcnwrcwX6ixSvaiGoomAUvu4YSxXrVgw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/trace-mapping": "0.3.9"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@cspotcode/source-map-support/node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.9",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.9.tgz",
      "integrity": "sha512-3Belt6tdc8bPgAtbcmdtNJlirVoTmEb5e2gC94PnkwEW9jI6CAHUeoG85tjWP5WquqfavoMtMwiG4P926ZKKuQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.0.3",
        "@jridgewell/sourcemap-codec": "^1.4.10"
      }
    },
    "node_modules/@emnapi/core": {
      "version": "1.10.0",
      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.10.0.tgz",
      "integrity": "sha512-yq6OkJ4p82CAfPl0u9mQebQHKPJkY7WrIuk205cTYnYe+k2Z8YBh11FrbRG/H6ihirqcacOgl2BIO8oyMQLeXw==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/wasi-threads": "1.2.1",
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/runtime": {
      "version": "1.11.2",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.11.2.tgz",
      "integrity": "sha512-kyOl3X0DuTiT1h2ft8r2fYO8JYtU9a9Xis/zBSiGArNaagCOWx90N1k2wxp18czFDH+OgcWGb5ZP/XMt3dcyPA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/wasi-threads": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.1.tgz",
      "integrity": "sha512-uTII7OYF+/Mes/MrcIOYp5yOtSMLBWSIoLPpcgwipoiKbli6k322tcoFsxoIIxPDqW01SQGAgko4EzZi2BNv2w==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@eslint-community/eslint-utils": {
      "version": "4.9.1",
      "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.9.1.tgz",
      "integrity": "sha512-phrYmNiYppR7znFEdqgfWHXR6NCkZEK7hwWDHZUjit/2/U0r6XvkDl0SYnoM51Hq7FhCGdLDT6zxCCOY1hexsQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "eslint-visitor-keys": "^3.4.3"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      },
      "peerDependencies": {
        "eslint": "^6.0.0 || ^7.0.0 || >=8.0.0"
      }
    },
    "node_modules/@eslint-community/eslint-utils/node_modules/eslint-visitor-keys": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz",
      "integrity": "sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint-community/regexpp": {
      "version": "4.12.2",
      "resolved": "https://registry.npmjs.org/@eslint-community/regexpp/-/regexpp-4.12.2.tgz",
      "integrity": "sha512-EriSTlt5OC9/7SXkRSCAhfSxxoSUgBm33OH+IkwbdpgoqsSsUg7y3uh+IICI/Qg4BBWr3U2i39RpmycbxMq4ew==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^12.0.0 || ^14.0.0 || >=16.0.0"
      }
    },
    "node_modules/@eslint/config-array": {
      "version": "0.21.2",
      "resolved": "https://registry.npmjs.org/@eslint/config-array/-/config-array-0.21.2.tgz",
      "integrity": "sha512-nJl2KGTlrf9GjLimgIru+V/mzgSK0ABCDQRvxw5BjURL7WfH5uoWmizbH7QB6MmnMBd8cIC9uceWnezL1VZWWw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/object-schema": "^2.1.7",
        "debug": "^4.3.1",
        "minimatch": "^3.1.5"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/config-helpers": {
      "version": "0.4.2",
      "resolved": "https://registry.npmjs.org/@eslint/config-helpers/-/config-helpers-0.4.2.tgz",
      "integrity": "sha512-gBrxN88gOIf3R7ja5K9slwNayVcZgK6SOUORm2uBzTeIEfeVaIhOpCtTox3P6R7o2jLFwLFTLnC7kU/RGcYEgw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/core": "^0.17.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/core": {
      "version": "0.17.0",
      "resolved": "https://registry.npmjs.org/@eslint/core/-/core-0.17.0.tgz",
      "integrity": "sha512-yL/sLrpmtDaFEiUj1osRP4TI2MDz1AddJL+jZ7KSqvBuliN4xqYY54IfdN8qD8Toa6g1iloph1fxQNkjOxrrpQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@types/json-schema": "^7.0.15"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/eslintrc": {
      "version": "3.3.5",
      "resolved": "https://registry.npmjs.org/@eslint/eslintrc/-/eslintrc-3.3.5.tgz",
      "integrity": "sha512-4IlJx0X0qftVsN5E+/vGujTRIFtwuLbNsVUe7TO6zYPDR1O6nFwvwhIKEKSrl6dZchmYBITazxKoUYOjdtjlRg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ajv": "^6.14.0",
        "debug": "^4.3.2",
        "espree": "^10.0.1",
        "globals": "^14.0.0",
        "ignore": "^5.2.0",
        "import-fresh": "^3.2.1",
        "js-yaml": "^4.1.1",
        "minimatch": "^3.1.5",
        "strip-json-comments": "^3.1.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint/js": {
      "version": "9.39.4",
      "resolved": "https://registry.npmjs.org/@eslint/js/-/js-9.39.4.tgz",
      "integrity": "sha512-nE7DEIchvtiFTwBw4Lfbu59PG+kCofhjsKaCWzxTpt4lfRjRMqG6uMBzKXuEcyXhOHoUp9riAm7/aWYGhXZ9cw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://eslint.org/donate"
      }
    },
    "node_modules/@eslint/object-schema": {
      "version": "2.1.7",
      "resolved": "https://registry.npmjs.org/@eslint/object-schema/-/object-schema-2.1.7.tgz",
      "integrity": "sha512-VtAOaymWVfZcmZbp6E2mympDIHvyjXs/12LqWYjVw6qjrfF+VK+fyG33kChz3nnK+SU5/NeHOqrTEHS8sXO3OA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/plugin-kit": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/@eslint/plugin-kit/-/plugin-kit-0.4.1.tgz",
      "integrity": "sha512-43/qtrDUokr7LJqoF2c3+RInu/t4zfrpYdoSDfYyhg52rwLV6TnOvdG4fXm7IkSB3wErkcmJS9iEhjVtOSEjjA==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/core": "^0.17.0",
        "levn": "^0.4.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@humanfs/core": {
      "version": "0.19.2",
      "resolved": "https://registry.npmjs.org/@humanfs/core/-/core-0.19.2.tgz",
      "integrity": "sha512-UhXNm+CFMWcbChXywFwkmhqjs3PRCmcSa/hfBgLIb7oQ5HNb1wS0icWsGtSAUNgefHeI+eBrA8I1fxmbHsGdvA==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@humanfs/types": "^0.15.0"
      },
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanfs/node": {
      "version": "0.16.8",
      "resolved": "https://registry.npmjs.org/@humanfs/node/-/node-0.16.8.tgz",
      "integrity": "sha512-gE1eQNZ3R++kTzFUpdGlpmy8kDZD/MLyHqDwqjkVQI0JMdI1D51sy1H958PNXYkM2rAac7e5/CnIKZrHtPh3BQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@humanfs/core": "^0.19.2",
        "@humanfs/types": "^0.15.0",
        "@humanwhocodes/retry": "^0.4.0"
      },
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanfs/types": {
      "version": "0.15.0",
      "resolved": "https://registry.npmjs.org/@humanfs/types/-/types-0.15.0.tgz",
      "integrity": "sha512-ZZ1w0aoQkwuUuC7Yf+7sdeaNfqQiiLcSRbfI08oAxqLtpXQr9AIVX7Ay7HLDuiLYAaFPu8oBYNq/QIi9URHJ3Q==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanwhocodes/module-importer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.22"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@humanwhocodes/retry": {
      "version": "0.4.3",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/retry/-/retry-0.4.3.tgz",
      "integrity": "sha512-bV0Tgo9K4hfPCek+aMAn81RppFKv2ySDQeMoSZuvTASywNTnVJCArCZE2FWqpvIatKu7VMRLWlR1EazvVhDyhQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@img/colour": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/colour/-/colour-1.1.0.tgz",
      "integrity": "sha512-Td76q7j57o/tLVdgS746cYARfSyxk8iEfRxewL9h4OMzYhbW4TAcppl0mT4eyqXddh6L/jwoM75mo7ixa/pCeQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@img/sharp-darwin-arm64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-darwin-arm64/-/sharp-darwin-arm64-0.34.5.tgz",
      "integrity": "sha512-imtQ3WMJXbMY4fxb/Ndp6HBTNVtWCUI0WdobyheGf5+ad6xX8VIDO8u2xE4qc/fr08CKG/7dDseFtn6M6g/r3w==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-darwin-arm64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-darwin-x64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-darwin-x64/-/sharp-darwin-x64-0.34.5.tgz",
      "integrity": "sha512-YNEFAF/4KQ/PeW0N+r+aVVsoIY0/qxxikF2SWdp+NRkmMB7y9LBZAVqQ4yhGCm/H3H270OSykqmQMKLBhBJDEw==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-darwin-x64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-libvips-darwin-arm64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-darwin-arm64/-/sharp-libvips-darwin-arm64-1.2.4.tgz",
      "integrity": "sha512-zqjjo7RatFfFoP0MkQ51jfuFZBnVE2pRiaydKJ1G/rHZvnsrHAOcQALIi9sA5co5xenQdTugCvtb1cuf78Vf4g==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "darwin"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-darwin-x64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-darwin-x64/-/sharp-libvips-darwin-x64-1.2.4.tgz",
      "integrity": "sha512-1IOd5xfVhlGwX+zXv2N93k0yMONvUlANylbJw1eTah8K/Jtpi15KC+WSiaX/nBmbm2HxRM1gZ0nSdjSsrZbGKg==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "darwin"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-arm": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-arm/-/sharp-libvips-linux-arm-1.2.4.tgz",
      "integrity": "sha512-bFI7xcKFELdiNCVov8e44Ia4u2byA+l3XtsAj+Q8tfCwO6BQ8iDojYdvoPMqsKDkuoOo+X6HZA0s0q11ANMQ8A==",
      "cpu": [
        "arm"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-arm64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-arm64/-/sharp-libvips-linux-arm64-1.2.4.tgz",
      "integrity": "sha512-excjX8DfsIcJ10x1Kzr4RcWe1edC9PquDRRPx3YVCvQv+U5p7Yin2s32ftzikXojb1PIFc/9Mt28/y+iRklkrw==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-ppc64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-ppc64/-/sharp-libvips-linux-ppc64-1.2.4.tgz",
      "integrity": "sha512-FMuvGijLDYG6lW+b/UvyilUWu5Ayu+3r2d1S8notiGCIyYU/76eig1UfMmkZ7vwgOrzKzlQbFSuQfgm7GYUPpA==",
      "cpu": [
        "ppc64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-riscv64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-riscv64/-/sharp-libvips-linux-riscv64-1.2.4.tgz",
      "integrity": "sha512-oVDbcR4zUC0ce82teubSm+x6ETixtKZBh/qbREIOcI3cULzDyb18Sr/Wcyx7NRQeQzOiHTNbZFF1UwPS2scyGA==",
      "cpu": [
        "riscv64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-s390x": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-s390x/-/sharp-libvips-linux-s390x-1.2.4.tgz",
      "integrity": "sha512-qmp9VrzgPgMoGZyPvrQHqk02uyjA0/QrTO26Tqk6l4ZV0MPWIW6LTkqOIov+J1yEu7MbFQaDpwdwJKhbJvuRxQ==",
      "cpu": [
        "s390x"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-x64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-x64/-/sharp-libvips-linux-x64-1.2.4.tgz",
      "integrity": "sha512-tJxiiLsmHc9Ax1bz3oaOYBURTXGIRDODBqhveVHonrHJ9/+k89qbLl0bcJns+e4t4rvaNBxaEZsFtSfAdquPrw==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linuxmusl-arm64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linuxmusl-arm64/-/sharp-libvips-linuxmusl-arm64-1.2.4.tgz",
      "integrity": "sha512-FVQHuwx1IIuNow9QAbYUzJ+En8KcVm9Lk5+uGUQJHaZmMECZmOlix9HnH7n1TRkXMS0pGxIJokIVB9SuqZGGXw==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linuxmusl-x64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linuxmusl-x64/-/sharp-libvips-linuxmusl-x64-1.2.4.tgz",
      "integrity": "sha512-+LpyBk7L44ZIXwz/VYfglaX/okxezESc6UxDSoyo2Ks6Jxc4Y7sGjpgU9s4PMgqgjj1gZCylTieNamqA1MF7Dg==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-linux-arm": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-arm/-/sharp-linux-arm-0.34.5.tgz",
      "integrity": "sha512-9dLqsvwtg1uuXBGZKsxem9595+ujv0sJ6Vi8wcTANSFpwV/GONat5eCkzQo/1O6zRIkh0m/8+5BjrRr7jDUSZw==",
      "cpu": [
        "arm"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-arm": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-arm64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-arm64/-/sharp-linux-arm64-0.34.5.tgz",
      "integrity": "sha512-bKQzaJRY/bkPOXyKx5EVup7qkaojECG6NLYswgktOZjaXecSAeCWiZwwiFf3/Y+O1HrauiE3FVsGxFg8c24rZg==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-arm64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-ppc64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-ppc64/-/sharp-linux-ppc64-0.34.5.tgz",
      "integrity": "sha512-7zznwNaqW6YtsfrGGDA6BRkISKAAE1Jo0QdpNYXNMHu2+0dTrPflTLNkpc8l7MUP5M16ZJcUvysVWWrMefZquA==",
      "cpu": [
        "ppc64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-ppc64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-riscv64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-riscv64/-/sharp-linux-riscv64-0.34.5.tgz",
      "integrity": "sha512-51gJuLPTKa7piYPaVs8GmByo7/U7/7TZOq+cnXJIHZKavIRHAP77e3N2HEl3dgiqdD/w0yUfiJnII77PuDDFdw==",
      "cpu": [
        "riscv64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-riscv64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-s390x": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-s390x/-/sharp-linux-s390x-0.34.5.tgz",
      "integrity": "sha512-nQtCk0PdKfho3eC5MrbQoigJ2gd1CgddUMkabUj+rBevs8tZ2cULOx46E7oyX+04WGfABgIwmMC0VqieTiR4jg==",
      "cpu": [
        "s390x"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-s390x": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-x64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-x64/-/sharp-linux-x64-0.34.5.tgz",
      "integrity": "sha512-MEzd8HPKxVxVenwAa+JRPwEC7QFjoPWuS5NZnBt6B3pu7EG2Ge0id1oLHZpPJdn3OQK+BQDiw9zStiHBTJQQQQ==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-x64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linuxmusl-arm64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linuxmusl-arm64/-/sharp-linuxmusl-arm64-0.34.5.tgz",
      "integrity": "sha512-fprJR6GtRsMt6Kyfq44IsChVZeGN97gTD331weR1ex1c1rypDEABN6Tm2xa1wE6lYb5DdEnk03NZPqA7Id21yg==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linuxmusl-arm64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linuxmusl-x64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linuxmusl-x64/-/sharp-linuxmusl-x64-0.34.5.tgz",
      "integrity": "sha512-Jg8wNT1MUzIvhBFxViqrEhWDGzqymo3sV7z7ZsaWbZNDLXRJZoRGrjulp60YYtV4wfY8VIKcWidjojlLcWrd8Q==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linuxmusl-x64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-wasm32": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-wasm32/-/sharp-wasm32-0.34.5.tgz",
      "integrity": "sha512-OdWTEiVkY2PHwqkbBI8frFxQQFekHaSSkUIJkwzclWZe64O1X4UlUjqqqLaPbUpMOQk6FBu/HtlGXNblIs0huw==",
      "cpu": [
        "wasm32"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later AND MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/runtime": "^1.7.0"
      },
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-arm64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-arm64/-/sharp-win32-arm64-0.34.5.tgz",
      "integrity": "sha512-WQ3AgWCWYSb2yt+IG8mnC6Jdk9Whs7O0gxphblsLvdhSpSTtmu69ZG1Gkb6NuvxsNACwiPV6cNSZNzt0KPsw7g==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-ia32": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-ia32/-/sharp-win32-ia32-0.34.5.tgz",
      "integrity": "sha512-FV9m/7NmeCmSHDD5j4+4pNI8Cp3aW+JvLoXcTUo0IqyjSfAZJ8dIUmijx1qaJsIiU+Hosw6xM5KijAWRJCSgNg==",
      "cpu": [
        "ia32"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-x64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-x64/-/sharp-win32-x64-0.34.5.tgz",
      "integrity": "sha512-+29YMsqY2/9eFEiW93eqWnuLcWcufowXewwSNIT6UwZdUUCrM3oFjMWH/Z6/TMmb4hlFenmfAVbpWeup2jryCw==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.5.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@napi-rs/wasm-runtime": {
      "version": "1.1.6",
      "resolved": "https://registry.npmjs.org/@napi-rs/wasm-runtime/-/wasm-runtime-1.1.6.tgz",
      "integrity": "sha512-ZLv/JdUfkvOy9eCnnBaGfiO+XimbjebAeO+MRQqD/B+FR1tnRN0tpKSJHRbE8sFfS6aqsXZ67TQjfwfsxULVbg==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@tybys/wasm-util": "^0.10.3"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      },
      "peerDependencies": {
        "@emnapi/core": "^1.7.1",
        "@emnapi/runtime": "^1.7.1"
      }
    },
    "node_modules/@next/env": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/env/-/env-16.2.10.tgz",
      "integrity": "sha512-zLPxg9M0MEHmygpj5OuxjQ+vHMiy/K7cSp74G8ecYolmgUWw0RwN02tF56npup/+qaI8JB97hQgS/r2Hb6QwVA==",
      "license": "MIT"
    },
    "node_modules/@next/eslint-plugin-next": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/eslint-plugin-next/-/eslint-plugin-next-16.2.10.tgz",
      "integrity": "sha512-Gs8D2m21VnJeFo9qvYIIqJH94frWerWYu41BprU1pLtRVF7PCQNLiFZZ3fG+iPuj3K83Cwv/rt+msLOy8Qgu3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-glob": "3.3.1"
      }
    },
    "node_modules/@next/swc-darwin-arm64": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-arm64/-/swc-darwin-arm64-16.2.10.tgz",
      "integrity": "sha512-v9IdJCa0H0mbo+8z5zwUpOk1Vj7RjkcI5uNYf5Ws1y6szf/p3Mzl9hLaST8SCt6L9h8NGnruZcd2+o0NTNwDhA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-darwin-x64": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-x64/-/swc-darwin-x64-16.2.10.tgz",
      "integrity": "sha512-17IS0jJRViROGmA9uGdNR8VPJpfbnaVG7E9qhso5jDLkmyd0lSDORWxbcKINzcFqzZqGwGtMSnrFRxBpuUYjLQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-gnu": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-gnu/-/swc-linux-arm64-gnu-16.2.10.tgz",
      "integrity": "sha512-GRQRsRtuciNJvB54AvvuQTiq0oZtFwa1owQqtZD8wwnGpM2L39MV22kpI72YSXLKIyY40LC66EiLFv4PiicXxg==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-musl": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-musl/-/swc-linux-arm64-musl-16.2.10.tgz",
      "integrity": "sha512-zkN9MQYS7UQBro+FnISUq1itaQjXI9xqISzuQ+2bc921NcJ1x4yPCqrn77tVN6/dOOXaaWVX3k6/bR07pPwK+A==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-gnu": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-gnu/-/swc-linux-x64-gnu-16.2.10.tgz",
      "integrity": "sha512-iCVJnwvrPYECvA6WM/7+oo+OiTvedIKLxtCLAZP4xZR3nXa1zmzZyLPbYCmWvpd4CvMYF1EMTafd0ii3DygLvA==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-musl": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-musl/-/swc-linux-x64-musl-16.2.10.tgz",
      "integrity": "sha512-ov2g4H0dHY9bPoOU83m91hWT7Iq5qy13bUnyyshLU3HGR1Ownn0X9QpmDPc5iIUaahTp7f7LeGAhV4DSFtackw==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-arm64-msvc": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-arm64-msvc/-/swc-win32-arm64-msvc-16.2.10.tgz",
      "integrity": "sha512-DwAnhLX76HQiFFQNgWlcK+JzlnD1rZ+UK/WY0ZMI/deXpvgnesjNYrqcfo1JzBuz4Kf7o3brIBL0glI1junatA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-x64-msvc": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-x64-msvc/-/swc-win32-x64-msvc-16.2.10.tgz",
      "integrity": "sha512-0JXq3b85Jk9Jg4ntLUbXSPvoDw3gpZou7twuKdoFG2jOw635v7+IiXfTaa0TxVMyx78pUjnrVYwLgjKfX4e6/A==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nolyfill/is-core-module": {
      "version": "1.0.39",
      "resolved": "https://registry.npmjs.org/@nolyfill/is-core-module/-/is-core-module-1.0.39.tgz",
      "integrity": "sha512-nn5ozdjYQpUCZlWGuxcJY/KpxkWQs4DcbMCmKojjyrYDEAGy4Ce19NN4v5MduafTwJlbKc99UA8YhSVqq9yPZA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.4.0"
      }
    },
    "node_modules/@panva/hkdf": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@panva/hkdf/-/hkdf-1.2.1.tgz",
      "integrity": "sha512-6oclG6Y3PiDFcoyk8srjLfVKyMfVCKJ27JwNPViuXziFpmdz+MZnZN/aKY0JGXgYuO/VghU0jcOAZgWXZ1Dmrw==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/@prisma/client": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/client/-/client-6.19.3.tgz",
      "integrity": "sha512-mKq3jQFhjvko5LTJFHGilsuQs+W+T3Gm451NzuTDGQxwCzwXHYnIu2zGkRoW+Exq3Rob7yp2MfzSrdIiZVhrBg==",
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18"
      },
      "peerDependencies": {
        "prisma": "*",
        "typescript": ">=5.1.0"
      },
      "peerDependenciesMeta": {
        "prisma": {
          "optional": true
        },
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@prisma/config": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/config/-/config-6.19.3.tgz",
      "integrity": "sha512-CBPT44BjlQxEt8kiMEauji2WHTDoVBOKl7UlewXmUgBPnr/oPRZC3psci5chJnYmH0ivEIog2OU9PGWoki3DLQ==",
      "devOptional": true,
      "license": "Apache-2.0",
      "dependencies": {
        "c12": "3.1.0",
        "deepmerge-ts": "7.1.5",
        "effect": "3.21.0",
        "empathic": "2.0.0"
      }
    },
    "node_modules/@prisma/debug": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/debug/-/debug-6.19.3.tgz",
      "integrity": "sha512-ljkJ+SgpXNktLG0Q/n4JGYCkKf0f8oYLyjImS2I8e2q2WCfdRRtWER062ZV/ixaNP2M2VKlWXVJiGzZaUgbKZw==",
      "devOptional": true,
      "license": "Apache-2.0"
    },
    "node_modules/@prisma/engines": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/engines/-/engines-6.19.3.tgz",
      "integrity": "sha512-RSYxtlYFl5pJ8ZePgMv0lZ9IzVCOdTPOegrs2qcbAEFrBI1G33h6wyC9kjQvo0DnYEhEVY0X4LsuFHXLKQk88g==",
      "devOptional": true,
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@prisma/debug": "6.19.3",
        "@prisma/engines-version": "7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7",
        "@prisma/fetch-engine": "6.19.3",
        "@prisma/get-platform": "6.19.3"
      }
    },
    "node_modules/@prisma/engines-version": {
      "version": "7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7",
      "resolved": "https://registry.npmjs.org/@prisma/engines-version/-/engines-version-7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7.tgz",
      "integrity": "sha512-03bgb1VD5gvuumNf+7fVGBzfpJPjmqV423l/WxsWk2cNQ42JD0/SsFBPhN6z8iAvdHs07/7ei77SKu7aZfq8bA==",
      "devOptional": true,
      "license": "Apache-2.0"
    },
    "node_modules/@prisma/fetch-engine": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/fetch-engine/-/fetch-engine-6.19.3.tgz",
      "integrity": "sha512-tKtl/qco9Nt7LU5iKhpultD8O4vMCZcU2CHjNTnRrL1QvSUr5W/GcyFPjNL87GtRrwBc7ubXXD9xy4EvLvt8JA==",
      "devOptional": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@prisma/debug": "6.19.3",
        "@prisma/engines-version": "7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7",
        "@prisma/get-platform": "6.19.3"
      }
    },
    "node_modules/@prisma/get-platform": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/@prisma/get-platform/-/get-platform-6.19.3.tgz",
      "integrity": "sha512-xFj1VcJ1N3MKooOQAGO0W5tsd0W2QzIvW7DD7c/8H14Zmp4jseeWAITm+w2LLoLrlhoHdPPh0NMZ8mfL6puoHA==",
      "devOptional": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@prisma/debug": "6.19.3"
      }
    },
    "node_modules/@reduxjs/toolkit": {
      "version": "2.12.0",
      "resolved": "https://registry.npmjs.org/@reduxjs/toolkit/-/toolkit-2.12.0.tgz",
      "integrity": "sha512-KiT+RzZbp6mQET+Mg+h2c97+9j1sNflUxQkIHI7Yuzf6Peu+OYpmkn6nbHWmLLWj+1ZODUJFwGZ7gx3L9R9EOw==",
      "license": "MIT",
      "dependencies": {
        "@standard-schema/spec": "^1.0.0",
        "@standard-schema/utils": "^0.3.0",
        "immer": "^11.0.0",
        "redux": "^5.0.1",
        "redux-thunk": "^3.1.0",
        "reselect": "^5.1.0"
      },
      "peerDependencies": {
        "react": "^16.9.0 || ^17.0.0 || ^18 || ^19",
        "react-redux": "^7.2.1 || ^8.1.3 || ^9.0.0"
      },
      "peerDependenciesMeta": {
        "react": {
          "optional": true
        },
        "react-redux": {
          "optional": true
        }
      }
    },
    "node_modules/@rtsao/scc": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@rtsao/scc/-/scc-1.1.0.tgz",
      "integrity": "sha512-zt6OdqaDoOnJ1ZYsCYGt9YmWzDXl4vQdKTyJev62gFhRGKdx7mcT54V9KIjg+d2wi9EXsPvAPKe7i7WjfVWB8g==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@standard-schema/spec": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
      "license": "MIT"
    },
    "node_modules/@standard-schema/utils": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/utils/-/utils-0.3.0.tgz",
      "integrity": "sha512-e7Mew686owMaPJVNNLs55PUvgz371nKgwsc4vxE49zsODpJEnxgxRo2y/OKrqueavXgZNMDVj3DdHFlaSAeU8g==",
      "license": "MIT"
    },
    "node_modules/@swc/helpers": {
      "version": "0.5.15",
      "resolved": "https://registry.npmjs.org/@swc/helpers/-/helpers-0.5.15.tgz",
      "integrity": "sha512-JQ5TuMi45Owi4/BIMAJBoSQoOJu12oOk/gADqlcUL9JEdHB8vyjUSsxqeNXnmXHjYKMi2WcYtezGEEhqUI/E2g==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.8.0"
      }
    },
    "node_modules/@tsconfig/node10": {
      "version": "1.0.12",
      "resolved": "https://registry.npmjs.org/@tsconfig/node10/-/node10-1.0.12.tgz",
      "integrity": "sha512-UCYBaeFvM11aU2y3YPZ//O5Rhj+xKyzy7mvcIoAjASbigy8mHMryP5cK7dgjlz2hWxh1g5pLw084E0a/wlUSFQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@tsconfig/node12": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@tsconfig/node12/-/node12-1.0.11.tgz",
      "integrity": "sha512-cqefuRsh12pWyGsIoBKJA9luFu3mRxCA+ORZvA4ktLSzIuCUtWVxGIuXigEwO5/ywWFMZ2QEGKWvkZG1zDMTag==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@tsconfig/node14": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@tsconfig/node14/-/node14-1.0.3.tgz",
      "integrity": "sha512-ysT8mhdixWK6Hw3i1V2AeRqZ5WfXg1G43mqoYlM2nc6388Fq5jcXyr5mRsqViLx/GJYdoL0bfXD8nmF+Zn/Iow==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@tsconfig/node16": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/@tsconfig/node16/-/node16-1.0.4.tgz",
      "integrity": "sha512-vxhUy4J8lyeyinH7Azl1pdd43GJhZH/tP2weN8TntQblOY+A0XbT8DJk1/oCPuOOyg/Ja757rG0CgHcWC8OfMA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@tybys/wasm-util": {
      "version": "0.10.3",
      "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.3.tgz",
      "integrity": "sha512-F3fo1MYrRJYL3zER0OUOmkutjr1Vp23m7OsSgp7nq4SP6OqX6C/56XFIPAl5bt3zaBRjmW7SGz3u/6LwFpYcOg==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@types/bcryptjs": {
      "version": "2.4.6",
      "resolved": "https://registry.npmjs.org/@types/bcryptjs/-/bcryptjs-2.4.6.tgz",
      "integrity": "sha512-9xlo6R2qDs5uixm0bcIqCeMCE6HiQsIyel9KQySStiyqNl2tnj2mP3DX1Nf56MD6KMenNNlBBsy3LJ7gUEQPXQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/d3-array": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/@types/d3-array/-/d3-array-3.2.2.tgz",
      "integrity": "sha512-hOLWVbm7uRza0BYXpIIW5pxfrKe0W+D5lrFiAEYR+pb6w3N2SwSMaJbXdUfSEv+dT4MfHBLtn5js0LAWaO6otw==",
      "license": "MIT"
    },
    "node_modules/@types/d3-color": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/@types/d3-color/-/d3-color-3.1.3.tgz",
      "integrity": "sha512-iO90scth9WAbmgv7ogoq57O9YpKmFBbmoEoCHDB2xMBY0+/KVrqAaCDyCE16dUspeOvIxFFRI+0sEtqDqy2b4A==",
      "license": "MIT"
    },
    "node_modules/@types/d3-ease": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-ease/-/d3-ease-3.0.2.tgz",
      "integrity": "sha512-NcV1JjO5oDzoK26oMzbILE6HW7uVXOHLQvHshBUW4UMdZGfiY6v5BeQwh9a9tCzv+CeefZQHJt5SRgK154RtiA==",
      "license": "MIT"
    },
    "node_modules/@types/d3-interpolate": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-interpolate/-/d3-interpolate-3.0.4.tgz",
      "integrity": "sha512-mgLPETlrpVV1YRJIglr4Ez47g7Yxjl1lj7YKsiMCb27VJH9W8NVM6Bb9d8kkpG/uAQS5AmbA48q2IAolKKo1MA==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-color": "*"
      }
    },
    "node_modules/@types/d3-path": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/@types/d3-path/-/d3-path-3.1.1.tgz",
      "integrity": "sha512-VMZBYyQvbGmWyWVea0EHs/BwLgxc+MKi1zLDCONksozI4YJMcTt8ZEuIR4Sb1MMTE8MMW49v0IwI5+b7RmfWlg==",
      "license": "MIT"
    },
    "node_modules/@types/d3-scale": {
      "version": "4.0.9",
      "resolved": "https://registry.npmjs.org/@types/d3-scale/-/d3-scale-4.0.9.tgz",
      "integrity": "sha512-dLmtwB8zkAeO/juAMfnV+sItKjlsw2lKdZVVy6LRr0cBmegxSABiLEpGVmSJJ8O08i4+sGR6qQtb6WtuwJdvVw==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-time": "*"
      }
    },
    "node_modules/@types/d3-shape": {
      "version": "3.1.8",
      "resolved": "https://registry.npmjs.org/@types/d3-shape/-/d3-shape-3.1.8.tgz",
      "integrity": "sha512-lae0iWfcDeR7qt7rA88BNiqdvPS5pFVPpo5OfjElwNaT2yyekbM0C9vK+yqBqEmHr6lDkRnYNoTBYlAgJa7a4w==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-path": "*"
      }
    },
    "node_modules/@types/d3-time": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-time/-/d3-time-3.0.4.tgz",
      "integrity": "sha512-yuzZug1nkAAaBlBBikKZTgzCeA+k1uy4ZFwWANOfKw5z5LRhV0gNA7gNkKm7HoK+HRN0wX3EkxGk0fpbWhmB7g==",
      "license": "MIT"
    },
    "node_modules/@types/d3-timer": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-timer/-/d3-timer-3.0.2.tgz",
      "integrity": "sha512-Ps3T8E8dZDam6fUyNiMkekK3XUsaUEik+idO9/YjPtfj2qruF8tFBXS7XhtE4iIXBLxhmLjP3SXpLhVf21I9Lw==",
      "license": "MIT"
    },
    "node_modules/@types/estree": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.9.tgz",
      "integrity": "sha512-GhdPgy1el4/ImP05X05Uw4cw2/M93BCUmnEvWZNStlCzEKME4Fkk+YpoA5OiHNQmoS7Cafb8Xa3Pya8m1Qrzeg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json-schema": {
      "version": "7.0.15",
      "resolved": "https://registry.npmjs.org/@types/json-schema/-/json-schema-7.0.15.tgz",
      "integrity": "sha512-5+fP8P8MFNC+AyZCDxrB2pkZFPGzqQWUzpSeuuVLvm8VMcorNYavBqoFcxK8bQz4Qsbn4oUEEem4wDLfcysGHA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json5": {
      "version": "0.0.29",
      "resolved": "https://registry.npmjs.org/@types/json5/-/json5-0.0.29.tgz",
      "integrity": "sha512-dRLjCWHYg4oaA77cxO64oO+7JwCwnIzkZPdrrC71jQmQtlhM556pwKo5bUzqvZndkVbeFLIIi+9TC40JNF5hNQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/jsonwebtoken": {
      "version": "9.0.10",
      "resolved": "https://registry.npmjs.org/@types/jsonwebtoken/-/jsonwebtoken-9.0.10.tgz",
      "integrity": "sha512-asx5hIG9Qmf/1oStypjanR7iKTv0gXQ1Ov/jfrX6kS/EO0OFni8orbmGCn0672NHR3kXHwpAwR+B368ZGN/2rA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/ms": "*",
        "@types/node": "*"
      }
    },
    "node_modules/@types/ms": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/@types/ms/-/ms-2.1.0.tgz",
      "integrity": "sha512-GsCCIZDE/p3i96vtEqx+7dBUGXrc7zeSK3wwPHIaRThS+9OhWIXRqzs4d6k1SVU8g91DrNRWxWUGhp5KXQb2VA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "20.19.43",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-20.19.43.tgz",
      "integrity": "sha512-6oYBAi5ikg4Pl+kGsoYtawUMBT2zZMCvPNF7pVLnHZfd1zf38DRiWn/gT01RYCdUqkv7Fhr+C9ot4/tb+2sVvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/@types/react": {
      "version": "19.2.17",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.2.17.tgz",
      "integrity": "sha512-MXfmqaVPEVgkBT/aY0aGCkRWWtByiYQXo3xdQ8r5RzuFrPiRn8Gar2tQdXSUQ2GKV3bkXckek89V8wQBY2Q/Aw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "csstype": "^3.2.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "19.2.3",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz",
      "integrity": "sha512-jp2L/eY6fn+KgVVQAOqYItbF0VY/YApe5Mz2F0aykSO8gx31bYCZyvSeYxCHKvzHG5eZjc+zyaS5BrBWya2+kQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "^19.2.0"
      }
    },
    "node_modules/@types/use-sync-external-store": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/@types/use-sync-external-store/-/use-sync-external-store-0.0.6.tgz",
      "integrity": "sha512-zFDAD+tlpf2r4asuHEj0XH6pY6i0g5NeAHPn+15wk3BV6JA69eERFXC1gyGThDkVa1zCyKr5jox1+2LbV/AMLg==",
      "license": "MIT"
    },
    "node_modules/@typescript-eslint/eslint-plugin": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/eslint-plugin/-/eslint-plugin-8.63.0.tgz",
      "integrity": "sha512-rvwSgqT+DHpWdzfSzPatRLm02a0GlESt++9iy3hLCDY4BgkaLcl8LBi9Yh7XGFBpwcBE/K3024QuXWTpbz4FfQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/regexpp": "^4.12.2",
        "@typescript-eslint/scope-manager": "8.63.0",
        "@typescript-eslint/type-utils": "8.63.0",
        "@typescript-eslint/utils": "8.63.0",
        "@typescript-eslint/visitor-keys": "8.63.0",
        "ignore": "^7.0.5",
        "natural-compare": "^1.4.0",
        "ts-api-utils": "^2.5.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "@typescript-eslint/parser": "^8.63.0",
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/eslint-plugin/node_modules/ignore": {
      "version": "7.0.5",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-7.0.5.tgz",
      "integrity": "sha512-Hs59xBNfUIunMFgWAbGX5cq6893IbWg4KnrjbYwX3tx0ztorVgTDA6B2sxf8ejHJ4wz8BqGUMYlnzNBer5NvGg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/@typescript-eslint/parser": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/parser/-/parser-8.63.0.tgz",
      "integrity": "sha512-gwh4gvvlaVDKKxyfxMG+Gnu1u9X0OQBwyGLkbwB65dIzBKnxeRiJlNFqlI3zwVhNXJIs6qV7mlFCn/BIajlVig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/scope-manager": "8.63.0",
        "@typescript-eslint/types": "8.63.0",
        "@typescript-eslint/typescript-estree": "8.63.0",
        "@typescript-eslint/visitor-keys": "8.63.0",
        "debug": "^4.4.3"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/project-service": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/project-service/-/project-service-8.63.0.tgz",
      "integrity": "sha512-e5dh0/UI0ok53AlZ5wRkXCB32z/f2jUZqPR/ygAw5WYaSw8j9EoJWlS7wQjr/dmOaqWjnPIn2m+HhVPCMWGZVQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/tsconfig-utils": "^8.63.0",
        "@typescript-eslint/types": "^8.63.0",
        "debug": "^4.4.3"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/scope-manager": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/scope-manager/-/scope-manager-8.63.0.tgz",
      "integrity": "sha512-uUyfMWCnDSN8bCpcrY8nGP2BLkQ9Xn0GsipcONcpIDWhwhO4ZSyHvyS14U3X75mzxWxL3I2UZIrenTzdzcJO8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.63.0",
        "@typescript-eslint/visitor-keys": "8.63.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/tsconfig-utils": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/tsconfig-utils/-/tsconfig-utils-8.63.0.tgz",
      "integrity": "sha512-sUAbkulqBAsncKnbRP3+7CtQFRKicexnj7ZwNC6ddCR7EmrXvjvdCYMJbUIqMd6lwoEriZjwLo08aS5tSjVMHg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/type-utils": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/type-utils/-/type-utils-8.63.0.tgz",
      "integrity": "sha512-Nzzh/OGxVCOjObjaj1CQF2RUasyYy2Jfuh+zZ3PjLzG2fYRriAiZLib9UKtO+CpQAS3YHiAS+ckZDclwqI1TPA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.63.0",
        "@typescript-eslint/typescript-estree": "8.63.0",
        "@typescript-eslint/utils": "8.63.0",
        "debug": "^4.4.3",
        "ts-api-utils": "^2.5.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/types": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/types/-/types-8.63.0.tgz",
      "integrity": "sha512-xyLtl9DUBBFrcJS4x2pIqGLH68/tC2uOa4Z7pUteW09D3bXnnXUom4dyPikzWgB7llmIc1zoeI3aoUdC4rPK/Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/typescript-estree/-/typescript-estree-8.63.0.tgz",
      "integrity": "sha512-ygBkU+B7ex5UI/gKhaqexWev79uISfIv7XQCRNYO/jmD8rGLPyWLAb3KMRT6nd8Gt9bmUBi9+iX6tBdYfOY81Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/project-service": "8.63.0",
        "@typescript-eslint/tsconfig-utils": "8.63.0",
        "@typescript-eslint/types": "8.63.0",
        "@typescript-eslint/visitor-keys": "8.63.0",
        "debug": "^4.4.3",
        "minimatch": "^10.2.2",
        "semver": "^7.7.3",
        "tinyglobby": "^0.2.15",
        "ts-api-utils": "^2.5.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/balanced-match": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-4.0.4.tgz",
      "integrity": "sha512-BLrgEcRTwX2o6gGxGOCNyMvGSp35YofuYzw9h1IMTRmKqttAZZVU67bdb9Pr2vUHA8+j3i2tJfjO6C6+4myGTA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "18 || 20 || >=22"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion": {
      "version": "5.0.7",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-5.0.7.tgz",
      "integrity": "sha512-7oFy703dxfY3/NLxC1fh2SUCQ0H9rmAY+5EpDVfXjUTTs+HEwR2nYaqLv+GWcTsumwxPfiz6CzCNkwXwBUwqCA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^4.0.2"
      },
      "engines": {
        "node": "18 || 20 || >=22"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch": {
      "version": "10.2.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-10.2.5.tgz",
      "integrity": "sha512-MULkVLfKGYDFYejP07QOurDLLQpcjk7Fw+7jXS2R2czRQzR56yHRveU5NDJEOviH+hETZKSkIk5c+T23GjFUMg==",
      "dev": true,
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "brace-expansion": "^5.0.5"
      },
      "engines": {
        "node": "18 || 20 || >=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@typescript-eslint/utils": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/utils/-/utils-8.63.0.tgz",
      "integrity": "sha512-fUKaeAvrTuQg/Tgt3nliAUSZHJM6DlCcfyEmxCvlX8kieWSStBX+5O5Fnidtc3i2JrH+9c/GL4RY2iasd/GPTA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.9.1",
        "@typescript-eslint/scope-manager": "8.63.0",
        "@typescript-eslint/types": "8.63.0",
        "@typescript-eslint/typescript-estree": "8.63.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/visitor-keys/-/visitor-keys-8.63.0.tgz",
      "integrity": "sha512-UexrHGnGTpbuQHct2ExOc2ZcFbGUS9FOesCxxqdBGcpI1BxYu/LZ6U8Aq6/72XtF/qRBk9nhuGHFJIXXMhPMdw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.63.0",
        "eslint-visitor-keys": "^5.0.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys/node_modules/eslint-visitor-keys": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-5.0.1.tgz",
      "integrity": "sha512-tD40eHxA35h0PEIZNeIjkHoDR4YjjJp34biM0mDvplBe//mB+IHCqHDGV7pxF+7MklTvighcCPPZC7ynWyjdTA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@unrs/resolver-binding-android-arm-eabi": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-android-arm-eabi/-/resolver-binding-android-arm-eabi-1.12.2.tgz",
      "integrity": "sha512-g5T90pqg1bo/7mytQx6F4iBNC0Wsh9cu+z9veDbFjc7HjpesJFWD7QMS0NGStXM075+7dJPPVvBbpZlnrdpi/w==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@unrs/resolver-binding-android-arm64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-android-arm64/-/resolver-binding-android-arm64-1.12.2.tgz",
      "integrity": "sha512-YGCRZv/9GLhwmz6mYDeTsm/92BAyR28l6c2ReweVW5pWgfsitWLY8upvfRlGdoyD8HjeTHSYJWyZGD4KJA/nFQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@unrs/resolver-binding-darwin-arm64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-darwin-arm64/-/resolver-binding-darwin-arm64-1.12.2.tgz",
      "integrity": "sha512-u9DiNT1auQMO20A9SyTuG3wUgQWB9Z7KjAg0uFuCDR1FsAY8A0CG2S6JpHS1xwm/w1G08bjXZDcyOCjv1WAm2w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@unrs/resolver-binding-darwin-x64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-darwin-x64/-/resolver-binding-darwin-x64-1.12.2.tgz",
      "integrity": "sha512-f7rPLi/T1HVKZu/u6t87lroib16n8vrSzcyxI7lg4BGO9UF26KhQL44sd9eOUgrTYhvRXtWOIZT5PejdPyJfUA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@unrs/resolver-binding-freebsd-x64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-freebsd-x64/-/resolver-binding-freebsd-x64-1.12.2.tgz",
      "integrity": "sha512-BpcOjWCJub6nRZUS2zA20pmLvjtqAtGejETaIyRLiZiQf++cbrjltLA5NN/xaXfqeOBOSlMFbemIl5/S5tljmg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm-gnueabihf": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm-gnueabihf/-/resolver-binding-linux-arm-gnueabihf-1.12.2.tgz",
      "integrity": "sha512-vZTDvdSISZjJx66OzJqtsOhzifbqRjbmI1Mnu49fQDwog5GtDI4QidRiEAYbZCRj9C8YZEW+3ZjqsyS9GR4k2A==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm-musleabihf": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm-musleabihf/-/resolver-binding-linux-arm-musleabihf-1.12.2.tgz",
      "integrity": "sha512-BiPI+IrIlwcW4nLLMM21+B1dFPzd55yAVgVGrdgDjNef+ch03GdxrcyaIz8X9SsQirh/kCQ7mviyWlMxdh2D7g==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm64-gnu/-/resolver-binding-linux-arm64-gnu-1.12.2.tgz",
      "integrity": "sha512-zJc0H99FEPoFfSrNpa91HYfxzfAJCr502oxNK1cfdC9hlaFI43RT+JFCann9JUgZmLzzntChHyn13Sgn9ljHNg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm64-musl": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm64-musl/-/resolver-binding-linux-arm64-musl-1.12.2.tgz",
      "integrity": "sha512-KQ3Lki6l+Pz1k/eBipN41ES+YUK30beLGb9YqcB1O542cyLCNE6GaxrfcY3T6EezmGGk84wb5XyO9loTM9tkcA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-loong64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-loong64-gnu/-/resolver-binding-linux-loong64-gnu-1.12.2.tgz",
      "integrity": "sha512-3SJGEh1DborhG6pyxvhPzCT4bbSIVihsvgJc13P1bHG7KLdNDaF9T3gsTwFc7Jw/5Y5/iWOjkEx7Zy0NvCGX3Q==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-loong64-musl": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-loong64-musl/-/resolver-binding-linux-loong64-musl-1.12.2.tgz",
      "integrity": "sha512-jiuG/Obbel7uw1PwHNFfrkiKhLAF6mnyZ6aWlOAVN9WqKm8v0OFGnciJIHu8+CMvXLQ8AD51LPzAoUfT21D5Ew==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-ppc64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-ppc64-gnu/-/resolver-binding-linux-ppc64-gnu-1.12.2.tgz",
      "integrity": "sha512-q7xRvVpmcfeL+LlZg8Pbbo6QaTZwDU5BaGZbwfhkEsXJn3Was8xYfE0RBH266xZt0rM6B7i8xAYIvjthuUIWHg==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-riscv64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-riscv64-gnu/-/resolver-binding-linux-riscv64-gnu-1.12.2.tgz",
      "integrity": "sha512-0CVdx6lcnT3Q9inOH8tsMIOJ6ImndllMjqJHg8RLVdB7Vq4SfkEXl9mCSsVNuNA4MCYycRicCUxPCabVHJRr6A==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-riscv64-musl": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-riscv64-musl/-/resolver-binding-linux-riscv64-musl-1.12.2.tgz",
      "integrity": "sha512-iOwlRo9vnp6R6ohHQS11n0NnfdXx/omhkocmIfaPRpQhKZ+3BDMkkdRVh53qjkFkpPddf+FETA28NwGN7l5l+w==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-s390x-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-s390x-gnu/-/resolver-binding-linux-s390x-gnu-1.12.2.tgz",
      "integrity": "sha512-HYJtLfXq94q8iZNFT1lknx258wlkkWhZeUXJRqzKBBUJ00CvZ+N33zgbCqimLjsyw5Va6uUxhVa12mI+kaveEw==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-x64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-x64-gnu/-/resolver-binding-linux-x64-gnu-1.12.2.tgz",
      "integrity": "sha512-mPsUhunKKDih5O96Y6enDQyHc1SqBPlY1E/SfMWDM3EdJ95Z9CArPeCVwCCqbP45ljvivdEk8Fxn+SIb1rDAJQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-x64-musl": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-x64-musl/-/resolver-binding-linux-x64-musl-1.12.2.tgz",
      "integrity": "sha512-azrt6+5ydLd8Vt210AAFis/lZevSfPw93EJRIJG+xPu4WCJ8K0kppCTpMyLPcKT7H15M4Jnt2tMp5bOvCkRC6A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-openharmony-arm64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-openharmony-arm64/-/resolver-binding-openharmony-arm64-1.12.2.tgz",
      "integrity": "sha512-YZ9hP4O0X9PQb8eO980qmLNGH4zT3I9+SZTdt0Pr0YyuGQhYKoOZkV02VzrzyOZJ5xIJ3UFIenKkUkGg8GjgWQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ]
    },
    "node_modules/@unrs/resolver-binding-wasm32-wasi": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-wasm32-wasi/-/resolver-binding-wasm32-wasi-1.12.2.tgz",
      "integrity": "sha512-tYFDIkMxSflfEc/h92ZWNsZlHSwgimbNHSO3PL2JWQHfCuC2q316jMyYU9TIWZsFK2bQwyK5VAdYgn8ygPj69A==",
      "cpu": [
        "wasm32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "1.10.0",
        "@emnapi/runtime": "1.10.0",
        "@napi-rs/wasm-runtime": "^1.1.4"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@unrs/resolver-binding-wasm32-wasi/node_modules/@emnapi/runtime": {
      "version": "1.10.0",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.10.0.tgz",
      "integrity": "sha512-ewvYlk86xUoGI0zQRNq/mC+16R1QeDlKQy21Ki3oSYXNgLb45GV1P6A0M+/s6nyCuNDqe5VpaY84BzXGwVbwFA==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@unrs/resolver-binding-win32-arm64-msvc": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-arm64-msvc/-/resolver-binding-win32-arm64-msvc-1.12.2.tgz",
      "integrity": "sha512-qzNyg3xL0VPQmCaUh+N5jSitce6k+uCBfMDesWRnlULOZaqUkaJ0ybdT+UqlAWJoQjuqfIU/0Ptx9bteN4D82g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@unrs/resolver-binding-win32-ia32-msvc": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-ia32-msvc/-/resolver-binding-win32-ia32-msvc-1.12.2.tgz",
      "integrity": "sha512-WD9sY00OfpHVGfsnHZoA8jVT+esS/Bg8z8jzxp5BnDCjjwsuKsPQrzswwpFy4J1AUJbXPRfkpcX0mXrzeXW79g==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@unrs/resolver-binding-win32-x64-msvc": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-x64-msvc/-/resolver-binding-win32-x64-msvc-1.12.2.tgz",
      "integrity": "sha512-nAB74NfSNKknqQ1RrYj6uz8FcXEomu/MATJZxh/x+BArzN2U3JbOYC0APYzUIGhVY3m5hRxA8VPNdPBoG8txlA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/acorn": {
      "version": "8.17.0",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.17.0.tgz",
      "integrity": "sha512-xRQbDb9BnwDafYNn6Vwl839DYVjqXYb1XVGtWAZ1kcDc6iwAL4hg3B1dZlRiuENFeO2H53gFG3in621AdERVAg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "acorn": "bin/acorn"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/acorn-jsx": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "acorn": "^6.0.0 || ^7.0.0 || ^8.0.0"
      }
    },
    "node_modules/acorn-walk": {
      "version": "8.3.5",
      "resolved": "https://registry.npmjs.org/acorn-walk/-/acorn-walk-8.3.5.tgz",
      "integrity": "sha512-HEHNfbars9v4pgpW6SO1KSPkfoS0xVOM/9UzkJltjlsHZmJasxg8aXkuZa7SMf8vKGIBhpUsPluQSqhJFCqebw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "acorn": "^8.11.0"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/ajv": {
      "version": "6.15.0",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.15.0.tgz",
      "integrity": "sha512-fgFx7Hfoq60ytK2c7DhnF8jIvzYgOMxfugjLOSMHjLIPgenqa7S7oaagATUq99mV6IYvN2tRmC0wnTYX6iPbMw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/arg": {
      "version": "4.1.3",
      "resolved": "https://registry.npmjs.org/arg/-/arg-4.1.3.tgz",
      "integrity": "sha512-58S9QDqG0Xx27YwPSt9fJxivjYl432YCwfDMfZ+71RAqUrZef7LrKQZ3LHLOwCS4FLNBplP533Zx895SeOCHvA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "dev": true,
      "license": "Python-2.0"
    },
    "node_modules/aria-query": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/aria-query/-/aria-query-5.3.2.tgz",
      "integrity": "sha512-COROpnaoap1E2F000S62r6A60uHZnmlvomhfyT2DlTcrY1OrBKn2UhH7qn5wTC9zMvD0AY7csdPSNwKP+7WiQw==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/array-buffer-byte-length": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/array-buffer-byte-length/-/array-buffer-byte-length-1.0.2.tgz",
      "integrity": "sha512-LHE+8BuR7RYGDKvnrmcuSq3tDcKv9OFEXQt/HpbZhY7V6h0zlUXutnAD82GiFx9rdieCMjkvtcsPqBwgUl1Iiw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "is-array-buffer": "^3.0.5"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array-includes": {
      "version": "3.1.9",
      "resolved": "https://registry.npmjs.org/array-includes/-/array-includes-3.1.9.tgz",
      "integrity": "sha512-FmeCCAenzH0KH381SPT5FZmiA/TmpndpcaShhfgEN9eCVjnFBqq3l1xrI42y8+PPLI6hypzou4GXw00WHmPBLQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.24.0",
        "es-object-atoms": "^1.1.1",
        "get-intrinsic": "^1.3.0",
        "is-string": "^1.1.1",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.findlast": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/array.prototype.findlast/-/array.prototype.findlast-1.2.5.tgz",
      "integrity": "sha512-CVvd6FHg1Z3POpBLxO6E6zr+rSKEQ9L6rZHAaY7lLfhKsWYUBBOuMs0e9o24oopj6H+geRCX0YJ+TJLBK2eHyQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.findlastindex": {
      "version": "1.2.6",
      "resolved": "https://registry.npmjs.org/array.prototype.findlastindex/-/array.prototype.findlastindex-1.2.6.tgz",
      "integrity": "sha512-F/TKATkzseUExPlfvmwQKGITM3DGTK+vkAsCZoDc5daVygbJBnjEUCbgkAvVFsgfXfX4YIqZ/27G3k3tdXrTxQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.9",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "es-shim-unscopables": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.flat": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/array.prototype.flat/-/array.prototype.flat-1.3.3.tgz",
      "integrity": "sha512-rwG/ja1neyLqCuGZ5YYrznA62D4mZXg0i1cIskIUKSiqF3Cje9/wXAls9B9s1Wa2fomMsIv8czB8jZcPmxCXFg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.flatmap": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/array.prototype.flatmap/-/array.prototype.flatmap-1.3.3.tgz",
      "integrity": "sha512-Y7Wt51eKJSyi80hFrJCePGGNo5ktJCslFuboqJsbf57CCPcm5zztluPlc4/aD8sWsKvlwatezpV4U1efk8kpjg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.tosorted": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/array.prototype.tosorted/-/array.prototype.tosorted-1.1.4.tgz",
      "integrity": "sha512-p6Fx8B7b7ZhL/gmUsAy0D15WhvDccw3mnGNbZpi3pmeJdxtWsj2jEaI4Y6oo3XiHfzuSgPwKc04MYt6KgvC/wA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.3",
        "es-errors": "^1.3.0",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/arraybuffer.prototype.slice": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/arraybuffer.prototype.slice/-/arraybuffer.prototype.slice-1.0.4.tgz",
      "integrity": "sha512-BNoCY6SXXPQ7gF2opIP4GBE+Xw7U+pHMYKuzjgCN3GwiaIR09UUeKfheyIry77QtrCBlC0KK0q5/TER/tYh3PQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.1",
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "is-array-buffer": "^3.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/ast-types-flow": {
      "version": "0.0.8",
      "resolved": "https://registry.npmjs.org/ast-types-flow/-/ast-types-flow-0.0.8.tgz",
      "integrity": "sha512-OH/2E5Fg20h2aPrbe+QL8JZQFko0YZaF+j4mnQ7BGhfavO7OpSLa8a0y9sBwomHdSbkhTS8TQNayBfnW5DwbvQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/async-function": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/async-function/-/async-function-1.0.0.tgz",
      "integrity": "sha512-hsU18Ae8CDTR6Kgu9DYf0EbCr/a5iGL0rytQDobUcdpYOKokk8LEjVphnXkDkgpi0wYVsqrXuP0bZxJaTqdgoA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/available-typed-arrays": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/available-typed-arrays/-/available-typed-arrays-1.0.7.tgz",
      "integrity": "sha512-wvUjBtSGN7+7SjNpq/9M2Tg350UZD3q62IFZLbRAR1bSMlCo1ZaeW+BJ+D090e4hIIZLBcTDWe4Mh4jvUDajzQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "possible-typed-array-names": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/axe-core": {
      "version": "4.12.1",
      "resolved": "https://registry.npmjs.org/axe-core/-/axe-core-4.12.1.tgz",
      "integrity": "sha512-s7iGf5GaVMxEG0ENN9x+xTr7GFZCb1ZP/1uATUpCEK2X78nDB3RwbtFCo9pGAf9ru+VwoQ464DkaLEeRM08wJA==",
      "dev": true,
      "license": "MPL-2.0",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/axobject-query": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/axobject-query/-/axobject-query-4.1.0.tgz",
      "integrity": "sha512-qIj0G9wZbMGNLjLmg1PT6v2mE9AH2zlnADJD/2tC6E00hgmhUOfEB6greHPAfLRSufHqROIUTkw6E+M3lH0PTQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/baseline-browser-mapping": {
      "version": "2.10.42",
      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.10.42.tgz",
      "integrity": "sha512-c/jurFrDLyui7o1J86yLkRu4LMsTYcBohveus7/I2Hzdn9KIP2bdJPTue/lR1KH46enoPbD77GKeSYNdyPoD3Q==",
      "license": "Apache-2.0",
      "bin": {
        "baseline-browser-mapping": "dist/cli.cjs"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/bcryptjs": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/bcryptjs/-/bcryptjs-3.0.3.tgz",
      "integrity": "sha512-GlF5wPWnSa/X5LKM1o0wz0suXIINz1iHRLvTS+sLyi7XPbe5ycmYI3DlZqVGZZtDgl4DmasFg7gOB3JYbphV5g==",
      "license": "BSD-3-Clause",
      "bin": {
        "bcrypt": "bin/bcrypt"
      }
    },
    "node_modules/brace-expansion": {
      "version": "1.1.16",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.16.tgz",
      "integrity": "sha512-IDw48K2/2kRkg9LdJxurvq3lV3aBgq0REY89duEqFRthjlPdXHKMj7EnQOXVckxzgisinf3nHfrcE2FufFLXMw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/browserslist": {
      "version": "4.28.5",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.28.5.tgz",
      "integrity": "sha512-Cu2E6QejHWzuDMTkuwgpABFgDfZrXLQq5V13YOACZx4mFAG4IwGTbTfHPMr4WtxlHoXSM8FIuRwYYCz5XiabaQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "baseline-browser-mapping": "^2.10.42",
        "caniuse-lite": "^1.0.30001800",
        "electron-to-chromium": "^1.5.387",
        "node-releases": "^2.0.50",
        "update-browserslist-db": "^1.2.3"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/c12": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/c12/-/c12-3.1.0.tgz",
      "integrity": "sha512-uWoS8OU1MEIsOv8p/5a82c3H31LsWVR5qiyXVfBNOzfffjUWtPnhAb4BYI2uG2HfGmZmFjCtui5XNWaps+iFuw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "chokidar": "^4.0.3",
        "confbox": "^0.2.2",
        "defu": "^6.1.4",
        "dotenv": "^16.6.1",
        "exsolve": "^1.0.7",
        "giget": "^2.0.0",
        "jiti": "^2.4.2",
        "ohash": "^2.0.11",
        "pathe": "^2.0.3",
        "perfect-debounce": "^1.0.0",
        "pkg-types": "^2.2.0",
        "rc9": "^2.1.2"
      },
      "peerDependencies": {
        "magicast": "^0.3.5"
      },
      "peerDependenciesMeta": {
        "magicast": {
          "optional": true
        }
      }
    },
    "node_modules/call-bind": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/call-bind/-/call-bind-1.0.9.tgz",
      "integrity": "sha512-a/hy+pNsFUTR+Iz8TCJvXudKVLAnz/DyeSUo10I5yvFDQJBFU2s9uqQpoSrJlroHUKoKqzg+epxyP9lqFdzfBQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "get-intrinsic": "^1.3.0",
        "set-function-length": "^1.2.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/callsites": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001803",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001803.tgz",
      "integrity": "sha512-g/uHREV2ZpK9qMalCsWaxmA6ol+DX8GYhuf3T40RKoP+oL7vhRJh8LNt73PCjpnR6l14FzfPrB5Yux4PKm2meg==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/chokidar": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-4.0.3.tgz",
      "integrity": "sha512-Qgzu8kfBvo+cA4962jnP1KkS6Dop5NS6g7R5LFYJr4b8Ub94PPQXUksCw9PvXoeXPRRddRNC5C1JQUR2SMGtnA==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "readdirp": "^4.0.1"
      },
      "engines": {
        "node": ">= 14.16.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/citty": {
      "version": "0.1.6",
      "resolved": "https://registry.npmjs.org/citty/-/citty-0.1.6.tgz",
      "integrity": "sha512-tskPPKEs8D2KPafUypv2gxwJP8h/OaJmC82QQGGDQcHvXX43xF2VDACcJVmZ0EuSxkpO9Kc4MlrA3q0+FG58AQ==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "consola": "^3.2.3"
      }
    },
    "node_modules/client-only": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/client-only/-/client-only-0.0.1.tgz",
      "integrity": "sha512-IV3Ou0jSMzZrd3pZ48nLkT9DA7Ag1pnPzaiQhpW7c3RbcqqzvzzVu+L8gfqMp/8IM2MQtSiqaCxrrcfu8I8rMA==",
      "license": "MIT"
    },
    "node_modules/clsx": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/clsx/-/clsx-2.1.1.tgz",
      "integrity": "sha512-eYm0QWBtUrBWZWG0d386OGAw16Z995PiOVo2B7bjWSbHedGl5e0ZWaq65kOGgUSNesEIDkB9ISbTg/JK9dhCZA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/confbox": {
      "version": "0.2.4",
      "resolved": "https://registry.npmjs.org/confbox/-/confbox-0.2.4.tgz",
      "integrity": "sha512-ysOGlgTFbN2/Y6Cg3Iye8YKulHw+R2fNXHrgSmXISQdMnomY6eNDprVdW9R5xBguEqI954+S6709UyiO7B+6OQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/consola": {
      "version": "3.4.2",
      "resolved": "https://registry.npmjs.org/consola/-/consola-3.4.2.tgz",
      "integrity": "sha512-5IKcdX0nnYavi6G7TtOhwkYzyjfJlatbjMjuLSfE2kYT5pMDOilZ4OvMhi637CcDICTmz3wARPoyhqyX1Y+XvA==",
      "devOptional": true,
      "license": "MIT",
      "engines": {
        "node": "^14.18.0 || >=16.10.0"
      }
    },
    "node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/create-require": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/create-require/-/create-require-1.1.1.tgz",
      "integrity": "sha512-dcKFX3jn0MpIaXjisoRvexIJVEKzaq7z2rZKxf+MSr9TkdmHmsU4m2lcLojrj/FHl8mk5VxMmYA+ftRkP/3oKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cross-spawn": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
      "integrity": "sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/csstype": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/d3-array": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/d3-array/-/d3-array-3.2.4.tgz",
      "integrity": "sha512-tdQAmyA18i4J7wprpYq8ClcxZy3SC31QMeByyCFyRt7BVHdREQZ5lpzoe5mFEYZUWe+oq8HBvk9JjpibyEV4Jg==",
      "license": "ISC",
      "dependencies": {
        "internmap": "1 - 2"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-color": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-color/-/d3-color-3.1.0.tgz",
      "integrity": "sha512-zg/chbXyeBtMQ1LbD/WSoW2DpC3I0mpmPdW+ynRTj/x2DAWYrIY7qeZIHidozwV24m4iavr15lNwIwLxRmOxhA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-ease": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-ease/-/d3-ease-3.0.1.tgz",
      "integrity": "sha512-wR/XK3D3XcLIZwpbvQwQ5fK+8Ykds1ip7A2Txe0yxncXSdq1L9skcG7blcedkOX+ZcgxGAmLX1FrRGbADwzi0w==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-format": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/d3-format/-/d3-format-3.1.2.tgz",
      "integrity": "sha512-AJDdYOdnyRDV5b6ArilzCPPwc1ejkHcoyFarqlPqT7zRYjhavcT3uSrqcMvsgh2CgoPbK3RCwyHaVyxYcP2Arg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-interpolate": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-interpolate/-/d3-interpolate-3.0.1.tgz",
      "integrity": "sha512-3bYs1rOD33uo8aqJfKP3JWPAibgw8Zm2+L9vBKEHJ2Rg+viTR7o5Mmv5mZcieN+FRYaAOWX5SJATX6k1PWz72g==",
      "license": "ISC",
      "dependencies": {
        "d3-color": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-path": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-path/-/d3-path-3.1.0.tgz",
      "integrity": "sha512-p3KP5HCf/bvjBSSKuXid6Zqijx7wIfNW+J/maPs+iwR35at5JCbLUT0LzF1cnjbCHWhqzQTIN2Jpe8pRebIEFQ==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-scale": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/d3-scale/-/d3-scale-4.0.2.tgz",
      "integrity": "sha512-GZW464g1SH7ag3Y7hXjf8RoUuAFIqklOAq3MRl4OaWabTFJY9PN/E1YklhXLh+OQ3fM9yS2nOkCoS+WLZ6kvxQ==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2.10.0 - 3",
        "d3-format": "1 - 3",
        "d3-interpolate": "1.2.0 - 3",
        "d3-time": "2.1.1 - 3",
        "d3-time-format": "2 - 4"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-shape": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/d3-shape/-/d3-shape-3.2.0.tgz",
      "integrity": "sha512-SaLBuwGm3MOViRq2ABk3eLoxwZELpH6zhl3FbAoJ7Vm1gofKx6El1Ib5z23NUEhF9AsGl7y+dzLe5Cw2AArGTA==",
      "license": "ISC",
      "dependencies": {
        "d3-path": "^3.1.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-time/-/d3-time-3.1.0.tgz",
      "integrity": "sha512-VqKjzBLejbSMT4IgbmVgDjpkYrNWUYJnbCGo874u7MMKIWsILRX+OpX/gTk8MqjpT1A/c6HY2dCA77ZN0lkQ2Q==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time-format": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/d3-time-format/-/d3-time-format-4.1.0.tgz",
      "integrity": "sha512-dJxPBlzC7NugB2PDLwo9Q8JiTR3M3e4/XANkreKSUxF8vvXKqm1Yfq4Q5dl8budlunRVlUUaDUgFt7eA8D6NLg==",
      "license": "ISC",
      "dependencies": {
        "d3-time": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-timer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-timer/-/d3-timer-3.0.1.tgz",
      "integrity": "sha512-ndfJ/JxxMd3nw31uyKoY2naivF+r29V+Lc0svZxe1JvvIRmi8hUsrMvdOwgS1o6uBHmiz91geQ0ylPP0aj1VUA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/damerau-levenshtein": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/damerau-levenshtein/-/damerau-levenshtein-1.0.8.tgz",
      "integrity": "sha512-sdQSFB7+llfUcQHUQO3+B8ERRj0Oa4w9POWMI/puGtuf7gFywGmkaLCElnudfTiKZV+NvHqL0ifzdrI8Ro7ESA==",
      "dev": true,
      "license": "BSD-2-Clause"
    },
    "node_modules/data-view-buffer": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/data-view-buffer/-/data-view-buffer-1.0.2.tgz",
      "integrity": "sha512-EmKO5V3OLXh1rtK2wgXRansaK1/mtVdTUEiEI0W8RkvgT05kfxaH29PliLnpLP73yYO6142Q72QNa8Wx/A5CqQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/data-view-byte-length": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/data-view-byte-length/-/data-view-byte-length-1.0.2.tgz",
      "integrity": "sha512-tuhGbE6CfTM9+5ANGf+oQb72Ky/0+s3xKUpHvShfiz2RxMFgFPjsXuRLBVMtvMs15awe45SRb83D6wH4ew6wlQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/inspect-js"
      }
    },
    "node_modules/data-view-byte-offset": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/data-view-byte-offset/-/data-view-byte-offset-1.0.1.tgz",
      "integrity": "sha512-BS8PfmtDGnrgYdOonGZQdLZslWIeCGFP9tpan0hi1Co2Zr2NKADsvGYA8XxuG/4UWgJ6Cjtv+YJnB6MM69QGlQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decimal.js-light": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/decimal.js-light/-/decimal.js-light-2.5.1.tgz",
      "integrity": "sha512-qIMFpTMZmny+MMIitAB6D7iVPEorVw6YQRWkvarTkT4tBeSLLiHzcwj6q0MmYSFCiVpiqPJTJEYIrpcPzVEIvg==",
      "license": "MIT"
    },
    "node_modules/deep-is": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/deep-is/-/deep-is-0.1.4.tgz",
      "integrity": "sha512-oIPzksmTg4/MriiaYGO+okXDT7ztn/w3Eptv/+gSIdMdKsJo0u4CfYNFJPy+4SKMuCqGw2wxnA+URMg3t8a/bQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/deepmerge-ts": {
      "version": "7.1.5",
      "resolved": "https://registry.npmjs.org/deepmerge-ts/-/deepmerge-ts-7.1.5.tgz",
      "integrity": "sha512-HOJkrhaYsweh+W+e74Yn7YStZOilkoPb6fycpwNLKzSPtruFs48nYis0zy5yJz1+ktUhHxoRDJ27RQAWLIJVJw==",
      "devOptional": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/define-data-property": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/define-data-property/-/define-data-property-1.1.4.tgz",
      "integrity": "sha512-rBMvIzlpA8v6E+SJZoo++HAYqsLrkg7MSfIinMPFhmkorw7X+dOXVJQs+QT69zGkzMyfDnIMN2Wid1+NbL3T+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-define-property": "^1.0.0",
        "es-errors": "^1.3.0",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/define-properties": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.2.1.tgz",
      "integrity": "sha512-8QmQKqEASLd5nx0U1B1okLElbUuuttJ/AnYmRXbbbGDWh6uS208EjD4Xqq/I9wK7u0v6O08XhTWnt5XtEbR6Dg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.0.1",
        "has-property-descriptors": "^1.0.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/defu": {
      "version": "6.1.7",
      "resolved": "https://registry.npmjs.org/defu/-/defu-6.1.7.tgz",
      "integrity": "sha512-7z22QmUWiQ/2d0KkdYmANbRUVABpZ9SNYyH5vx6PZ+nE5bcC0l7uFvEfHlyld/HcGBFTL536ClDt3DEcSlEJAQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/destr": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/destr/-/destr-2.0.5.tgz",
      "integrity": "sha512-ugFTXCtDZunbzasqBxrK93Ik/DRYsO6S/fedkWEMKqt04xZ4csmnmwGDBAb07QWNaGMAmnTIemsYZCksjATwsA==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "license": "Apache-2.0",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/diff": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/diff/-/diff-4.0.4.tgz",
      "integrity": "sha512-X07nttJQkwkfKfvTPG/KSnE2OMdcUCao6+eXF3wmnIQRn2aPAHH3VxDbDOdegkd6JbPsXqShpvEOHfAT+nCNwQ==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.3.1"
      }
    },
    "node_modules/doctrine": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/doctrine/-/doctrine-2.1.0.tgz",
      "integrity": "sha512-35mSku4ZXK0vfCuHEDAwt55dg2jNajHZ1odvF+8SSr82EsZY4QmXfuWso8oEd8zRhVObSN18aM0CjSdoBX7zIw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "esutils": "^2.0.2"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/dotenv": {
      "version": "16.6.1",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-16.6.1.tgz",
      "integrity": "sha512-uBq4egWHTcTt33a72vpSG0z3HnPuIl6NqYcTrKEg2azoEyl2hpW0zqlxysq2pK9HlDIHyHyakeYaYnSAwd8bow==",
      "devOptional": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/effect": {
      "version": "3.21.0",
      "resolved": "https://registry.npmjs.org/effect/-/effect-3.21.0.tgz",
      "integrity": "sha512-PPN80qRokCd1f015IANNhrwOnLO7GrrMQfk4/lnZRE/8j7UPWrNNjPV0uBrZutI/nHzernbW+J0hdqQysHiSnQ==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "@standard-schema/spec": "^1.0.0",
        "fast-check": "^3.23.1"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.389",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.389.tgz",
      "integrity": "sha512-cEto7aeOqBfU1D+c5py5pE+ooscKE75JifxLBdFUZsqAxRS6y7kebtxAZvICszSl05gPjYHDTjY+lXpyGvpJbg==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/emoji-regex": {
      "version": "9.2.2",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-9.2.2.tgz",
      "integrity": "sha512-L18DaJsXSUk2+42pv8mLs5jJT2hqFkFE4j21wOmgbUqsZ2hL72NsUU785g9RXgo3s0ZNgVl42TiHp3ZtOv/Vyg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/empathic": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/empathic/-/empathic-2.0.0.tgz",
      "integrity": "sha512-i6UzDscO/XfAcNYD75CfICkmfLedpyPDdozrLMmQc5ORaQcdMoc21OnlEylMIqI7U8eniKrPMxxtj8k0vhmJhA==",
      "devOptional": true,
      "license": "MIT",
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/es-abstract": {
      "version": "1.24.2",
      "resolved": "https://registry.npmjs.org/es-abstract/-/es-abstract-1.24.2.tgz",
      "integrity": "sha512-2FpH9Q5i2RRwyEP1AylXe6nYLR5OhaJTZwmlcP0dL/+JCbgg7yyEo/sEK6HeGZRf3dFpWwThaRHVApXSkW3xeg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.2",
        "arraybuffer.prototype.slice": "^1.0.4",
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "data-view-buffer": "^1.0.2",
        "data-view-byte-length": "^1.0.2",
        "data-view-byte-offset": "^1.0.1",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "es-set-tostringtag": "^2.1.0",
        "es-to-primitive": "^1.3.0",
        "function.prototype.name": "^1.1.8",
        "get-intrinsic": "^1.3.0",
        "get-proto": "^1.0.1",
        "get-symbol-description": "^1.1.0",
        "globalthis": "^1.0.4",
        "gopd": "^1.2.0",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "internal-slot": "^1.1.0",
        "is-array-buffer": "^3.0.5",
        "is-callable": "^1.2.7",
        "is-data-view": "^1.0.2",
        "is-negative-zero": "^2.0.3",
        "is-regex": "^1.2.1",
        "is-set": "^2.0.3",
        "is-shared-array-buffer": "^1.0.4",
        "is-string": "^1.1.1",
        "is-typed-array": "^1.1.15",
        "is-weakref": "^1.1.1",
        "math-intrinsics": "^1.1.0",
        "object-inspect": "^1.13.4",
        "object-keys": "^1.1.1",
        "object.assign": "^4.1.7",
        "own-keys": "^1.0.1",
        "regexp.prototype.flags": "^1.5.4",
        "safe-array-concat": "^1.1.3",
        "safe-push-apply": "^1.0.0",
        "safe-regex-test": "^1.1.0",
        "set-proto": "^1.0.0",
        "stop-iteration-iterator": "^1.1.0",
        "string.prototype.trim": "^1.2.10",
        "string.prototype.trimend": "^1.0.9",
        "string.prototype.trimstart": "^1.0.8",
        "typed-array-buffer": "^1.0.3",
        "typed-array-byte-length": "^1.0.3",
        "typed-array-byte-offset": "^1.0.4",
        "typed-array-length": "^1.0.7",
        "unbox-primitive": "^1.1.0",
        "which-typed-array": "^1.1.19"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-abstract-get": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/es-abstract-get/-/es-abstract-get-1.0.0.tgz",
      "integrity": "sha512-6PMWXpdhshVvFp+FoWYs1EvG1Nj0tvk0dZM+XcK0xMEM1czRVcP6ohqPWHy6qPagSpC8j4+p89WXlT+xXJs/fg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.2",
        "is-callable": "^1.2.7",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-iterator-helpers": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/es-iterator-helpers/-/es-iterator-helpers-1.3.3.tgz",
      "integrity": "sha512-0PuBxFi+4uPanB97iDxCLWuHeYud2FALrw5HFZGtAF38UpJDbDC8frwp2cnDyae692CQ0dou60UwWfhgsa4U/g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.24.2",
        "es-errors": "^1.3.0",
        "es-set-tostringtag": "^2.1.0",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.3.0",
        "globalthis": "^1.0.4",
        "gopd": "^1.2.0",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.2.0",
        "has-symbols": "^1.1.0",
        "internal-slot": "^1.1.0",
        "iterator.prototype": "^1.1.5",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-shim-unscopables": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/es-shim-unscopables/-/es-shim-unscopables-1.1.0.tgz",
      "integrity": "sha512-d9T8ucsEhh8Bi1woXCf+TIKDIROLG5WCkxg8geBCbvk22kzwC5G2OnXVMO6FUsvQlgUUXQ2itephWDLqDzbeCw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-to-primitive": {
      "version": "1.3.4",
      "resolved": "https://registry.npmjs.org/es-to-primitive/-/es-to-primitive-1.3.4.tgz",
      "integrity": "sha512-yPDz7wqpg1/mmHLmS3tcfTfbw5f1eryXvyghYBffGdERwe+mV7ZcWzTR8LR17Kvqt3qfPurjlonmnq3MKXIOXw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-abstract-get": "^1.0.0",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "is-callable": "^1.2.7",
        "is-date-object": "^1.1.0",
        "is-symbol": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-toolkit": {
      "version": "1.49.0",
      "resolved": "https://registry.npmjs.org/es-toolkit/-/es-toolkit-1.49.0.tgz",
      "integrity": "sha512-G5iZ6Pc/FNRY/soKZHC+TxGDD83rHUDXxzaWhGCX44vAv/tMs56WMusnm/KMNK+luUPsgA9U28cGr4RDlSzL2g==",
      "license": "MIT",
      "workspaces": [
        "docs",
        "benchmarks"
      ]
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint": {
      "version": "9.39.4",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-9.39.4.tgz",
      "integrity": "sha512-XoMjdBOwe/esVgEvLmNsD3IRHkm7fbKIUGvrleloJXUZgDHig2IPWNniv+GwjyJXzuNqVjlr5+4yVUZjycJwfQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.8.0",
        "@eslint-community/regexpp": "^4.12.1",
        "@eslint/config-array": "^0.21.2",
        "@eslint/config-helpers": "^0.4.2",
        "@eslint/core": "^0.17.0",
        "@eslint/eslintrc": "^3.3.5",
        "@eslint/js": "9.39.4",
        "@eslint/plugin-kit": "^0.4.1",
        "@humanfs/node": "^0.16.6",
        "@humanwhocodes/module-importer": "^1.0.1",
        "@humanwhocodes/retry": "^0.4.2",
        "@types/estree": "^1.0.6",
        "ajv": "^6.14.0",
        "chalk": "^4.0.0",
        "cross-spawn": "^7.0.6",
        "debug": "^4.3.2",
        "escape-string-regexp": "^4.0.0",
        "eslint-scope": "^8.4.0",
        "eslint-visitor-keys": "^4.2.1",
        "espree": "^10.4.0",
        "esquery": "^1.5.0",
        "esutils": "^2.0.2",
        "fast-deep-equal": "^3.1.3",
        "file-entry-cache": "^8.0.0",
        "find-up": "^5.0.0",
        "glob-parent": "^6.0.2",
        "ignore": "^5.2.0",
        "imurmurhash": "^0.1.4",
        "is-glob": "^4.0.0",
        "json-stable-stringify-without-jsonify": "^1.0.1",
        "lodash.merge": "^4.6.2",
        "minimatch": "^3.1.5",
        "natural-compare": "^1.4.0",
        "optionator": "^0.9.3"
      },
      "bin": {
        "eslint": "bin/eslint.js"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://eslint.org/donate"
      },
      "peerDependencies": {
        "jiti": "*"
      },
      "peerDependenciesMeta": {
        "jiti": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-config-next": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/eslint-config-next/-/eslint-config-next-16.2.10.tgz",
      "integrity": "sha512-HSybLOY0QKf39i4FWUqPN0xWiNDi6A6UqJmZtgDkS3zMqjXTqULvj/sueXx3cdCG0mVG+qH6k5/qdegklH1d1w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@next/eslint-plugin-next": "16.2.10",
        "eslint-import-resolver-node": "^0.3.6",
        "eslint-import-resolver-typescript": "^3.5.2",
        "eslint-plugin-import": "^2.32.0",
        "eslint-plugin-jsx-a11y": "^6.10.0",
        "eslint-plugin-react": "^7.37.0",
        "eslint-plugin-react-hooks": "^7.0.0",
        "globals": "16.4.0",
        "typescript-eslint": "^8.46.0"
      },
      "peerDependencies": {
        "eslint": ">=9.0.0",
        "typescript": ">=3.3.1"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-config-next/node_modules/globals": {
      "version": "16.4.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-16.4.0.tgz",
      "integrity": "sha512-ob/2LcVVaVGCYN+r14cnwnoDPUufjiYgSqRhiFD0Q1iI4Odora5RE8Iv1D24hAz5oMophRGkGz+yuvQmmUMnMw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint-import-resolver-node": {
      "version": "0.3.10",
      "resolved": "https://registry.npmjs.org/eslint-import-resolver-node/-/eslint-import-resolver-node-0.3.10.tgz",
      "integrity": "sha512-tRrKqFyCaKict5hOd244sL6EQFNycnMQnBe+j8uqGNXYzsImGbGUU4ibtoaBmv5FLwJwcFJNeg1GeVjQfbMrDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "^3.2.7",
        "is-core-module": "^2.16.1",
        "resolve": "^2.0.0-next.6"
      }
    },
    "node_modules/eslint-import-resolver-node/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-import-resolver-typescript": {
      "version": "3.10.1",
      "resolved": "https://registry.npmjs.org/eslint-import-resolver-typescript/-/eslint-import-resolver-typescript-3.10.1.tgz",
      "integrity": "sha512-A1rHYb06zjMGAxdLSkN2fXPBwuSaQ0iO5M/hdyS0Ajj1VBaRp0sPD3dn1FhME3c/JluGFbwSxyCfqdSbtQLAHQ==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@nolyfill/is-core-module": "1.0.39",
        "debug": "^4.4.0",
        "get-tsconfig": "^4.10.0",
        "is-bun-module": "^2.0.0",
        "stable-hash": "^0.0.5",
        "tinyglobby": "^0.2.13",
        "unrs-resolver": "^1.6.2"
      },
      "engines": {
        "node": "^14.18.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint-import-resolver-typescript"
      },
      "peerDependencies": {
        "eslint": "*",
        "eslint-plugin-import": "*",
        "eslint-plugin-import-x": "*"
      },
      "peerDependenciesMeta": {
        "eslint-plugin-import": {
          "optional": true
        },
        "eslint-plugin-import-x": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-module-utils": {
      "version": "2.14.0",
      "resolved": "https://registry.npmjs.org/eslint-module-utils/-/eslint-module-utils-2.14.0.tgz",
      "integrity": "sha512-W2WCRZ9Dqntd+2u8jJcVMV2PKulc6RdLgUUoh/yQr3uB6lo/ZOeGx11sv60/8S4QFFKNslAlWhr9u0Ef7ZW6Ig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "^3.2.7"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependenciesMeta": {
        "eslint": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-module-utils/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-plugin-import": {
      "version": "2.32.0",
      "resolved": "https://registry.npmjs.org/eslint-plugin-import/-/eslint-plugin-import-2.32.0.tgz",
      "integrity": "sha512-whOE1HFo/qJDyX4SnXzP4N6zOWn79WhnCUY/iDR0mPfQZO8wcYE4JClzI2oZrhBnnMUCBCHZhO6VQyoBU95mZA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@rtsao/scc": "^1.1.0",
        "array-includes": "^3.1.9",
        "array.prototype.findlastindex": "^1.2.6",
        "array.prototype.flat": "^1.3.3",
        "array.prototype.flatmap": "^1.3.3",
        "debug": "^3.2.7",
        "doctrine": "^2.1.0",
        "eslint-import-resolver-node": "^0.3.9",
        "eslint-module-utils": "^2.12.1",
        "hasown": "^2.0.2",
        "is-core-module": "^2.16.1",
        "is-glob": "^4.0.3",
        "minimatch": "^3.1.2",
        "object.fromentries": "^2.0.8",
        "object.groupby": "^1.0.3",
        "object.values": "^1.2.1",
        "semver": "^6.3.1",
        "string.prototype.trimend": "^1.0.9",
        "tsconfig-paths": "^3.15.0"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "eslint": "^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9"
      }
    },
    "node_modules/eslint-plugin-import/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-plugin-jsx-a11y": {
      "version": "6.10.2",
      "resolved": "https://registry.npmjs.org/eslint-plugin-jsx-a11y/-/eslint-plugin-jsx-a11y-6.10.2.tgz",
      "integrity": "sha512-scB3nz4WmG75pV8+3eRUQOHZlNSUhFNq37xnpgRkCCELU3XMvXAxLk1eqWWyE22Ki4Q01Fnsw9BA3cJHDPgn2Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "aria-query": "^5.3.2",
        "array-includes": "^3.1.8",
        "array.prototype.flatmap": "^1.3.2",
        "ast-types-flow": "^0.0.8",
        "axe-core": "^4.10.0",
        "axobject-query": "^4.1.0",
        "damerau-levenshtein": "^1.0.8",
        "emoji-regex": "^9.2.2",
        "hasown": "^2.0.2",
        "jsx-ast-utils": "^3.3.5",
        "language-tags": "^1.0.9",
        "minimatch": "^3.1.2",
        "object.fromentries": "^2.0.8",
        "safe-regex-test": "^1.0.3",
        "string.prototype.includes": "^2.0.1"
      },
      "engines": {
        "node": ">=4.0"
      },
      "peerDependencies": {
        "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9"
      }
    },
    "node_modules/eslint-plugin-react": {
      "version": "7.37.5",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react/-/eslint-plugin-react-7.37.5.tgz",
      "integrity": "sha512-Qteup0SqU15kdocexFNAJMvCJEfa2xUKNV4CC1xsVMrIIqEy3SQ/rqyxCWNzfrd3/ldy6HMlD2e0JDVpDg2qIA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-includes": "^3.1.8",
        "array.prototype.findlast": "^1.2.5",
        "array.prototype.flatmap": "^1.3.3",
        "array.prototype.tosorted": "^1.1.4",
        "doctrine": "^2.1.0",
        "es-iterator-helpers": "^1.2.1",
        "estraverse": "^5.3.0",
        "hasown": "^2.0.2",
        "jsx-ast-utils": "^2.4.1 || ^3.0.0",
        "minimatch": "^3.1.2",
        "object.entries": "^1.1.9",
        "object.fromentries": "^2.0.8",
        "object.values": "^1.2.1",
        "prop-types": "^15.8.1",
        "resolve": "^2.0.0-next.5",
        "semver": "^6.3.1",
        "string.prototype.matchall": "^4.0.12",
        "string.prototype.repeat": "^1.0.0"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7"
      }
    },
    "node_modules/eslint-plugin-react-hooks": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react-hooks/-/eslint-plugin-react-hooks-7.1.1.tgz",
      "integrity": "sha512-f2I7Gw6JbvCexzIInuSbZpfdQ44D7iqdWX01FKLvrPgqxoE7oMj8clOfto8U6vYiz4yd5oKu39rRSVOe1zRu0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.24.4",
        "@babel/parser": "^7.24.4",
        "hermes-parser": "^0.25.1",
        "zod": "^3.25.0 || ^4.0.0",
        "zod-validation-error": "^3.5.0 || ^4.0.0"
      },
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "eslint": "^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0-0 || ^9.0.0 || ^10.0.0"
      }
    },
    "node_modules/eslint-scope": {
      "version": "8.4.0",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-8.4.0.tgz",
      "integrity": "sha512-sNXOfKCn74rt8RICKMvJS7XKV/Xk9kA7DyJr8mJik3S7Cwgy3qlkkmyS2uQB3jiJg6VNdZd/pDBJu0nvG2NlTg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "esrecurse": "^4.3.0",
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint-visitor-keys": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-4.2.1.tgz",
      "integrity": "sha512-Uhdk5sfqcee/9H/rCOJikYz67o0a2Tw2hGRPOG2Y1R2dg7brRe1uG0yaNQDHu+TO/uQPF/5eCapvYSmHUjt7JQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/espree": {
      "version": "10.4.0",
      "resolved": "https://registry.npmjs.org/espree/-/espree-10.4.0.tgz",
      "integrity": "sha512-j6PAQ2uUr79PZhBjP5C5fhl8e39FmRnOjsD5lGnWrFU8i2G776tBK7+nP8KuQUTTyAZUwfQqXAgrVH5MbH9CYQ==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "acorn": "^8.15.0",
        "acorn-jsx": "^5.3.2",
        "eslint-visitor-keys": "^4.2.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/esquery": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/esquery/-/esquery-1.7.0.tgz",
      "integrity": "sha512-Ap6G0WQwcU/LHsvLwON1fAQX9Zp0A2Y6Y/cJBl9r/JbW90Zyg4/zbG6zzKa2OTALELarYHmKu0GhpM5EO+7T0g==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "estraverse": "^5.1.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/esrecurse": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/esrecurse/-/esrecurse-4.3.0.tgz",
      "integrity": "sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estraverse": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz",
      "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/esutils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/eventemitter3": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-5.0.4.tgz",
      "integrity": "sha512-mlsTRyGaPBjPedk6Bvw+aqbsXDtoAyAzm5MO7JgU+yVRyMQ5O8bD4Kcci7BS85f93veegeCPkL8R4GLClnjLFw==",
      "license": "MIT"
    },
    "node_modules/exsolve": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/exsolve/-/exsolve-1.1.0.tgz",
      "integrity": "sha512-D+42+T12DdIlJM3uepa55qGiL3sYdLBOxIl2ifQCzCHz4c7eiolaHsi3BIqEr7JxBzxv2pYZQX9kw16ziMcEmw==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/fast-check": {
      "version": "3.23.2",
      "resolved": "https://registry.npmjs.org/fast-check/-/fast-check-3.23.2.tgz",
      "integrity": "sha512-h5+1OzzfCC3Ef7VbtKdcv7zsstUQwUDlYpUTvjeUsJAssPgLn7QzbboPtL5ro04Mq0rPOsMzl7q5hIbRs2wD1A==",
      "devOptional": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/dubzzz"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fast-check"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "pure-rand": "^6.1.0"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-glob": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.3.1.tgz",
      "integrity": "sha512-kNFPyjhh5cKjrUltxs+wFx+ZkbRaxxmZ+X0ZU31SOsxCEtP9VPgtq2teZw1DebupL5GmDaNQ6yKMMVcM41iqDg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.4"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/fast-glob/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-levenshtein": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz",
      "integrity": "sha512-DCXu6Ifhqcks7TZKY3Hxp3y6qphY5SJZmrWMDrKcERSOXWQdMhU9Ig/PYrzyw/ul9jOIyh0N4M0tbC5hodg8dw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fastq": {
      "version": "1.20.1",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.20.1.tgz",
      "integrity": "sha512-GGToxJ/w1x32s/D2EKND7kTil4n8OVk/9mycTc4VDza13lOvpUZTGX3mFSCtV9ksdGBVzvsyAVLM6mHFThxXxw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/file-entry-cache": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/file-entry-cache/-/file-entry-cache-8.0.0.tgz",
      "integrity": "sha512-XXTUwCvisa5oacNGRP9SfNtYBNAMi+RPwBFmblZEF7N7swHYQS6/Zfk7SRwx4D5j3CH211YNRco1DEMNVfZCnQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flat-cache": "^4.0.0"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/flat-cache": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/flat-cache/-/flat-cache-4.0.1.tgz",
      "integrity": "sha512-f7ccFPK3SXFHpx15UIGyRJ/FJQctuKZ0zVuN3frBo4HnK3cay9VEW0R6yPYFHC0AgqhukPzKjq22t5DmAyqGyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flatted": "^3.2.9",
        "keyv": "^4.5.4"
      },
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/flatted": {
      "version": "3.4.2",
      "resolved": "https://registry.npmjs.org/flatted/-/flatted-3.4.2.tgz",
      "integrity": "sha512-PjDse7RzhcPkIJwy5t7KPWQSZ9cAbzQXcafsetQoD7sOJRQlGikNbx7yZp2OotDnJyrDcbyRq3Ttb18iYOqkxA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/for-each": {
      "version": "0.3.5",
      "resolved": "https://registry.npmjs.org/for-each/-/for-each-0.3.5.tgz",
      "integrity": "sha512-dKx12eRCVIzqCxFGplyFKJMPvLEWgmNtUrpTiJIR5u97zEhRG8ySrtboPHZXx7daLxQVrl643cTzbab2tkQjxg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-callable": "^1.2.7"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/function.prototype.name": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/function.prototype.name/-/function.prototype.name-1.2.0.tgz",
      "integrity": "sha512-jObKIik1P2QjPHP5nz5BaOtUlfgS0fWo8IUByNXkM+o+02sJOi94em77GwJKQSJ3gfPHdgzLNrHc1uokV4P/ew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "functions-have-names": "^1.2.3",
        "has-property-descriptors": "^1.0.2",
        "hasown": "^2.0.4",
        "is-callable": "^1.2.7",
        "is-document.all": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/functions-have-names": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/functions-have-names/-/functions-have-names-1.2.3.tgz",
      "integrity": "sha512-xckBUXyTIqT97tq2x2AMb+g163b5JFysYk0x4qxNFwbfQkmNZoiRHb6sPzI9/QV33WeuvVYBUIiD4NzNIyqaRQ==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/generator-function": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/generator-function/-/generator-function-2.0.1.tgz",
      "integrity": "sha512-SFdFmIJi+ybC0vjlHN0ZGVGHc3lgE0DxPAT0djjVg+kjOnSqclqmj0KQ7ykTOLP6YxoqOvuAODGdcHJn+43q3g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/gensync": {
      "version": "1.0.0-beta.2",
      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/get-symbol-description": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/get-symbol-description/-/get-symbol-description-1.1.0.tgz",
      "integrity": "sha512-w9UMqWwJxHNOvoNzSJ2oPF5wvYcvP7jUvYzhp67yEhTi17ZDBBC1z9pTdGuzjD+EFIqLSYRweZjqfiPzQ06Ebg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-tsconfig": {
      "version": "4.14.0",
      "resolved": "https://registry.npmjs.org/get-tsconfig/-/get-tsconfig-4.14.0.tgz",
      "integrity": "sha512-yTb+8DXzDREzgvYmh6s9vHsSVCHeC0G3PI5bEXNBHtmshPnO+S5O7qgLEOn0I5QvMy6kpZN8K1NKGyilLb93wA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "resolve-pkg-maps": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/privatenumber/get-tsconfig?sponsor=1"
      }
    },
    "node_modules/giget": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/giget/-/giget-2.0.0.tgz",
      "integrity": "sha512-L5bGsVkxJbJgdnwyuheIunkGatUF/zssUoxxjACCseZYAVbaqdh9Tsmmlkl8vYan09H7sbvKt4pS8GqKLBrEzA==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "citty": "^0.1.6",
        "consola": "^3.4.0",
        "defu": "^6.1.4",
        "node-fetch-native": "^1.6.6",
        "nypm": "^0.6.0",
        "pathe": "^2.0.3"
      },
      "bin": {
        "giget": "dist/cli.mjs"
      }
    },
    "node_modules/glob-parent": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-6.0.2.tgz",
      "integrity": "sha512-XxwI8EOhVQgWp6iDL+3b0r86f4d6AX6zSU55HfB4ydCEuXLXc5FcYeOu+nnGftS4TEju/11rt4KJPTMgbfmv4A==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/globals": {
      "version": "14.0.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-14.0.0.tgz",
      "integrity": "sha512-oahGvuMGQlPw/ivIYBjVSrWAfWLBeku5tpPE2fOPLi+WHffIWbuh2tCjhyQhTBPMf5E9jDEH4FOmTYgYwbKwtQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/globalthis": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/globalthis/-/globalthis-1.0.4.tgz",
      "integrity": "sha512-DpLKbNU4WylpxJykQujfCcwYWiV/Jhm50Goo0wrVILAv5jOr9d+H+UR3PhSCD2rCCEIg0uc+G+muBTwD54JhDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-properties": "^1.2.1",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-bigints": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-bigints/-/has-bigints-1.1.0.tgz",
      "integrity": "sha512-R3pbpkcIqv2Pm3dUwgjclDRVmWpTJW2DcMzcIhEXEx1oh/CEMObMm3KLmRJOdvhM7o4uQBnwr8pzRK2sJWIqfg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/has-property-descriptors": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-property-descriptors/-/has-property-descriptors-1.0.2.tgz",
      "integrity": "sha512-55JNKuIW+vq4Ke1BjOTjM2YctQIvCT7GFzHwmfZPGo5wnrgkid0YQtnAleFSqumZm4az3n2BS+erby5ipJdgrg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-define-property": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-proto": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/has-proto/-/has-proto-1.2.0.tgz",
      "integrity": "sha512-KIL7eQPfHQRC8+XluaIw7BHUwwqL19bQn4hzNgdr+1wXoU0KKj6rufu47lhY7KbJR2C6T6+PfyN0Ea7wkSS+qQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/hermes-estree": {
      "version": "0.25.1",
      "resolved": "https://registry.npmjs.org/hermes-estree/-/hermes-estree-0.25.1.tgz",
      "integrity": "sha512-0wUoCcLp+5Ev5pDW2OriHC2MJCbwLwuRx+gAqMTOkGKJJiBCLjtrvy4PWUGn6MIVefecRpzoOZ/UV6iGdOr+Cw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/hermes-parser": {
      "version": "0.25.1",
      "resolved": "https://registry.npmjs.org/hermes-parser/-/hermes-parser-0.25.1.tgz",
      "integrity": "sha512-6pEjquH3rqaI6cYAXYPcz9MS4rY6R4ngRgrgfDshRptUZIc3lw0MCIJIGDj9++mfySOuPTHB4nrSW99BCvOPIA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hermes-estree": "0.25.1"
      }
    },
    "node_modules/ignore": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.3.2.tgz",
      "integrity": "sha512-hsBTNUqQTDwkWtcdYI2i06Y/nUBEsNEDJKjWdigLvegy8kDuJAS8uRlpkkcQpyEXL0Z/pjDy5HBmMjRCJ2gq+g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/immer": {
      "version": "11.1.11",
      "resolved": "https://registry.npmjs.org/immer/-/immer-11.1.11.tgz",
      "integrity": "sha512-qzXuyXAkPySAGYkfsAwodDPWT8Zm7/Uo5BNt4BjhMhG5WlWyZZ4wQqnWwdS8kjlQ1Cwu6gjw3A6+0gTQwlyYtw==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/immer"
      }
    },
    "node_modules/import-fresh": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
      "integrity": "sha512-TR3KfrTZTYLPB6jUjfx6MF9WcWrHL9su5TObK4ZkYgBdWKPOFoSoQIdEuTuR82pmtxH2spWG9h6etwfr1pLBqQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "parent-module": "^1.0.0",
        "resolve-from": "^4.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/internal-slot": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/internal-slot/-/internal-slot-1.1.0.tgz",
      "integrity": "sha512-4gd7VpWNQNB4UKKCFFVcp1AVv+FMOgs9NKzjHKusc8jTMhd5eL1NqQqOpE0KzMds804/yHlglp3uxgluOqAPLw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "hasown": "^2.0.2",
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/internmap": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/internmap/-/internmap-2.0.3.tgz",
      "integrity": "sha512-5Hh7Y1wQbvY5ooGgPbDaL5iYLAPzMTUrjMulskHLH6wnv/A+1q5rgEaiuqEjB+oxGXIVZs1FF+R/KPN3ZSQYYg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/is-array-buffer": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/is-array-buffer/-/is-array-buffer-3.0.5.tgz",
      "integrity": "sha512-DDfANUiiG2wC1qawP66qlTugJeL5HyzMpfr8lLK+jMQirGzNod0B12cFB/9q838Ru27sBwfw78/rdoU7RERz6A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-async-function": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-async-function/-/is-async-function-2.1.1.tgz",
      "integrity": "sha512-9dgM/cZBnNvjzaMYHVoxxfPj2QXt22Ev7SuuPrs+xav0ukGB0S6d4ydZdEiM48kLx5kDV+QBPrpVnFyefL8kkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "async-function": "^1.0.0",
        "call-bound": "^1.0.3",
        "get-proto": "^1.0.1",
        "has-tostringtag": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-bigint": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-bigint/-/is-bigint-1.1.0.tgz",
      "integrity": "sha512-n4ZT37wG78iz03xPRKJrHTdZbe3IicyucEtdRsV5yglwc3GyUfbAfpSeD0FJ41NbUNSt5wbhqfp1fS+BgnvDFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-bigints": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-boolean-object": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/is-boolean-object/-/is-boolean-object-1.2.2.tgz",
      "integrity": "sha512-wa56o2/ElJMYqjCjGkXri7it5FbebW5usLw/nPmCMs5DeZ7eziSYZhSmPRn0txqeW4LnAmQQU7FgqLpsEFKM4A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-bun-module": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/is-bun-module/-/is-bun-module-2.0.0.tgz",
      "integrity": "sha512-gNCGbnnnnFAUGKeZ9PdbyeGYJqewpmc2aKHUEMO5nQPWU9lOmv7jcmQIv+qHD8fXW6W7qfuCwX4rY9LNRjXrkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^7.7.1"
      }
    },
    "node_modules/is-bun-module/node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/is-callable": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/is-callable/-/is-callable-1.2.7.tgz",
      "integrity": "sha512-1BC0BVFhS/p0qtw6enp8e+8OD0UrK0oFLztSjNzhcKA3WDuJxxAPXzPuPtKkjEY9UUoEWlX/8fgKeu2S8i9JTA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-core-module": {
      "version": "2.16.2",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.16.2.tgz",
      "integrity": "sha512-evOr8xfXKxE6qSR0hSXL2r3sd7ALj8+7jQEUvPYcm5sgZFdJ+AYzT6yNmJenvIYQBgIGwfwz08sL8zoL7yq2BA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-data-view": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/is-data-view/-/is-data-view-1.0.2.tgz",
      "integrity": "sha512-RKtWF8pGmS87i2D6gqQu/l7EYRlVdfzemCJN/P3UOs//x1QE7mfhvzHIApBTRf7axvT6DMGwSwBXYCT0nfB9xw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "get-intrinsic": "^1.2.6",
        "is-typed-array": "^1.1.13"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-date-object": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-date-object/-/is-date-object-1.1.0.tgz",
      "integrity": "sha512-PwwhEakHVKTdRNVOw+/Gyh0+MzlCl4R6qKvkhuvLtPMggI1WAHt9sOwZxQLSGpUaDnrdyDsomoRgNnCfKNSXXg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-document.all": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/is-document.all/-/is-document.all-1.0.0.tgz",
      "integrity": "sha512-+XSoyS05OdBbhFuELhgTCpFNHkpBOJqtsZfUFFpe5QTw+9Sjbh8zitxhQkYAo6wV7e1Vb8cAPvpCk9jGam/82g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-finalizationregistry": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-finalizationregistry/-/is-finalizationregistry-1.1.1.tgz",
      "integrity": "sha512-1pC6N8qWJbWoPtEjgcL2xyhQOP491EQjeUo3qTKcmV8YSDDJrOepfG8pcC7h/QgnQHYSv0mJ3Z/ZWxmatVrysg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-generator-function": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/is-generator-function/-/is-generator-function-1.1.2.tgz",
      "integrity": "sha512-upqt1SkGkODW9tsGNG5mtXTXtECizwtS2kA161M+gJPc1xdb/Ax629af6YrTwcOeQHbewrPNlE5Dx7kzvXTizA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.4",
        "generator-function": "^2.0.0",
        "get-proto": "^1.0.1",
        "has-tostringtag": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-map": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-map/-/is-map-2.0.3.tgz",
      "integrity": "sha512-1Qed0/Hr2m+YqxnM09CjA2d/i6YZNfF6R2oRAOj36eUdS6qIV/huPJNSEpKbupewFs+ZsJlxsjjPbc0/afW6Lw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-negative-zero": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-negative-zero/-/is-negative-zero-2.0.3.tgz",
      "integrity": "sha512-5KoIu2Ngpyek75jXodFvnafB6DJgr3u8uuK0LEZJjrU19DrMD3EVERaR8sjz8CCGgpZvxPl9SuE1GMVPFHx1mw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-number-object": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-number-object/-/is-number-object-1.1.1.tgz",
      "integrity": "sha512-lZhclumE1G6VYD8VHe35wFaIif+CTy5SJIi5+3y4psDgWu4wPDoBhF8NxUOinEc7pHgiTsT6MaBb92rKhhD+Xw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-regex": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/is-regex/-/is-regex-1.2.1.tgz",
      "integrity": "sha512-MjYsKHO5O7mCsmRGxWcLWheFqN9DJ/2TmngvjKXihe6efViPqc274+Fx/4fYj/r03+ESvBdTXK0V6tA3rgez1g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "gopd": "^1.2.0",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-set": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-set/-/is-set-2.0.3.tgz",
      "integrity": "sha512-iPAjerrse27/ygGLxw+EBR9agv9Y6uLeYVJMu+QNCoouJ1/1ri0mGrcWpfCqFZuzzx3WjtwxG098X+n4OuRkPg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-shared-array-buffer": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-shared-array-buffer/-/is-shared-array-buffer-1.0.4.tgz",
      "integrity": "sha512-ISWac8drv4ZGfwKl5slpHG9OwPNty4jOWPRIhBpxOoD+hqITiwuipOQ2bNthAzwA3B4fIjO4Nln74N0S9byq8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-string": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-string/-/is-string-1.1.1.tgz",
      "integrity": "sha512-BtEeSsoaQjlSPBemMQIrY1MY0uM6vnS1g5fmufYOtnxLGUZM2178PKbhsk7Ffv58IX+ZtcvoGwccYsh0PglkAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-symbol": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-symbol/-/is-symbol-1.1.1.tgz",
      "integrity": "sha512-9gGx6GTtCQM73BgmHQXfDmLtfjjTUDSyoxTCbp5WtoixAhfgsDirWIcVQ/IHpvI5Vgd5i/J5F7B9cN/WlVbC/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-symbols": "^1.1.0",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-typed-array": {
      "version": "1.1.15",
      "resolved": "https://registry.npmjs.org/is-typed-array/-/is-typed-array-1.1.15.tgz",
      "integrity": "sha512-p3EcsicXjit7SaskXHs1hA91QxgTw46Fv6EFKKGS5DRFLD8yKnohjF3hxoju94b/OcMZoQukzpPpBE9uLVKzgQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "which-typed-array": "^1.1.16"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakmap": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/is-weakmap/-/is-weakmap-2.0.2.tgz",
      "integrity": "sha512-K5pXYOm9wqY1RgjpL3YTkF39tni1XajUIkawTLUo9EZEVUFga5gSQJF8nNS7ZwJQ02y+1YCNYcMh+HIf1ZqE+w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakref": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-weakref/-/is-weakref-1.1.1.tgz",
      "integrity": "sha512-6i9mGWSlqzNMEqpCp93KwRS1uUOodk2OJ6b+sq7ZPDSy2WuI5NFIxp/254TytR8ftefexkWn5xNiHUNpPOfSew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakset": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/is-weakset/-/is-weakset-2.0.4.tgz",
      "integrity": "sha512-mfcwb6IzQyOKTs84CQMrOwW4gQcaTOAWJ0zzJCl2WSPDrWk/OzDaImWFH3djXhb24g4eudZfLRozAvPGw4d9hQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/isarray": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/isarray/-/isarray-2.0.5.tgz",
      "integrity": "sha512-xHjhDr3cNBK0BzdUJSPXZntQUx/mwMS5Rw4A7lPJ90XGAO6ISP/ePDNuo0vhqOZU+UD5JoodwCAAoZQd3FeAKw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/iterator.prototype": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/iterator.prototype/-/iterator.prototype-1.1.5.tgz",
      "integrity": "sha512-H0dkQoCa3b2VEeKQBOxFph+JAbcrQdE7KC0UkqwpLmv2EC4P41QXP+rqo9wYodACiG5/WM5s9oDApTU8utwj9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.6",
        "get-proto": "^1.0.0",
        "has-symbols": "^1.1.0",
        "set-function-name": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/jiti": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-2.7.0.tgz",
      "integrity": "sha512-AC/7JofJvZGrrneWNaEnJeOLUx+JlGt7tNa0wZiRPT4MY1wmfKjt2+6O2p2uz2+skll8OZZmJMNqeke7kKbNgQ==",
      "devOptional": true,
      "license": "MIT",
      "bin": {
        "jiti": "lib/jiti-cli.mjs"
      }
    },
    "node_modules/jose": {
      "version": "6.2.3",
      "resolved": "https://registry.npmjs.org/jose/-/jose-6.2.3.tgz",
      "integrity": "sha512-YYVDInQKFJfR/xa3ojUTl8c2KoTwiL1R5Wg9YCydwH0x0B9grbzlg5HC7mMjCtUJjbQ/YnGEZIhI5tCgfTb4Hw==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/js-yaml": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.3.0.tgz",
      "integrity": "sha512-1td788aAnnZ5qs7V2QIRl1owjtYpbKt749Y3xauqQgwIIGF/xXWz1wMTEBx5O3LK3lXLVuqXPdPxj2BoFHaW9Q==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/puzrin"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/nodeca"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/jsesc": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jsesc": "bin/jsesc"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/json-buffer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.1.tgz",
      "integrity": "sha512-4bV5BfR2mqfQTJm+V5tPPdf+ZpuhiIvTuAB5g8kcrXOZpTT/QwwVRWBywX1ozr6lEuPdbHxwaJlm9G6mI2sfSQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-stable-stringify-without-jsonify": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/json-stable-stringify-without-jsonify/-/json-stable-stringify-without-jsonify-1.0.1.tgz",
      "integrity": "sha512-Bdboy+l7tA3OGW6FjyFHWkP5LuByj1Tk33Ljyq0axyzdk9//JSi2u3fP1QSmd1KNwq6VOKYGlAu87CisVir6Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json5": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "json5": "lib/cli.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/jsonwebtoken": {
      "version": "9.0.3",
      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.3.tgz",
      "integrity": "sha512-MT/xP0CrubFRNLNKvxJ2BYfy53Zkm++5bX9dtuPbqAeQpTVe0MQTFhao8+Cp//EmJp244xt6Drw/GVEGCUj40g==",
      "license": "MIT",
      "dependencies": {
        "jws": "^4.0.1",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=12",
        "npm": ">=6"
      }
    },
    "node_modules/jsonwebtoken/node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/jsx-ast-utils": {
      "version": "3.3.5",
      "resolved": "https://registry.npmjs.org/jsx-ast-utils/-/jsx-ast-utils-3.3.5.tgz",
      "integrity": "sha512-ZZow9HBI5O6EPgSJLUb8n2NKgmVWTwCvHGwFuJlMjvLFqlGG6pjirPhtdsseaLZjSibD8eegzmYpUZwoIlj2cQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-includes": "^3.1.6",
        "array.prototype.flat": "^1.3.1",
        "object.assign": "^4.1.4",
        "object.values": "^1.1.6"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/jwa": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-2.0.1.tgz",
      "integrity": "sha512-hRF04fqJIP8Abbkq5NKGN0Bbr3JxlQ+qhZufXVr0DvujKy93ZCbXZMHDL4EOtodSbCWxOqR8MS1tXA5hwqCXDg==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/jws/-/jws-4.0.1.tgz",
      "integrity": "sha512-EKI/M/yqPncGUUh44xz0PxSidXFr/+r0pA70+gIYhjv+et7yxM+s29Y+VGDkovRofQem0fs7Uvf4+YmAdyRduA==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^2.0.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/keyv": {
      "version": "4.5.4",
      "resolved": "https://registry.npmjs.org/keyv/-/keyv-4.5.4.tgz",
      "integrity": "sha512-oxVHkHR/EJf2CNXnWxRLW6mg7JyCCUcG0DtEGmL2ctUo1PNTin1PUil+r/+4r5MpVgC/fn1kjsx7mjSujKqIpw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "json-buffer": "3.0.1"
      }
    },
    "node_modules/language-subtag-registry": {
      "version": "0.3.23",
      "resolved": "https://registry.npmjs.org/language-subtag-registry/-/language-subtag-registry-0.3.23.tgz",
      "integrity": "sha512-0K65Lea881pHotoGEa5gDlMxt3pctLi2RplBb7Ezh4rRdLEOtgi7n4EwK9lamnUCkKBqaeKRVebTq6BAxSkpXQ==",
      "dev": true,
      "license": "CC0-1.0"
    },
    "node_modules/language-tags": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/language-tags/-/language-tags-1.0.9.tgz",
      "integrity": "sha512-MbjN408fEndfiQXbFQ1vnd+1NoLDsnQW41410oQBXiyXDMYH5z505juWa4KUE1LqxRC7DgOgZDbKLxHIwm27hA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "language-subtag-registry": "^0.3.20"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/levn": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/levn/-/levn-0.4.1.tgz",
      "integrity": "sha512-+bT2uH4E5LGE7h/n3evcS/sQlJXCpIp6ym8OWJ5eV6+67Dsql/LaaT7qJBAt2rzfoa/5QBGBhxDix1dMt2kQKQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1",
        "type-check": "~0.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.merge": {
      "version": "4.6.2",
      "resolved": "https://registry.npmjs.org/lodash.merge/-/lodash.merge-4.6.2.tgz",
      "integrity": "sha512-0KpjqXRVvrYyCsX1swR/XTK0va6VQkQM6MNo7PqW77ByjAhoARA8EfrP1N4+KlKj8YS0ZUCtRT/YUuhyYDujIQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      },
      "bin": {
        "loose-envify": "cli.js"
      }
    },
    "node_modules/lru-cache": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^3.0.2"
      }
    },
    "node_modules/lucide-react": {
      "version": "1.24.0",
      "resolved": "https://registry.npmjs.org/lucide-react/-/lucide-react-1.24.0.tgz",
      "integrity": "sha512-YT6mBD8lGKkg4nM39enlm94/sfJIiW0YKUT60fBy4YK8tai31ylg1VhGNWxkpSKHo9UagfnZqwIff3HTDQwXeA==",
      "license": "ISC",
      "peerDependencies": {
        "react": "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/make-error": {
      "version": "1.3.6",
      "resolved": "https://registry.npmjs.org/make-error/-/make-error-1.3.6.tgz",
      "integrity": "sha512-s8UhlNe7vPKomQhC1qFelMokr/Sc3AgNbso3n74mVPA5LTZwkB9NlXf4XPamLxJE8h0gh73rM94xvwRT2CVInw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/micromatch": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.8.tgz",
      "integrity": "sha512-PXwfBhYu0hBCPw8Dn0E+WDYb7af3dSLVWKi3HGv84IdF4TyFoC0ysxFd0Goxw7nSv4T/PzEJQxsYsEiFCKo2BA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "braces": "^3.0.3",
        "picomatch": "^2.3.1"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/minimatch": {
      "version": "3.1.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz",
      "integrity": "sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/minimist": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/minimist/-/minimist-1.2.8.tgz",
      "integrity": "sha512-2yyAR8qBkN3YuheJanUpWC5U3bb5osDywNB8RzDVlDwDHbocAJveqqj1u8+SVD7jkWT4yvsHCpWqqWqAxb0zCA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/nanoid": {
      "version": "3.3.15",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.15.tgz",
      "integrity": "sha512-y7Wygv/7mEOvxTuEQDB8StXdMRBWf1kR/tlhAzBRUFkB2jfcLOAxO/SHmOO2zgz1pVgK29/kyupn059/bCHdjA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/napi-postinstall": {
      "version": "0.3.4",
      "resolved": "https://registry.npmjs.org/napi-postinstall/-/napi-postinstall-0.3.4.tgz",
      "integrity": "sha512-PHI5f1O0EP5xJ9gQmFGMS6IZcrVvTjpXjz7Na41gTE7eE2hK11lg04CECCYEEjdc17EV4DO+fkGEtt7TpTaTiQ==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "napi-postinstall": "lib/cli.js"
      },
      "engines": {
        "node": "^12.20.0 || ^14.18.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/napi-postinstall"
      }
    },
    "node_modules/natural-compare": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/next": {
      "version": "16.2.10",
      "resolved": "https://registry.npmjs.org/next/-/next-16.2.10.tgz",
      "integrity": "sha512-2som5AVXb3kE6Yjine3/mNbBayYF58eguBWIVVUdr1y/L426xyVEgYxgBG+1QC34P2x5E+tcDup6XkuOAX3dCA==",
      "license": "MIT",
      "dependencies": {
        "@next/env": "16.2.10",
        "@swc/helpers": "0.5.15",
        "baseline-browser-mapping": "^2.9.19",
        "caniuse-lite": "^1.0.30001579",
        "postcss": "8.4.31",
        "styled-jsx": "5.1.6"
      },
      "bin": {
        "next": "dist/bin/next"
      },
      "engines": {
        "node": ">=20.9.0"
      },
      "optionalDependencies": {
        "@next/swc-darwin-arm64": "16.2.10",
        "@next/swc-darwin-x64": "16.2.10",
        "@next/swc-linux-arm64-gnu": "16.2.10",
        "@next/swc-linux-arm64-musl": "16.2.10",
        "@next/swc-linux-x64-gnu": "16.2.10",
        "@next/swc-linux-x64-musl": "16.2.10",
        "@next/swc-win32-arm64-msvc": "16.2.10",
        "@next/swc-win32-x64-msvc": "16.2.10",
        "sharp": "^0.34.5"
      },
      "peerDependencies": {
        "@opentelemetry/api": "^1.1.0",
        "@playwright/test": "^1.51.1",
        "babel-plugin-react-compiler": "*",
        "react": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
        "react-dom": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
        "sass": "^1.3.0"
      },
      "peerDependenciesMeta": {
        "@opentelemetry/api": {
          "optional": true
        },
        "@playwright/test": {
          "optional": true
        },
        "babel-plugin-react-compiler": {
          "optional": true
        },
        "sass": {
          "optional": true
        }
      }
    },
    "node_modules/next-auth": {
      "version": "5.0.0-beta.31",
      "resolved": "https://registry.npmjs.org/next-auth/-/next-auth-5.0.0-beta.31.tgz",
      "integrity": "sha512-1OBgCKPzo+S7UWWMp3xgvGvIJ0OpV7B3vR4ZDRqD9a4Ch+OT6dakLXG9ivhtmIWVa71nTSXattOHyCg8sNi8/Q==",
      "license": "ISC",
      "dependencies": {
        "@auth/core": "0.41.2"
      },
      "peerDependencies": {
        "@simplewebauthn/browser": "^9.0.1",
        "@simplewebauthn/server": "^9.0.2",
        "next": "^14.0.0-0 || ^15.0.0 || ^16.0.0",
        "nodemailer": "^7.0.7",
        "react": "^18.2.0 || ^19.0.0"
      },
      "peerDependenciesMeta": {
        "@simplewebauthn/browser": {
          "optional": true
        },
        "@simplewebauthn/server": {
          "optional": true
        },
        "nodemailer": {
          "optional": true
        }
      }
    },
    "node_modules/node-exports-info": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/node-exports-info/-/node-exports-info-1.6.2.tgz",
      "integrity": "sha512-kXs9Go0cah0qHVV2v389IXQLdLCeE1xfFtjOAF+iobu0OIoG1pje8At2vMHyaPMiPMnG/LWP50twML21eMcAag==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array.prototype.flatmap": "^1.3.3",
        "es-errors": "^1.3.0",
        "object.entries": "^1.1.9",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/node-fetch-native": {
      "version": "1.6.7",
      "resolved": "https://registry.npmjs.org/node-fetch-native/-/node-fetch-native-1.6.7.tgz",
      "integrity": "sha512-g9yhqoedzIUm0nTnTqAQvueMPVOuIY16bqgAJJC8XOOubYFNwz6IER9qs0Gq2Xd0+CecCKFjtdDTMA4u4xG06Q==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/node-releases": {
      "version": "2.0.50",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.50.tgz",
      "integrity": "sha512-J6l92tKHX6w8Jy5nO1Vuc01NoIiRGi/d6qBKVxh+IQ8Cr3b6HbVNfKiF8ZpFKufTwpwxMmce2W3iQZ861ZRyTg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/nypm": {
      "version": "0.6.8",
      "resolved": "https://registry.npmjs.org/nypm/-/nypm-0.6.8.tgz",
      "integrity": "sha512-Q9K4Diu6l5u6xJQogeFSs/zKtyMSgFKFtRQV+tHP4kL7KPm2grpBU0dFIwFaXwNxN0MtfKWc43VpCugAa+LPsw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "citty": "^0.2.2",
        "pathe": "^2.0.3",
        "tinyexec": "^1.2.4"
      },
      "bin": {
        "nypm": "dist/cli.mjs"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/nypm/node_modules/citty": {
      "version": "0.2.2",
      "resolved": "https://registry.npmjs.org/citty/-/citty-0.2.2.tgz",
      "integrity": "sha512-+6vJA3L98yv+IdfKGZHBNiGW5KHn22e/JwID0Strsz8h4S/csAu/OuICwxrg44k5MRiZHWIo8XXuJgQTriRP4w==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/oauth4webapi": {
      "version": "3.8.6",
      "resolved": "https://registry.npmjs.org/oauth4webapi/-/oauth4webapi-3.8.6.tgz",
      "integrity": "sha512-iwemM91xz8nryHti2yTmg5fhyEMVOkOXwHNqbvcATjyajb5oQxCQzrNOA6uElRHuMhQQTKUyFKV9y/CNyg25BQ==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object-keys": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-1.1.1.tgz",
      "integrity": "sha512-NuAESUOUMrlIXOfHKzD6bpPu3tYt3xvjNdRIQ+FeT0lNb4K8WR70CaDxhuNguS2XG+GjkyMwOzsN5ZktImfhLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.assign": {
      "version": "4.1.7",
      "resolved": "https://registry.npmjs.org/object.assign/-/object.assign-4.1.7.tgz",
      "integrity": "sha512-nK28WOo+QIjBkDduTINE4JkF/UJJKyf2EJxvJKfblDpyg0Q+pkOHNTL0Qwy6NP6FhE/EnzV73BxxqcJaXY9anw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0",
        "has-symbols": "^1.1.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.entries": {
      "version": "1.1.9",
      "resolved": "https://registry.npmjs.org/object.entries/-/object.entries-1.1.9.tgz",
      "integrity": "sha512-8u/hfXFRBD1O0hPUjioLhoWFHRmt6tKA4/vZPyckBr18l1KE9uHrFaFaUi8MDRTpi4uak2goyPTSNJLXX2k2Hw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.fromentries": {
      "version": "2.0.8",
      "resolved": "https://registry.npmjs.org/object.fromentries/-/object.fromentries-2.0.8.tgz",
      "integrity": "sha512-k6E21FzySsSK5a21KRADBd/NGneRegFO5pLHfdQLpRDETUNJueLXs3WCzyQ3tFRDYgbq3KHGXfTbi2bs8WQ6rQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.groupby": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/object.groupby/-/object.groupby-1.0.3.tgz",
      "integrity": "sha512-+Lhy3TQTuzXI5hevh8sBGqbmurHbbIjAi0Z4S63nthVLmLxfbj4T54a4CfZrXIrt9iP4mVAPYMo/v99taj3wjQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.values": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/object.values/-/object.values-1.2.1.tgz",
      "integrity": "sha512-gXah6aZrcUxjWg2zR2MwouP2eHlCBzdV4pygudehaKXSGW4v2AsRQUK+lwwXhii6KFZcunEnmSUoYp5CXibxtA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/ohash": {
      "version": "2.0.11",
      "resolved": "https://registry.npmjs.org/ohash/-/ohash-2.0.11.tgz",
      "integrity": "sha512-RdR9FQrFwNBNXAr4GixM8YaRZRJ5PUWbKYbE5eOsrwAjJW0q2REGcf79oYPsLyskQCZG1PLN+S/K1V00joZAoQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/optionator": {
      "version": "0.9.4",
      "resolved": "https://registry.npmjs.org/optionator/-/optionator-0.9.4.tgz",
      "integrity": "sha512-6IpQ7mKUxRcZNLIObR0hz7lxsapSSIYNZJwXPGeF0mTVqGKFIXj1DQcMoT22S3ROcLyY/rz0PWaWZ9ayWmad9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "deep-is": "^0.1.3",
        "fast-levenshtein": "^2.0.6",
        "levn": "^0.4.1",
        "prelude-ls": "^1.2.1",
        "type-check": "^0.4.0",
        "word-wrap": "^1.2.5"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/own-keys": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/own-keys/-/own-keys-1.0.1.tgz",
      "integrity": "sha512-qFOyK5PjiWZd+QQIh+1jhdb9LpxTF0qs7Pm8o5QHYZ0M3vKqSqzsZaEB6oWlxZ+q2sJBMI/Ktgd2N5ZwQoRHfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "get-intrinsic": "^1.2.6",
        "object-keys": "^1.1.1",
        "safe-push-apply": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/parent-module": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/parent-module/-/parent-module-1.0.1.tgz",
      "integrity": "sha512-GQ2EWRpQV8/o+Aw8YqtfZZPfNRWZYkbidE9k5rpl/hC3vtHHBfGm2Ifi6qWV+coDGkrUKZAxE3Lot5kcsRlh+g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "callsites": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/pathe": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/pathe/-/pathe-2.0.3.tgz",
      "integrity": "sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/perfect-debounce": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/perfect-debounce/-/perfect-debounce-1.0.0.tgz",
      "integrity": "sha512-xCy9V055GLEqoFaHoC1SoLIaLmWctgCUaBaWxDZ7/Zx4CTyX7cJQLJOok/orfjZAh9kEYpjJa4d0KcJmCbctZA==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "2.3.2",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.2.tgz",
      "integrity": "sha512-V7+vQEJ06Z+c5tSye8S+nHUfI51xoXIXjHQ99cQtKUkQqqO1kO/KCJUfZXuB47h/YBlDhah2H3hdUGXn8ie0oA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pkg-types": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/pkg-types/-/pkg-types-2.3.1.tgz",
      "integrity": "sha512-y+ichcgc2LrADuhLNAx8DFjVfgz91pRxfZdI3UDhxHvcVEZsenLO+7XaU5vOp0u/7V/wZ+plyuQxtrDlZJ+yeg==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "confbox": "^0.2.4",
        "exsolve": "^1.0.8",
        "pathe": "^2.0.3"
      }
    },
    "node_modules/possible-typed-array-names": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/possible-typed-array-names/-/possible-typed-array-names-1.1.0.tgz",
      "integrity": "sha512-/+5VFTchJDoVj3bhoqi6UeymcD00DAwb1nJwamzPvHEszJ4FpF6SNNbUbOS8yI56qHzdV8eK0qEfOSiodkTdxg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/postcss": {
      "version": "8.4.31",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.31.tgz",
      "integrity": "sha512-PS08Iboia9mts/2ygV3eLpY5ghnUcfLV/EXTOW1E2qYxJKGGBUtNjN76FYHnMs36RmARn41bC0AZmn+rR0OVpQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.6",
        "picocolors": "^1.0.0",
        "source-map-js": "^1.0.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/preact": {
      "version": "10.24.3",
      "resolved": "https://registry.npmjs.org/preact/-/preact-10.24.3.tgz",
      "integrity": "sha512-Z2dPnBnMUfyQfSQ+GBdsGa16hz35YmLmtTLhM169uW944hYL6xzTYkJjC07j+Wosz733pMWx0fgON3JNw1jJQA==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/preact"
      }
    },
    "node_modules/preact-render-to-string": {
      "version": "6.5.11",
      "resolved": "https://registry.npmjs.org/preact-render-to-string/-/preact-render-to-string-6.5.11.tgz",
      "integrity": "sha512-ubnauqoGczeGISiOh6RjX0/cdaF8v/oDXIjO85XALCQjwQP+SB4RDXXtvZ6yTYSjG+PC1QRP2AhPgCEsM2EvUw==",
      "license": "MIT",
      "peerDependencies": {
        "preact": ">=10"
      }
    },
    "node_modules/prelude-ls": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
      "integrity": "sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/prisma": {
      "version": "6.19.3",
      "resolved": "https://registry.npmjs.org/prisma/-/prisma-6.19.3.tgz",
      "integrity": "sha512-++ZJ0ijLrDJF6hNB4t4uxg2br3fC4H9Yc9tcbjr2fcNFP3rh/SBNrAgjhsqBU4Ght8JPrVofG/ZkXfnSfnYsFg==",
      "devOptional": true,
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@prisma/config": "6.19.3",
        "@prisma/engines": "6.19.3"
      },
      "bin": {
        "prisma": "build/index.js"
      },
      "engines": {
        "node": ">=18.18"
      },
      "peerDependencies": {
        "typescript": ">=5.1.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/prop-types": {
      "version": "15.8.1",
      "resolved": "https://registry.npmjs.org/prop-types/-/prop-types-15.8.1.tgz",
      "integrity": "sha512-oj87CgZICdulUohogVAR7AjlC0327U4el4L6eAvOqCeudMDVU0NThNaV+b9Df4dXgSP1gXMTnPdhfe/2qDH5cg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.4.0",
        "object-assign": "^4.1.1",
        "react-is": "^16.13.1"
      }
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/pure-rand": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/pure-rand/-/pure-rand-6.1.0.tgz",
      "integrity": "sha512-bVWawvoZoBYpp6yIoQtQXHZjmz35RSVHnUOTefl8Vcjr8snTPY1wnpSPMWekcFwbxI6gtmT7rSYPFvz71ldiOA==",
      "devOptional": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/dubzzz"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fast-check"
        }
      ],
      "license": "MIT"
    },
    "node_modules/queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/rc9": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/rc9/-/rc9-2.1.2.tgz",
      "integrity": "sha512-btXCnMmRIBINM2LDZoEmOogIZU7Qe7zn4BpomSKZ/ykbLObuBdvG+mFq11DL6fjH1DRwHhrlgtYWG96bJiC7Cg==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "defu": "^6.1.4",
        "destr": "^2.0.3"
      }
    },
    "node_modules/react": {
      "version": "19.2.4",
      "resolved": "https://registry.npmjs.org/react/-/react-19.2.4.tgz",
      "integrity": "sha512-9nfp2hYpCwOjAN+8TZFGhtWEwgvWHXqESH8qT89AT/lWklpLON22Lc8pEtnpsZz7VmawabSU0gCjnj8aC0euHQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-dom": {
      "version": "19.2.4",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.2.4.tgz",
      "integrity": "sha512-AXJdLo8kgMbimY95O2aKQqsz2iWi9jMgKJhRBAxECE4IFxfcazB2LmzloIoibJI3C12IlY20+KFaLv+71bUJeQ==",
      "license": "MIT",
      "dependencies": {
        "scheduler": "^0.27.0"
      },
      "peerDependencies": {
        "react": "^19.2.4"
      }
    },
    "node_modules/react-is": {
      "version": "16.13.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-16.13.1.tgz",
      "integrity": "sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ==",
      "license": "MIT"
    },
    "node_modules/react-redux": {
      "version": "9.3.0",
      "resolved": "https://registry.npmjs.org/react-redux/-/react-redux-9.3.0.tgz",
      "integrity": "sha512-KQopgqFo/p/fgmAs5qz6p5RWaNAzq40WAu7fJIXnQpYxFPbJYtsJPWvGeF2rOBaY/kEuV77AVsX8TsQzKm+A/g==",
      "license": "MIT",
      "dependencies": {
        "@types/use-sync-external-store": "^0.0.6",
        "use-sync-external-store": "^1.4.0"
      },
      "peerDependencies": {
        "@types/react": "^18.2.25 || ^19",
        "react": "^18.0 || ^19",
        "redux": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "redux": {
          "optional": true
        }
      }
    },
    "node_modules/readdirp": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-4.1.2.tgz",
      "integrity": "sha512-GDhwkLfywWL2s6vEjyhri+eXmfH6j1L7JE27WhqLeYzoh/A3DBaYGEj2H/HFZCn/kMfim73FXxEJTw06WtxQwg==",
      "devOptional": true,
      "license": "MIT",
      "engines": {
        "node": ">= 14.18.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/recharts": {
      "version": "3.9.2",
      "resolved": "https://registry.npmjs.org/recharts/-/recharts-3.9.2.tgz",
      "integrity": "sha512-G4fy+Pk46RaXgwWMh+Nzhyo/lbFAVqXo9gtetlyehe6Ehge9CsgDuOTwQDD+i1+llaLktNBiNq4bhnGlDRXFtw==",
      "license": "MIT",
      "workspaces": [
        "www"
      ],
      "dependencies": {
        "@reduxjs/toolkit": "^1.9.0 || 2.x.x",
        "clsx": "^2.1.1",
        "decimal.js-light": "^2.5.1",
        "es-toolkit": "^1.39.3",
        "eventemitter3": "^5.0.1",
        "immer": "^11.1.8",
        "react-redux": "8.x.x || 9.x.x",
        "reselect": "5.2.0",
        "tiny-invariant": "^1.3.3",
        "use-sync-external-store": "^1.2.2",
        "victory-vendor": "^37.0.2"
      },
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-dom": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-is": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/redux": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/redux/-/redux-5.0.1.tgz",
      "integrity": "sha512-M9/ELqF6fy8FwmkpnF0S3YKOqMyoWJ4+CS5Efg2ct3oY9daQvd/Pc71FpGZsVsbl3Cpb+IIcjBDUnnyBdQbq4w==",
      "license": "MIT"
    },
    "node_modules/redux-thunk": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/redux-thunk/-/redux-thunk-3.1.0.tgz",
      "integrity": "sha512-NW2r5T6ksUKXCabzhL9z+h206HQw/NJkcLm1GPImRQ8IzfXwRGqjVhKJGauHirT0DAuyy6hjdnMZaRoAcy0Klw==",
      "license": "MIT",
      "peerDependencies": {
        "redux": "^5.0.0"
      }
    },
    "node_modules/reflect.getprototypeof": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/reflect.getprototypeof/-/reflect.getprototypeof-1.0.10.tgz",
      "integrity": "sha512-00o4I+DVrefhv+nX0ulyi3biSHCPDe+yLv5o/p6d/UVlirijB8E16FtfwSAi4g3tcqrQ4lRAqQSoFEZJehYEcw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.9",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.7",
        "get-proto": "^1.0.1",
        "which-builtin-type": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/regexp.prototype.flags": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/regexp.prototype.flags/-/regexp.prototype.flags-1.5.4.tgz",
      "integrity": "sha512-dYqgNSZbDwkaJ2ceRd9ojCGjBq+mOm9LmtXnAnEGyHhN/5R7iDW2TRw3h+o/jCFxus3P2LfWIIiwowAjANm7IA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-errors": "^1.3.0",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "set-function-name": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/reselect": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/reselect/-/reselect-5.2.0.tgz",
      "integrity": "sha512-AgZ3UOZm3YndfrJ4OYjgrT7bmCm/1iqkjvEfH/oYjzh6PD2qw4QuT3jjnXIrpdt4MTpMXclMT3lXbmRY+XRakw==",
      "license": "MIT"
    },
    "node_modules/resolve": {
      "version": "2.0.0-next.7",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-2.0.0-next.7.tgz",
      "integrity": "sha512-tqt+NBWwyaMgw3zDsnygx4CByWjQEJHOPMdslYhppaQSJUtL/D4JO9CcBBlhPoI8lz9oJIDXkwXfhF4aWqP8xQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "is-core-module": "^2.16.2",
        "node-exports-info": "^1.6.0",
        "object-keys": "^1.1.1",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-from": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-4.0.0.tgz",
      "integrity": "sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/resolve-pkg-maps": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/resolve-pkg-maps/-/resolve-pkg-maps-1.0.0.tgz",
      "integrity": "sha512-seS2Tj26TBVOC2NIc2rOe2y2ZO7efxITtLZcGSOnHHNOQ7CkiUBfw0Iw2ck6xkIhPwLhKNLS8BO+hEpngQlqzw==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/privatenumber/resolve-pkg-maps?sponsor=1"
      }
    },
    "node_modules/reusify": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.1.0.tgz",
      "integrity": "sha512-g6QUff04oZpHs0eG5p83rFLhHeV00ug/Yf9nZM6fLeUrPguBTkTQOdpAWWspMh55TZfVQDPaN3NQJfbVRAxdIw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "queue-microtask": "^1.2.2"
      }
    },
    "node_modules/safe-array-concat": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/safe-array-concat/-/safe-array-concat-1.1.4.tgz",
      "integrity": "sha512-wtZlHyOje6OZTGqAoaDKxFkgRtkF9CnHAVnCHKfuj200wAgL+bSJhdsCD2l0Qx/2ekEXjPWcyKkfGb5CPboslg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "get-intrinsic": "^1.3.0",
        "has-symbols": "^1.1.0",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">=0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safe-push-apply": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/safe-push-apply/-/safe-push-apply-1.0.0.tgz",
      "integrity": "sha512-iKE9w/Z7xCzUMIZqdBsp6pEQvwuEebH4vdpjcDWnyzaI6yl6O9FHvVpmGelvEHNsoY6wGblkxR6Zty/h00WiSA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-regex-test": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/safe-regex-test/-/safe-regex-test-1.1.0.tgz",
      "integrity": "sha512-x/+Cz4YrimQxQccJf5mKEbIa1NzeCRNI5Ecl/ekmlYaampdNLPalVyIcCZNNH3MvmqBugV5TMYZXv0ljslUlaw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "is-regex": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/scheduler": {
      "version": "0.27.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz",
      "integrity": "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/set-function-length": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/set-function-length/-/set-function-length-1.2.2.tgz",
      "integrity": "sha512-pgRc4hJ4/sNjWCSS9AmnS40x3bNMDTknHgL5UaMBTMyJnU90EgWh1Rz+MC9eFu4BuN/UwZjKQuY/1v3rM7HMfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.2.4",
        "gopd": "^1.0.1",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-function-name": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/set-function-name/-/set-function-name-2.0.2.tgz",
      "integrity": "sha512-7PGFlmtwsEADb0WYyvCMa1t+yke6daIG4Wirafur5kcf+MhUnPms1UeR0CKQdTZD81yESwMHbtn+TR+dMviakQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "functions-have-names": "^1.2.3",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-proto": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/set-proto/-/set-proto-1.0.0.tgz",
      "integrity": "sha512-RJRdvCo6IAnPdsvP/7m6bsQqNnn1FCBX5ZNtFL98MmFF/4xAIJTIg1YbHW5DC2W5SKZanrC6i4HsJqlajw/dZw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/sharp": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/sharp/-/sharp-0.34.5.tgz",
      "integrity": "sha512-Ou9I5Ft9WNcCbXrU9cMgPBcCK8LiwLqcbywW3t4oDV37n1pzpuNLsYiAV8eODnjbtQlSDwZ2cUEeQz4E54Hltg==",
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "@img/colour": "^1.0.0",
        "detect-libc": "^2.1.2",
        "semver": "^7.7.3"
      },
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-darwin-arm64": "0.34.5",
        "@img/sharp-darwin-x64": "0.34.5",
        "@img/sharp-libvips-darwin-arm64": "1.2.4",
        "@img/sharp-libvips-darwin-x64": "1.2.4",
        "@img/sharp-libvips-linux-arm": "1.2.4",
        "@img/sharp-libvips-linux-arm64": "1.2.4",
        "@img/sharp-libvips-linux-ppc64": "1.2.4",
        "@img/sharp-libvips-linux-riscv64": "1.2.4",
        "@img/sharp-libvips-linux-s390x": "1.2.4",
        "@img/sharp-libvips-linux-x64": "1.2.4",
        "@img/sharp-libvips-linuxmusl-arm64": "1.2.4",
        "@img/sharp-libvips-linuxmusl-x64": "1.2.4",
        "@img/sharp-linux-arm": "0.34.5",
        "@img/sharp-linux-arm64": "0.34.5",
        "@img/sharp-linux-ppc64": "0.34.5",
        "@img/sharp-linux-riscv64": "0.34.5",
        "@img/sharp-linux-s390x": "0.34.5",
        "@img/sharp-linux-x64": "0.34.5",
        "@img/sharp-linuxmusl-arm64": "0.34.5",
        "@img/sharp-linuxmusl-x64": "0.34.5",
        "@img/sharp-wasm32": "0.34.5",
        "@img/sharp-win32-arm64": "0.34.5",
        "@img/sharp-win32-ia32": "0.34.5",
        "@img/sharp-win32-x64": "0.34.5"
      }
    },
    "node_modules/sharp/node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "license": "ISC",
      "optional": true,
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/side-channel": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
      "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4",
        "side-channel-list": "^1.0.1",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/stable-hash": {
      "version": "0.0.5",
      "resolved": "https://registry.npmjs.org/stable-hash/-/stable-hash-0.0.5.tgz",
      "integrity": "sha512-+L3ccpzibovGXFK+Ap/f8LOS0ahMrHTf3xu7mMLSpEGU0EO9ucaysSylKo9eRDFNhWve/y275iPmIZ4z39a9iA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/stop-iteration-iterator": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/stop-iteration-iterator/-/stop-iteration-iterator-1.1.0.tgz",
      "integrity": "sha512-eLoXW/DHyl62zxY4SCaIgnRhuMr6ri4juEYARS8E6sCEqzKpOiE521Ucofdx+KnDZl5xmvGYaaKCk5FEOxJCoQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "internal-slot": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/string.prototype.includes": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/string.prototype.includes/-/string.prototype.includes-2.0.1.tgz",
      "integrity": "sha512-o7+c9bW6zpAdJHTtujeePODAhkuicdAryFsfVKwA+wGw89wJ4GTY484WTucM9hLtDEOpOvI+aHnzqnC5lHp4Rg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.3"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/string.prototype.matchall": {
      "version": "4.0.12",
      "resolved": "https://registry.npmjs.org/string.prototype.matchall/-/string.prototype.matchall-4.0.12.tgz",
      "integrity": "sha512-6CC9uyBL+/48dYizRf7H7VAYCMCNTBeM78x/VTUe9bFEaxBepPJDa1Ow99LqI/1yF7kuy7Q3cQsYMrcjGUcskA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.6",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.6",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "internal-slot": "^1.1.0",
        "regexp.prototype.flags": "^1.5.3",
        "set-function-name": "^2.0.2",
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.repeat": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/string.prototype.repeat/-/string.prototype.repeat-1.0.0.tgz",
      "integrity": "sha512-0u/TldDbKD8bFCQ/4f5+mNRrXwZ8hg2w7ZR8wa16e8z9XpePWl3eGEcUD0OXpEH/VJH/2G3gjUtR3ZOiBe2S/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-properties": "^1.1.3",
        "es-abstract": "^1.17.5"
      }
    },
    "node_modules/string.prototype.trim": {
      "version": "1.2.11",
      "resolved": "https://registry.npmjs.org/string.prototype.trim/-/string.prototype.trim-1.2.11.tgz",
      "integrity": "sha512-PwvK7BU+CMTJGYQCTZb5RWXIML92lftJLhQz1tBzgKiqGxJaMlBAa48POXaNAC2s4y8jr3EFqrkF9+44neS46w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "define-data-property": "^1.1.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.24.2",
        "es-object-atoms": "^1.1.2",
        "has-property-descriptors": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimend": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/string.prototype.trimend/-/string.prototype.trimend-1.0.10.tgz",
      "integrity": "sha512-2+3aDAOmPTmuFwjDnmJG2ctEkQKVki7vOSqaxkv42Mowj1V6PnvuwFCRrR5lChUux1TBskPjfkeTOhqczDMxTw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimstart": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/string.prototype.trimstart/-/string.prototype.trimstart-1.0.8.tgz",
      "integrity": "sha512-UXSH262CSZY1tfu3G3Secr6uGLCFVPMhIqHjlgCUtCCcgihYc/xKs9djMTMUOb2j1mVSeU8EU6NWc/iQKU6Gfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/strip-bom": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-3.0.0.tgz",
      "integrity": "sha512-vavAMRXOgBVNF6nyEEmL3DBK19iRpDcoIwW+swQ+CbGiu7lju6t+JklA1MHweoWtadgt4ISVUsXLyDq34ddcwA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/strip-json-comments": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/styled-jsx": {
      "version": "5.1.6",
      "resolved": "https://registry.npmjs.org/styled-jsx/-/styled-jsx-5.1.6.tgz",
      "integrity": "sha512-qSVyDTeMotdvQYoHWLNGwRFJHC+i+ZvdBRYosOFgC+Wg1vx4frN2/RG/NA7SYqqvKNLf39P2LSRA2pu6n0XYZA==",
      "license": "MIT",
      "dependencies": {
        "client-only": "0.0.1"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "peerDependencies": {
        "react": ">= 16.8.0 || 17.x.x || ^18.0.0-0 || ^19.0.0-0"
      },
      "peerDependenciesMeta": {
        "@babel/core": {
          "optional": true
        },
        "babel-plugin-macros": {
          "optional": true
        }
      }
    },
    "node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/tiny-invariant": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/tiny-invariant/-/tiny-invariant-1.3.3.tgz",
      "integrity": "sha512-+FbBPE1o9QAYvviau/qC5SE3caw21q3xkvWKBtja5vgqOWIHHJ3ioaq1VPfn/Szqctz2bU/oYeKd9/z5BL+PVg==",
      "license": "MIT"
    },
    "node_modules/tinyexec": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/tinyexec/-/tinyexec-1.2.4.tgz",
      "integrity": "sha512-SHf/r48b7vOrjve9PxJo3MN5v5yuyjHvdUcrQffT3WXMUfnGmHDVbC4k3sHJaJTgZCwpUplIaAo5ANtMyp3YHg==",
      "devOptional": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/tinyglobby": {
      "version": "0.2.17",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/tinyglobby/node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/tinyglobby/node_modules/picomatch": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.5.tgz",
      "integrity": "sha512-RvwwcruNjI1ncT5xRakeyS9Lf8lcItv34KD+aif+VH9kduAyfYBipGh12274xtenIPZ119/R9BdTBa8gAwSh0A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/ts-api-utils": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/ts-api-utils/-/ts-api-utils-2.5.0.tgz",
      "integrity": "sha512-OJ/ibxhPlqrMM0UiNHJ/0CKQkoKF243/AEmplt3qpRgkW8VG7IfOS41h7V8TjITqdByHzrjcS/2si+y4lIh8NA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18.12"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4"
      }
    },
    "node_modules/ts-node": {
      "version": "10.9.2",
      "resolved": "https://registry.npmjs.org/ts-node/-/ts-node-10.9.2.tgz",
      "integrity": "sha512-f0FFpIdcHgn8zcPSbf1dRevwt047YMnaiJM3u2w2RewrB+fob/zePZcrOyQoLMMO7aBIddLcQIEK5dYjkLnGrQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@cspotcode/source-map-support": "^0.8.0",
        "@tsconfig/node10": "^1.0.7",
        "@tsconfig/node12": "^1.0.7",
        "@tsconfig/node14": "^1.0.0",
        "@tsconfig/node16": "^1.0.2",
        "acorn": "^8.4.1",
        "acorn-walk": "^8.1.1",
        "arg": "^4.1.0",
        "create-require": "^1.1.0",
        "diff": "^4.0.1",
        "make-error": "^1.1.1",
        "v8-compile-cache-lib": "^3.0.1",
        "yn": "3.1.1"
      },
      "bin": {
        "ts-node": "dist/bin.js",
        "ts-node-cwd": "dist/bin-cwd.js",
        "ts-node-esm": "dist/bin-esm.js",
        "ts-node-script": "dist/bin-script.js",
        "ts-node-transpile-only": "dist/bin-transpile.js",
        "ts-script": "dist/bin-script-deprecated.js"
      },
      "peerDependencies": {
        "@swc/core": ">=1.2.50",
        "@swc/wasm": ">=1.2.50",
        "@types/node": "*",
        "typescript": ">=2.7"
      },
      "peerDependenciesMeta": {
        "@swc/core": {
          "optional": true
        },
        "@swc/wasm": {
          "optional": true
        }
      }
    },
    "node_modules/tsconfig-paths": {
      "version": "3.15.0",
      "resolved": "https://registry.npmjs.org/tsconfig-paths/-/tsconfig-paths-3.15.0.tgz",
      "integrity": "sha512-2Ac2RgzDe/cn48GvOe3M+o82pEFewD3UPbyoUHHdKasHwJKjds4fLXWf/Ux5kATBKN20oaFGu+jbElp1pos0mg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/json5": "^0.0.29",
        "json5": "^1.0.2",
        "minimist": "^1.2.6",
        "strip-bom": "^3.0.0"
      }
    },
    "node_modules/tsconfig-paths/node_modules/json5": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/json5/-/json5-1.0.2.tgz",
      "integrity": "sha512-g1MWMLBiz8FKi1e4w0UyVL3w+iJceWAFBAaBnnGKOpNa5f8TLktkbre1+s6oICydWAm+HRUGTmI+//xv2hvXYA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "minimist": "^1.2.0"
      },
      "bin": {
        "json5": "lib/cli.js"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/type-check": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
      "integrity": "sha512-XleUoc9uwGXqjWwXaUTZAmzMcFZ5858QA2vvx1Ur5xIcixXIP+8LnFDgRplU30us6teqdlskFfu+ae4K79Ooew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/typed-array-buffer": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/typed-array-buffer/-/typed-array-buffer-1.0.3.tgz",
      "integrity": "sha512-nAYYwfY3qnzX30IkA6AQZjVbtK6duGontcQm1WSG1MD94YLqK0515GNApXkoxKOWMusVssAHWLh9SeaoefYFGw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/typed-array-byte-length": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/typed-array-byte-length/-/typed-array-byte-length-1.0.3.tgz",
      "integrity": "sha512-BaXgOuIxz8n8pIq3e7Atg/7s+DpiYrxn4vdot3w9KbnBhcRQq6o3xemQdIfynqSeXeDrF32x+WvfzmOjPiY9lg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "for-each": "^0.3.3",
        "gopd": "^1.2.0",
        "has-proto": "^1.2.0",
        "is-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-byte-offset": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/typed-array-byte-offset/-/typed-array-byte-offset-1.0.4.tgz",
      "integrity": "sha512-bTlAFB/FBYMcuX81gbL4OcpH5PmlFHqlCCpAl8AlEzMz5k53oNDvN8p1PNOWLEmI2x4orp3raOFB51tv9X+MFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "for-each": "^0.3.3",
        "gopd": "^1.2.0",
        "has-proto": "^1.2.0",
        "is-typed-array": "^1.1.15",
        "reflect.getprototypeof": "^1.0.9"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-length": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/typed-array-length/-/typed-array-length-1.0.8.tgz",
      "integrity": "sha512-phPGCwqr2+Qo0fwniCE8e4pKnGu/yFb5nD5Y8bf0EEeiI5GklnACYA9GFy/DrAeRrKHXvHn+1SUsOWgJp6RO+g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "for-each": "^0.3.5",
        "gopd": "^1.2.0",
        "is-typed-array": "^1.1.15",
        "possible-typed-array-names": "^1.1.0",
        "reflect.getprototypeof": "^1.0.10"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "devOptional": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/typescript-eslint": {
      "version": "8.63.0",
      "resolved": "https://registry.npmjs.org/typescript-eslint/-/typescript-eslint-8.63.0.tgz",
      "integrity": "sha512-xgwXyzG4sK9ALkBxbyGkTMMOS+imnW65iPhxCQMK83KhxyoDNW7l+IDqEf9vMdoUidHpOoS967RCq4eMiTexwQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/eslint-plugin": "8.63.0",
        "@typescript-eslint/parser": "8.63.0",
        "@typescript-eslint/typescript-estree": "8.63.0",
        "@typescript-eslint/utils": "8.63.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/unbox-primitive": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/unbox-primitive/-/unbox-primitive-1.1.0.tgz",
      "integrity": "sha512-nWJ91DjeOkej/TA8pXQ3myruKpKEYgqvpw9lz4OPHj/NWFNluYrjbz9j01CJ8yKQd2g4jFoOkINCTW2I5LEEyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-bigints": "^1.0.2",
        "has-symbols": "^1.1.0",
        "which-boxed-primitive": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/undici-types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/unrs-resolver": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/unrs-resolver/-/unrs-resolver-1.12.2.tgz",
      "integrity": "sha512-dmlRxBJJayXjqTwC+JtF1HhJmgf3ftQ3YejFcZrf4+KKtJv0qDsK1pjqaaVjG7wJ5NJ6UVP1OqRMQ71Z4C3rxQ==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "napi-postinstall": "^0.3.4"
      },
      "funding": {
        "url": "https://opencollective.com/unrs-resolver"
      },
      "optionalDependencies": {
        "@unrs/resolver-binding-android-arm-eabi": "1.12.2",
        "@unrs/resolver-binding-android-arm64": "1.12.2",
        "@unrs/resolver-binding-darwin-arm64": "1.12.2",
        "@unrs/resolver-binding-darwin-x64": "1.12.2",
        "@unrs/resolver-binding-freebsd-x64": "1.12.2",
        "@unrs/resolver-binding-linux-arm-gnueabihf": "1.12.2",
        "@unrs/resolver-binding-linux-arm-musleabihf": "1.12.2",
        "@unrs/resolver-binding-linux-arm64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-arm64-musl": "1.12.2",
        "@unrs/resolver-binding-linux-loong64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-loong64-musl": "1.12.2",
        "@unrs/resolver-binding-linux-ppc64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-riscv64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-riscv64-musl": "1.12.2",
        "@unrs/resolver-binding-linux-s390x-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-x64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-x64-musl": "1.12.2",
        "@unrs/resolver-binding-openharmony-arm64": "1.12.2",
        "@unrs/resolver-binding-wasm32-wasi": "1.12.2",
        "@unrs/resolver-binding-win32-arm64-msvc": "1.12.2",
        "@unrs/resolver-binding-win32-ia32-msvc": "1.12.2",
        "@unrs/resolver-binding-win32-x64-msvc": "1.12.2"
      }
    },
    "node_modules/update-browserslist-db": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.2.3.tgz",
      "integrity": "sha512-Js0m9cx+qOgDxo0eMiFGEueWztz+d4+M3rGlmKPT+T4IS/jP4ylw3Nwpu6cpTTP8R1MAC1kF4VbdLt3ARf209w==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.1"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/uri-js": {
      "version": "4.4.1",
      "resolved": "https://registry.npmjs.org/uri-js/-/uri-js-4.4.1.tgz",
      "integrity": "sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/use-sync-external-store": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.6.0.tgz",
      "integrity": "sha512-Pp6GSwGP/NrPIrxVFAIkOQeyw8lFenOHijQWkUTrDvrF4ALqylP2C/KCkeS9dpUM3KvYRQhna5vt7IL95+ZQ9w==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/v8-compile-cache-lib": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/v8-compile-cache-lib/-/v8-compile-cache-lib-3.0.1.tgz",
      "integrity": "sha512-wa7YjyUGfNZngI/vtK0UHAN+lgDCxBPCylVXGp0zu59Fz5aiGtNXaq3DhIov063MorB+VfufLh3JlF2KdTK3xg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/victory-vendor": {
      "version": "37.3.6",
      "resolved": "https://registry.npmjs.org/victory-vendor/-/victory-vendor-37.3.6.tgz",
      "integrity": "sha512-SbPDPdDBYp+5MJHhBCAyI7wKM3d5ivekigc2Dk2s7pgbZ9wIgIBYGVw4zGHBml/qTFbexrofXW6Gu4noGxrOwQ==",
      "license": "MIT AND ISC",
      "dependencies": {
        "@types/d3-array": "^3.0.3",
        "@types/d3-ease": "^3.0.0",
        "@types/d3-interpolate": "^3.0.1",
        "@types/d3-scale": "^4.0.2",
        "@types/d3-shape": "^3.1.0",
        "@types/d3-time": "^3.0.0",
        "@types/d3-timer": "^3.0.0",
        "d3-array": "^3.1.6",
        "d3-ease": "^3.0.1",
        "d3-interpolate": "^3.0.1",
        "d3-scale": "^4.0.2",
        "d3-shape": "^3.1.0",
        "d3-time": "^3.0.0",
        "d3-timer": "^3.0.1"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/which-boxed-primitive": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/which-boxed-primitive/-/which-boxed-primitive-1.1.1.tgz",
      "integrity": "sha512-TbX3mj8n0odCBFVlY8AxkqcHASw3L60jIuF8jFP78az3C2YhmGvqbHBpAjTRH2/xqYunrJ9g1jSyjCjpoWzIAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-bigint": "^1.1.0",
        "is-boolean-object": "^1.2.1",
        "is-number-object": "^1.1.1",
        "is-string": "^1.1.1",
        "is-symbol": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-builtin-type": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/which-builtin-type/-/which-builtin-type-1.2.1.tgz",
      "integrity": "sha512-6iBczoX+kDQ7a3+YJBnh3T+KZRxM/iYNPXicqk66/Qfm1b93iu+yOImkg0zHbj5LNOcNv1TEADiZ0xa34B4q6Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "function.prototype.name": "^1.1.6",
        "has-tostringtag": "^1.0.2",
        "is-async-function": "^2.0.0",
        "is-date-object": "^1.1.0",
        "is-finalizationregistry": "^1.1.0",
        "is-generator-function": "^1.0.10",
        "is-regex": "^1.2.1",
        "is-weakref": "^1.0.2",
        "isarray": "^2.0.5",
        "which-boxed-primitive": "^1.1.0",
        "which-collection": "^1.0.2",
        "which-typed-array": "^1.1.16"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-collection": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/which-collection/-/which-collection-1.0.2.tgz",
      "integrity": "sha512-K4jVyjnBdgvc86Y6BkaLZEN933SwYOuBFkdmBu9ZfkcAbdVbpITnDmjvZ/aQjRXQrv5EPkTnD1s39GiiqbngCw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-map": "^2.0.3",
        "is-set": "^2.0.3",
        "is-weakmap": "^2.0.2",
        "is-weakset": "^2.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-typed-array": {
      "version": "1.1.22",
      "resolved": "https://registry.npmjs.org/which-typed-array/-/which-typed-array-1.1.22.tgz",
      "integrity": "sha512-fvO4ExWMFsqyhG3AiPAObMuY1lxaqgYcxbc49CNdWDDECOJNgQyvsOWVwbZc+qf3rzRtxojBK+CMEv0Ld5CYpw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "for-each": "^0.3.5",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/word-wrap": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.5.tgz",
      "integrity": "sha512-BN22B5eaMMI9UMtjrGd5g5eCYPpCPDUy0FJXbYsaT5zYxjFOckS53SQDE3pWkVoWpHXVb3BrYcEN4Twa55B5cA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/yallist": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/yn": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yn/-/yn-3.1.1.tgz",
      "integrity": "sha512-Ux4ygGWsu2c7isFWe8Yu1YluJmqVhxqK2cLXNQA5AcC3QfbGNpM7fu0Y8b/z16pXLnFxZYvWhd3fhBY9DLmC6Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/zod": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/zod/-/zod-4.4.3.tgz",
      "integrity": "sha512-ytENFjIJFl2UwYglde2jchW2Hwm4GJFLDiSXWdTrJQBIN9Fcyp7n4DhxJEiWNAJMV1/BqWfW/kkg71UDcHJyTQ==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    },
    "node_modules/zod-validation-error": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/zod-validation-error/-/zod-validation-error-4.0.2.tgz",
      "integrity": "sha512-Q6/nZLe6jxuU80qb/4uJ4t5v2VEZ44lzQjPDhYJNztRQ4wyWc6VF3D3Kb/fAuPetZQnhS3hnajCf9CsWesghLQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18.0.0"
      },
      "peerDependencies": {
        "zod": "^3.25.0 || ^4.0.0"
      }
    }
  }
}

```

## prisma/migrations/20260710014035_init/migration.sql

```sql
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDEDOR', 'JEFE_TALLER', 'ALMACENERO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('TIENDA', 'EMPRESA');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE_PAGO', 'APROBADA', 'TERMINADA', 'ENTREGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoMateriaPrima" AS ENUM ('VARILLA', 'PLATINA', 'MUELLE', 'TUERCA', 'ARANDELA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaPrima" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoMateriaPrima" NOT NULL,
    "diametro" TEXT,
    "espesor" TEXT,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductosFichaTecnica" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "formulaCalculo" TEXT NOT NULL,
    "materiaPrimaId" TEXT NOT NULL,

    CONSTRAINT "ProductosFichaTecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenesFabricacion" (
    "id" TEXT NOT NULL,
    "codigoCorrelativoUnico" SERIAL NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "tipoCliente" "TipoCliente" NOT NULL,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "fechaComprometida" TIMESTAMP(3) NOT NULL,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "montoAbonado" DOUBLE PRECISION NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "esUrgente" BOOLEAN NOT NULL DEFAULT false,
    "cargoUrgencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tokenConsulta" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenesFabricacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleOrden" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT,
    "productoComercialId" TEXT,
    "largo" DOUBLE PRECISION NOT NULL,
    "ancho" DOUBLE PRECISION NOT NULL,
    "espesor" DOUBLE PRECISION NOT NULL,
    "forma" TEXT NOT NULL,
    "calidadAcero" TEXT NOT NULL,
    "colorPintura" TEXT,
    "tuercasTipo" TEXT,
    "cantidadSolicitada" INTEGER NOT NULL,

    CONSTRAINT "DetalleOrden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcesoEtapa" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "etapaNombre" TEXT NOT NULL,
    "ordenSecuencia" INTEGER NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "operarioAsignado" TEXT,
    "fechaCompletada" TIMESTAMP(3),

    CONSTRAINT "ProcesoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KardexInventario" (
    "id" TEXT NOT NULL,
    "materiaPrimaId" TEXT NOT NULL,
    "tipoMovimiento" "TipoMovimiento" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KardexInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalidaAutorizada" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "jefeTallerId" TEXT NOT NULL,
    "autorizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalidaAutorizada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoComercial" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioVenta" DOUBLE PRECISION,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KardexComercial" (
    "id" TEXT NOT NULL,
    "productoComercialId" TEXT NOT NULL,
    "tipoMovimiento" "TipoMovimiento" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KardexComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaPrima_codigo_key" ON "MateriaPrima"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProductosFichaTecnica_codigo_key" ON "ProductosFichaTecnica"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenesFabricacion_codigoCorrelativoUnico_key" ON "OrdenesFabricacion"("codigoCorrelativoUnico");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenesFabricacion_tokenConsulta_key" ON "OrdenesFabricacion"("tokenConsulta");

-- CreateIndex
CREATE UNIQUE INDEX "SalidaAutorizada_ordenId_key" ON "SalidaAutorizada"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoComercial_codigo_key" ON "ProductoComercial"("codigo");

-- AddForeignKey
ALTER TABLE "ProductosFichaTecnica" ADD CONSTRAINT "ProductosFichaTecnica_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleOrden" ADD CONSTRAINT "DetalleOrden_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenesFabricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleOrden" ADD CONSTRAINT "DetalleOrden_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "ProductosFichaTecnica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleOrden" ADD CONSTRAINT "DetalleOrden_productoComercialId_fkey" FOREIGN KEY ("productoComercialId") REFERENCES "ProductoComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcesoEtapa" ADD CONSTRAINT "ProcesoEtapa_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenesFabricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexInventario" ADD CONSTRAINT "KardexInventario_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexInventario" ADD CONSTRAINT "KardexInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalidaAutorizada" ADD CONSTRAINT "SalidaAutorizada_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenesFabricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalidaAutorizada" ADD CONSTRAINT "SalidaAutorizada_jefeTallerId_fkey" FOREIGN KEY ("jefeTallerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexComercial" ADD CONSTRAINT "KardexComercial_productoComercialId_fkey" FOREIGN KEY ("productoComercialId") REFERENCES "ProductoComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexComercial" ADD CONSTRAINT "KardexComercial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

```

## prisma/migrations/20260710162511_add_google_auth/migration.sql

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

```

## prisma/migrations/20260712155440_add_en_produccion_state/migration.sql

```sql
-- CreateEnum
CREATE TYPE "PrioridadOrden" AS ENUM ('NORMAL', 'ALTA', 'URGENTE');

-- AlterEnum
ALTER TYPE "EstadoOrden" ADD VALUE 'EN_PRODUCCION';

-- AlterTable
ALTER TABLE "OrdenesFabricacion" ADD COLUMN     "fechaProduccion" TIMESTAMP(3),
ADD COLUMN     "prioridad" "PrioridadOrden" NOT NULL DEFAULT 'NORMAL';

```

## prisma/migrations/migration_lock.toml

```toml
# Please do not edit this file manually
# It should be added in your version-control system (e.g., Git)
provider = "postgresql"

```

