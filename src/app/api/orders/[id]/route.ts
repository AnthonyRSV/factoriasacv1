import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, modifyOrder, updateOrderStatus, getUserByEmail } from '@/lib/data-layer';
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
    const { estado } = body;

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
