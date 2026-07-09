import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metal System - Control de Producción e Inventario',
  description: 'Sistema integral de fabricación, inventario y cotizaciones en taller metalúrgico',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
