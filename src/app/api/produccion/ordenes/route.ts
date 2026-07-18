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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const cliente = searchParams.get('cliente');
    const codigo = searchParams.get('codigo');
    const soloAtrasadas = searchParams.get('soloAtrasadas') === 'true';
    const soloEnProduccion = searchParams.get('soloEnProduccion') === 'true';
    const soloUrgentes = searchParams.get('soloUrgentes') === 'true';
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const isPg = await checkDbMode();
    let ordenes: any[] = [];

    if (isPg) {
      const where: any = {};
      if (estado) {
        where.estado = estado;
      }
      if (prioridad) {
        where.prioridad = prioridad;
      }
      if (cliente) {
        where.clienteNombre = {
          contains: cliente,
          mode: 'insensitive'
        };
      }
      if (codigo) {
        where.codigoCorrelativoUnico = parseInt(codigo);
      }
      if (soloUrgentes) {
        where.prioridad = 'URGENTE';
      }
      if (soloEnProduccion) {
        where.estado = 'EN_PRODUCCION';
      }
      if (fechaInicio || fechaFin) {
        where.fechaComprometida = {};
        if (fechaInicio) {
          where.fechaComprometida.gte = new Date(fechaInicio);
        }
        if (fechaFin) {
          where.fechaComprometida.lte = new Date(fechaFin);
        }
      }

      ordenes = await prisma.ordenesFabricacion.findMany({
        where,
        include: {
          detalles: {
            include: {
              producto: true,
              productoComercial: true
            }
          },
          procesos: {
            orderBy: {
              ordenSecuencia: 'asc'
            }
          }
        },
        orderBy: {
          fechaComprometida: 'asc'
        }
      });
    } else {
      const db = readMockDb();
      ordenes = db.ordenesFabricacion.map((o: any) => {
        const details = db.detalleOrden
          .filter((d: any) => d.ordenId === o.id)
          .map((d: any) => {
            const prod = db.productosFichaTecnica.find((p: any) => p.id === d.productoId);
            return { ...d, producto: prod };
          });
        const stages = db.procesoEtapa
          .filter((pe: any) => pe.ordenId === o.id)
          .sort((a: any, b: any) => a.ordenSecuencia - b.ordenSecuencia);

        return {
          ...o,
          detalles: details,
          procesos: stages
        };
      });

      if (estado) {
        ordenes = ordenes.filter((o: any) => o.estado === estado);
      }
      if (prioridad) {
        ordenes = ordenes.filter((o: any) => o.prioridad === prioridad);
      }
      if (cliente) {
        ordenes = ordenes.filter((o: any) => o.clienteNombre.toLowerCase().includes(cliente.toLowerCase()));
      }
      if (codigo) {
        ordenes = ordenes.filter((o: any) => o.codigoCorrelativoUnico === parseInt(codigo));
      }
      if (soloUrgentes) {
        ordenes = ordenes.filter((o: any) => o.prioridad === 'URGENTE');
      }
      if (soloEnProduccion) {
        ordenes = ordenes.filter((o: any) => o.estado === 'EN_PRODUCCION');
      }
      if (fechaInicio) {
        const start = new Date(fechaInicio).getTime();
        ordenes = ordenes.filter((o: any) => new Date(o.fechaComprometida).getTime() >= start);
      }
      if (fechaFin) {
        const end = new Date(fechaFin).getTime();
        ordenes = ordenes.filter((o: any) => new Date(o.fechaComprometida).getTime() <= end);
      }

      ordenes.sort((a: any, b: any) => new Date(a.fechaComprometida).getTime() - new Date(b.fechaComprometida).getTime());
    }

    const ordenesConCalculos = ordenes.map(orden => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaComprometida = new Date(orden.fechaComprometida);
      fechaComprometida.setHours(0, 0, 0, 0);
      
      const diferenciaDias = Math.floor((fechaComprometida.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...orden,
        diasRestantes: diferenciaDias >= 0 ? diferenciaDias : 0,
        diasRetraso: diferenciaDias < 0 ? Math.abs(diferenciaDias) : 0,
        estaAtrasada: diferenciaDias < 0 && orden.estado !== 'ENTREGADA' && orden.estado !== 'CANCELADA'
      };
    });

    const resultadoFinal = soloAtrasadas 
      ? ordenesConCalculos.filter(o => o.estaAtrasada)
      : ordenesConCalculos;

    return NextResponse.json(resultadoFinal);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes de fabricación' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, estado, fechaProduccion, prioridad } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de orden es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (estado) updateData.estado = estado;
    if (fechaProduccion) updateData.fechaProduccion = new Date(fechaProduccion);
    if (prioridad) updateData.prioridad = prioridad;

    const ordenActualizada = await prisma.ordenesFabricacion.update({
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

    return NextResponse.json(ordenActualizada);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de fabricación' },
      { status: 500 }
    );
  }
}
