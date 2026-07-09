import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

/**
 * Checks if we can connect to the database.
 * Returns false if the connection fails, indicating we should use mock fallback.
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost:5432/metal_db')) {
      // If using default localhost, check connection with short timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      
      // We will perform a simple raw query to check connection
      await prisma.$executeRaw`SELECT 1`;
      clearTimeout(timeout);
      return true;
    }
    await prisma.$executeRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.warn('PostgreSQL Database connection failed. Falling back to File-based DB mock.');
    return false;
  }
}
