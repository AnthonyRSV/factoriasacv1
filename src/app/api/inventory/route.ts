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
    const { materiaPrimaId, cantidad, motivo } = body;

    if (!materiaPrimaId || !cantidad || !motivo) {
      return NextResponse.json({ error: 'Se requieren materiaPrimaId, cantidad y motivo.' }, { status: 400 });
    }

    const newMovement = await registerPurchaseInput({
      materiaPrimaId,
      cantidad: Number(cantidad),
      motivo,
      usuarioId: authResult.user.id,
    });

    return NextResponse.json(newMovement, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
