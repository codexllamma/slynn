import prisma from '@/lib/prisma';
import { Dashboard } from '@/components/Dashboard';

export const revalidate = 0;

export default async function Home() {
  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { name: 'asc' },
  });

  const initialOrders = await prisma.order.findMany({
    include: { 
      invoice: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { orderDate: 'desc' },
  });

  return (
    <main className="min-h-screen p-6 md:p-12">
      <Dashboard products={products} initialOrders={initialOrders} />
    </main>
  );
}
