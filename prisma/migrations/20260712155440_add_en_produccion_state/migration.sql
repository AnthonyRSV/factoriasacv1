-- CreateEnum
CREATE TYPE "PrioridadOrden" AS ENUM ('NORMAL', 'ALTA', 'URGENTE');

-- AlterEnum
ALTER TYPE "EstadoOrden" ADD VALUE 'EN_PRODUCCION';

-- AlterTable
ALTER TABLE "OrdenesFabricacion" ADD COLUMN     "fechaProduccion" TIMESTAMP(3),
ADD COLUMN     "prioridad" "PrioridadOrden" NOT NULL DEFAULT 'NORMAL';
