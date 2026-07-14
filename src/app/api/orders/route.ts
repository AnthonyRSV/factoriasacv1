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
