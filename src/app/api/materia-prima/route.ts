import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const materiasPrimas = await prisma.materiaPrima.findMany({
      orderBy: { creadoEn: 'desc' },
    });
    return NextResponse.json(materiasPrimas);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching materia prima' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, nombre, tipo, diametro, espesor, stockMinimo, stockActual } = body;

    const existing = await prisma.materiaPrima.findUnique({ where: { codigo } });
    if (existing) {
      return NextResponse.json({ error: 'El código ya está en uso' }, { status: 400 });
    }

    const materiaPrima = await prisma.materiaPrima.create({
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

    return NextResponse.json(materiaPrima, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating materia prima' }, { status: 500 });
  }
}
