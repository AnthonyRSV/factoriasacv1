import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkDbMode } from '@/lib/data-layer';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const MOCK_DB_PATH = path.join(process.cwd(), 'db.json');

function readMockDb() {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    return {
      users: [],
      materiaPrima: [],
      productosFichaTecnica: [],
      ordenesFabricacion: [],
      detalleOrden: [],
      procesoEtapa: [],
      kardexInventario: [],
      salidaAutorizada: []
    };
  }
  return JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8'));
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await request.json();
    const { estado, fechaProduccion, prioridad } = body;

    const updateData: any = {};
    if (estado) updateData.estado = estado;
    if (fechaProduccion) updateData.fechaProduccion = new Date(fechaProduccion);
    if (prioridad) updateData.prioridad = prioridad;

    const isPg = await checkDbMode();
    let ordenActualizada: any;

    if (isPg) {
      ordenActualizada = await prisma.ordenesFabricacion.update({
        where: { id },
        data: updateData,
        include: {
          detalles: {
            include: {
              producto: true,
              productoComercial: true
            }
          },
          procesos: true
        }
      });
    } else {
      const db = readMockDb();
      const idx = db.ordenesFabricacion.findIndex((o: any) => o.id === id);
      if (idx !== -1) {
        if (estado) db.ordenesFabricacion[idx].estado = estado;
        if (fechaProduccion) db.ordenesFabricacion[idx].fechaProduccion = new Date(fechaProduccion).toISOString();
        if (prioridad) db.ordenesFabricacion[idx].prioridad = prioridad;

        fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

        const o = db.ordenesFabricacion[idx];
        const details = db.detalleOrden
          .filter((d: any) => d.ordenId === o.id)
          .map((d: any) => {
            const prod = db.productosFichaTecnica.find((p: any) => p.id === d.productoId);
            return { ...d, producto: prod };
          });
        const stages = db.procesoEtapa.filter((pe: any) => pe.ordenId === o.id);

        ordenActualizada = {
          ...o,
          detalles: details,
          procesos: stages
        };
      } else {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }
    }

    return NextResponse.json(ordenActualizada);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de fabricación' },
      { status: 500 }
    );
  }
}
