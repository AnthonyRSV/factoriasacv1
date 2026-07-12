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