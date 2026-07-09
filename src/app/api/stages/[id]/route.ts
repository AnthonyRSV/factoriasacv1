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
