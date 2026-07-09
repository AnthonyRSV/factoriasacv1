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
