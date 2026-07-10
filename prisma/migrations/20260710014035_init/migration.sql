-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDEDOR', 'JEFE_TALLER', 'ALMACENERO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('TIENDA', 'EMPRESA');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE_PAGO', 'APROBADA', 'TERMINADA', 'ENTREGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoMateriaPrima" AS ENUM ('VARILLA', 'PLATINA', 'MUELLE', 'TUERCA', 'ARANDELA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaPrima" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoMateriaPrima" NOT NULL,
    "diametro" TEXT,
    "espesor" TEXT,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductosFichaTecnica" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "formulaCalculo" TEXT NOT NULL,
    "materiaPrimaId" TEXT NOT NULL,

    CONSTRAINT "ProductosFichaTecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenesFabricacion" (
    "id" TEXT NOT NULL,
    "codigoCorrelativoUnico" SERIAL NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "tipoCliente" "TipoCliente" NOT NULL,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "fechaComprometida" TIMESTAMP(3) NOT NULL,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "montoAbonado" DOUBLE PRECISION NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "esUrgente" BOOLEAN NOT NULL DEFAULT false,
    "cargoUrgencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tokenConsulta" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenesFabricacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleOrden" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT,
    "productoComercialId" TEXT,
    "largo" DOUBLE PRECISION NOT NULL,
    "ancho" DOUBLE PRECISION NOT NULL,
    "espesor" DOUBLE PRECISION NOT NULL,
    "forma" TEXT NOT NULL,
    "calidadAcero" TEXT NOT NULL,
    "colorPintura" TEXT,
    "tuercasTipo" TEXT,
    "cantidadSolicitada" INTEGER NOT NULL,

    CONSTRAINT "DetalleOrden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcesoEtapa" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "etapaNombre" TEXT NOT NULL,
    "ordenSecuencia" INTEGER NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "operarioAsignado" TEXT,
    "fechaCompletada" TIMESTAMP(3),

    CONSTRAINT "ProcesoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KardexInventario" (
    "id" TEXT NOT NULL,
    "materiaPrimaId" TEXT NOT NULL,
    "tipoMovimiento" "TipoMovimiento" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KardexInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalidaAutorizada" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "jefeTallerId" TEXT NOT NULL,
    "autorizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalidaAutorizada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoComercial" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioVenta" DOUBLE PRECISION,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KardexComercial" (
    "id" TEXT NOT NULL,
    "productoComercialId" TEXT NOT NULL,
    "tipoMovimiento" "TipoMovimiento" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KardexComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaPrima_codigo_key" ON "MateriaPrima"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProductosFichaTecnica_codigo_key" ON "ProductosFichaTecnica"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenesFabricacion_codigoCorrelativoUnico_key" ON "OrdenesFabricacion"("codigoCorrelativoUnico");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenesFabricacion_tokenConsulta_key" ON "OrdenesFabricacion"("tokenConsulta");

-- CreateIndex
CREATE UNIQUE INDEX "SalidaAutorizada_ordenId_key" ON "SalidaAutorizada"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoComercial_codigo_key" ON "ProductoComercial"("codigo");

-- AddForeignKey
ALTER TABLE "ProductosFichaTecnica" ADD CONSTRAINT "ProductosFichaTecnica_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleOrden" ADD CONSTRAINT "DetalleOrden_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenesFabricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleOrden" ADD CONSTRAINT "DetalleOrden_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "ProductosFichaTecnica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleOrden" ADD CONSTRAINT "DetalleOrden_productoComercialId_fkey" FOREIGN KEY ("productoComercialId") REFERENCES "ProductoComercial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcesoEtapa" ADD CONSTRAINT "ProcesoEtapa_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenesFabricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexInventario" ADD CONSTRAINT "KardexInventario_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexInventario" ADD CONSTRAINT "KardexInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalidaAutorizada" ADD CONSTRAINT "SalidaAutorizada_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenesFabricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalidaAutorizada" ADD CONSTRAINT "SalidaAutorizada_jefeTallerId_fkey" FOREIGN KEY ("jefeTallerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexComercial" ADD CONSTRAINT "KardexComercial_productoComercialId_fkey" FOREIGN KEY ("productoComercialId") REFERENCES "ProductoComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexComercial" ADD CONSTRAINT "KardexComercial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
