import fs from 'fs';
import path from 'path';
import prisma, { testDbConnection } from './db';
import { Role, TipoMateriaPrima, TipoCliente, EstadoOrden, TipoMovimiento } from '@prisma/client';
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
  montoTotal: number;
  montoAbonado: number;
  metodoPago: string;
  esUrgente: boolean;
  detalles: Array<{
    productoId: string;
    largo: number;
    ancho: number;
    espesor: number;
    forma: string;
    calidadAcero: string;
    colorPintura?: string;
    tuercasTipo?: string;
    cantidadSolicitada: number;
  }>;
}) {
  const isPg = await checkDbMode();

  // Validate Payment rules (RF-06)
  const isExternalClient = data.clienteNombre.toLowerCase() !== 'tienda';
  const minDepositPercent = 0.50; // 50%
  
  // Exception: Damper (or other big companies) auto approves.
  const isBigCompany = data.clienteNombre.toLowerCase().includes('damper');

  if (isExternalClient && !isBigCompany) {
    const minAbonado = data.montoTotal * minDepositPercent;
    if (data.montoAbonado < minAbonado) {
      throw new Error(`Los clientes externos requieren un abono mínimo del 50% (Mínimo: ${minAbonado} Soles).`);
    }
  }

  if (data.montoTotal > 2000 && data.metodoPago === 'EFECTIVO') {
    throw new Error('Las órdenes superiores a 2000 Soles exigen que el pago sea marcado como BANCARIZADO (Transferencia/Tarjeta).');
  }

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
  if (isBigCompany) {
    initialStatus = EstadoOrden.APROBADA; // Auto-approved
  } else if (data.montoAbonado >= data.montoTotal) {
    initialStatus = EstadoOrden.APROBADA; // Paid in full
  } else if (data.montoAbonado >= (data.montoTotal * 0.50)) {
    // For normal external clients, a 50% deposit lets it be approved or stay in PENDIENTE_PAGO depending on policy.
    // Let's approve it if they hit the 50% threshold to allow workflow progression.
    initialStatus = EstadoOrden.APROBADA;
  }

  const finalMontoTotal = data.montoTotal + cargoUrgencia;

  if (isPg) {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Create order
      const order = await tx.ordenesFabricacion.create({
        data: {
          clienteNombre: data.clienteNombre,
          tipoCliente: data.tipoCliente,
          estado: initialStatus,
          fechaComprometida: new Date(data.fechaComprometida),
          montoTotal: finalMontoTotal,
          montoAbonado: data.montoAbonado,
          metodoPago: data.metodoPago,
          esUrgente: data.esUrgente,
          cargoUrgencia: cargoUrgencia,
        },
      });

      // 2. Create details
      for (const d of data.detalles) {
        await tx.detalleOrden.create({
          data: {
            ordenId: order.id,
            productoId: d.productoId,
            largo: d.largo,
            ancho: d.ancho,
            espesor: d.espesor,
            forma: d.forma,
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

    const newOrder = {
      id: orderId,
      codigoCorrelativoUnico: nextCorrelative,
      clienteNombre: data.clienteNombre,
      tipoCliente: data.tipoCliente,
      estado: initialStatus,
      fechaComprometida: new Date(data.fechaComprometida).toISOString(),
      montoTotal: finalMontoTotal,
      montoAbonado: data.montoAbonado,
      metodoPago: data.metodoPago,
      esUrgente: data.esUrgente,
      cargoUrgencia: cargoUrgencia,
      tokenConsulta: `token-${orderId}`,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    db.ordenesFabricacion.push(newOrder);

    const detailsList = data.detalles.map((d, index) => {
      const newDetail = {
        id: `det-${Date.now()}-${index}`,
        ordenId: orderId,
        productoId: d.productoId,
        largo: d.largo,
        ancho: d.ancho,
        espesor: d.espesor,
        forma: d.forma,
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

// Side effects executed transactionally when order transitions to APPROVED (stock check, kardex egress, process lines)
async function executeApprovalSideEffects(ordenId: string, tx: any) {
  // 1. Get details of the order
  const details = await tx.detalleOrden.findMany({
    where: { ordenId },
    include: { producto: true },
  });

  const order = await tx.ordenesFabricacion.findUnique({
    where: { id: ordenId },
  });

  // System user for automation
  const systemUser = await tx.user.findFirst({ where: { role: Role.ALMACENERO } });
  const userId = systemUser ? systemUser.id : 'system';

  // 2. Perform Stock deduction for each product via formulas (RF-11, RF-12)
  for (const d of details) {
    const formulaJson = JSON.parse(d.producto.formulaCalculo);
    // Solve formula dynamically based on DB field (RF-11)
    let formulaStr = formulaJson.formula.toLowerCase();
    formulaStr = formulaStr.replace(/largo/g, d.largo.toString());
    formulaStr = formulaStr.replace(/ancho/g, d.ancho.toString());
    formulaStr = formulaStr.replace(/cantidad/g, d.cantidadSolicitada.toString());
    formulaStr = formulaStr.replace(/espesor/g, d.espesor.toString());
    
    let calculatedQty = 0;
    try {
      calculatedQty = new Function(`return ${formulaStr}`)();
    } catch (e) {
      calculatedQty = d.largo * d.cantidadSolicitada;
    }

    // Deduct stock in PostgreSQL
    const mat = await tx.materiaPrima.findUnique({ where: { id: d.producto.materiaPrimaId } });
    if (mat) {
      const nextStock = mat.stockActual - calculatedQty;
      
      // Update Materia Prima
      await tx.materiaPrima.update({
        where: { id: mat.id },
        data: { stockActual: nextStock },
      });

      // Write Kardex record (EGRESO)
      await tx.kardexInventario.create({
        data: {
          materiaPrimaId: mat.id,
          tipoMovimiento: TipoMovimiento.EGRESO,
          cantidad: calculatedQty,
          motivo: `Descuento automático: Aprobación Orden #${order.codigoCorrelativoUnico}`,
          usuarioId: userId,
        },
      });
    }
  }

  // 3. Create process stages (RF-07)
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

  const details = db.detalleOrden.filter(d => d.ordenId === ordenId);
  const systemUser = db.users.find(u => u.role === Role.ALMACENERO) || { id: 'system' };

  for (const d of details) {
    const prod = db.productosFichaTecnica.find(p => p.id === d.productoId);
    if (!prod) continue;

    const formulaJson = JSON.parse(prod.formulaCalculo);
    let formulaStr = formulaJson.formula.toLowerCase();
    formulaStr = formulaStr.replace(/largo/g, d.largo.toString());
    formulaStr = formulaStr.replace(/ancho/g, d.ancho.toString());
    formulaStr = formulaStr.replace(/cantidad/g, d.cantidadSolicitada.toString());
    formulaStr = formulaStr.replace(/espesor/g, d.espesor.toString());
    
    let calculatedQty = 0;
    try {
      calculatedQty = new Function(`return ${formulaStr}`)();
    } catch (e) {
      calculatedQty = d.largo * d.cantidadSolicitada;
    }

    const mat = db.materiaPrima.find(mp => mp.id === prod.materiaPrimaId);
    if (mat) {
      mat.stockActual = mat.stockActual - calculatedQty;
      mat.actualizadoEn = new Date().toISOString();

      // Add to Kardex
      db.kardexInventario.push({
        id: `kdx-${Date.now()}-${Math.random()}`,
        materiaPrimaId: mat.id,
        tipoMovimiento: TipoMovimiento.EGRESO,
        cantidad: calculatedQty,
        motivo: `Descuento automático: Aprobación Orden #${order.codigoCorrelativoUnico}`,
        usuarioId: systemUser.id,
        creadoEn: new Date().toISOString(),
      });
    }
  }

  // Create process stages
  const defaultStages = ['Corte', 'Roscado', 'Doblado', 'Pintura'];
  defaultStages.forEach((stage, idx) => {
    db.procesoEtapa.push({
      id: `pe-${Date.now()}-${idx}`,
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
  colorPintura?: string;
  tuercasTipo?: string;
  clienteNombre?: string;
}) {
  const isPg = await checkDbMode();

  if (isPg) {
    // In Postgres, let's update details and/or orders
    const updateData: any = {};
    if (data.fechaComprometida) updateData.fechaComprometida = new Date(data.fechaComprometida);
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
  motivo: string; // e.g. "Ingreso por compra a distribuidor Ansec"
  usuarioId: string;
}) {
  const isPg = await checkDbMode();
  if (isPg) {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Get raw material
      const mat = await tx.materiaPrima.findUnique({ where: { id: data.materiaPrimaId } });
      if (!mat) throw new Error('Materia prima no encontrada');

      // 2. Update stock
      const nextStock = mat.stockActual + data.cantidad;
      await tx.materiaPrima.update({
        where: { id: mat.id },
        data: { stockActual: nextStock },
      });

      // 3. Create Kardex record
      return await tx.kardexInventario.create({
        data: {
          materiaPrimaId: mat.id,
          tipoMovimiento: TipoMovimiento.INGRESO,
          cantidad: data.cantidad,
          motivo: data.motivo,
          usuarioId: data.usuarioId,
        },
      });
    });
  } else {
    const db = readMockDb();
    const mat = db.materiaPrima.find(mp => mp.id === data.materiaPrimaId);
    if (!mat) throw new Error('Materia prima no encontrada');

    mat.stockActual += data.cantidad;
    mat.actualizadoEn = new Date().toISOString();

    const newKdx = {
      id: `kdx-${Date.now()}`,
      materiaPrimaId: mat.id,
      tipoMovimiento: TipoMovimiento.INGRESO,
      cantidad: data.cantidad,
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
