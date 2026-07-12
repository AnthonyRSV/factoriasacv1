import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { codigo, nombre, tipo, diametro, espesor, stockMinimo, stockActual } = body;

    const existing = await prisma.materiaPrima.findFirst({
      where: {
        codigo,
        NOT: { id },
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'El código ya está en uso por otro material' }, { status: 400 });
    }

    const materiaPrima = await prisma.materiaPrima.update({
      where: { id },
      data: {
        codigo,
        nombre,
        tipo,
        diametro: diametro || null,
        espesor: espesor || null,
        stockMinimo: Number(stockMinimo || 0),
        stockActual: Number(stockActual || 0),
      },
    });

    return NextResponse.json(materiaPrima);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating materia prima' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    // Check if it's used in any FichaTecnica or Kardex
    const uses = await prisma.productosFichaTecnica.findFirst({ where: { materiaPrimaId: id } });
    if (uses) {
      return NextResponse.json({ error: 'No se puede eliminar: el material está en uso en una ficha técnica.' }, { status: 400 });
    }
    
    await prisma.materiaPrima.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting materia prima' }, { status: 500 });
  }
}
