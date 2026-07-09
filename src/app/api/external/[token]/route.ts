import { NextRequest, NextResponse } from 'next/server';
import { getOrderByToken } from '@/lib/data-layer';

// GET: Query order status externally using a secure unique token (no auth required)
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const order = await getOrderByToken(token);
    
    if (!order) {
      return NextResponse.json({ error: 'Enlace no válido o expirado.' }, { status: 404 });
    }

    // Return limited information for security/privacy if desired,
    // but here we return standard details of fabrication progress.
    return NextResponse.json({
      clienteNombre: order.clienteNombre,
      codigoCorrelativoUnico: order.codigoCorrelativoUnico,
      estado: order.estado,
      fechaComprometida: order.fechaComprometida,
      creadoEn: order.creadoEn,
      detalles: order.detalles.map((d: any) => ({
        productoNombre: d.producto.nombre,
        forma: d.forma,
        espesor: d.espesor,
        largo: d.largo,
        ancho: d.ancho,
        cantidadSolicitada: d.cantidadSolicitada,
      })),
      procesos: order.procesos.map((p: any) => ({
        etapaNombre: p.etapaNombre,
        completada: p.completada,
        fechaCompletada: p.fechaCompletada,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
