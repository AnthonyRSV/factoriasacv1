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
