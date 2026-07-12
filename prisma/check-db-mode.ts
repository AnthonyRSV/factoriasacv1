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
