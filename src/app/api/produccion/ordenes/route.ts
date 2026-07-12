import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const ordenes = await prisma.ordenesFabricacion.findMany({
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

    // Calcular días restantes o de retraso para cada orden
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

    // Filtrar órdenes atrasadas si se solicita
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
