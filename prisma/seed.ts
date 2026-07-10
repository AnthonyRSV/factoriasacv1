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
