import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { 
      invoice: true, 
      customer: true,
      items: {
        include: {
          productVariant: {
            include: { product: true }
          }
        }
      }
    },
  });

  if (!order || !order.invoice) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 sm:p-12 md:p-20 font-sans print:p-0">
      <div className="max-w-3xl mx-auto border border-gray-200 p-10 shadow-sm print:border-none print:shadow-none">
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">INVOICE</h1>
            <p className="text-gray-500 mt-2">#{order.invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">ERP System Inc.</h2>
            <p className="text-gray-500">123 Business Rd.<br/>Tech City, TX 75001</p>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
            <p className="font-semibold text-lg">{order.customer?.name || 'Valued Customer'}</p>
            {order.customer?.email && <p className="text-gray-500 text-sm">{order.customer.email}</p>}
            {order.customer?.phone && <p className="text-gray-500 text-sm">{order.customer.phone}</p>}
            {order.customer?.address && <p className="text-gray-500 text-sm mt-1">{order.customer.address}</p>}
            <p className="text-gray-400 text-xs mt-2 uppercase">{order.channel.replace('_', ' ')} Channel</p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Date Issued</h3>
            <p className="font-semibold">{new Date(order.invoice.issuedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-3 font-bold text-gray-800">Description</th>
              <th className="py-3 font-bold text-gray-800 text-right">Price</th>
              <th className="py-3 font-bold text-gray-800 text-right">Qty</th>
              <th className="py-3 font-bold text-gray-800 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-4">
                  <p className="font-semibold text-gray-800">{item.productVariant.product.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.productVariant.product.color}{item.productVariant.product.printName ? ` (${item.productVariant.product.printName})` : ''} - Size: {item.productVariant.size}
                  </p>
                  {item.productVariant.product.sku && <p className="text-xs text-gray-400">SKU: {item.productVariant.product.sku}</p>}
                </td>
                <td className="py-4 text-right text-gray-600">₹{item.soldPricePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                <td className="py-4 text-right font-semibold text-gray-800">₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between border-t-2 border-gray-800 pt-4">
              <span className="font-bold text-xl">Grand Total</span>
              <span className="font-bold text-xl text-green-700">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-400 text-sm print:mt-32">
          <p>Thank you for your business!</p>
          <div className="print:hidden mt-4">
            <PrintButton />
          </div>
        </div>
      </div>
    </div>
  );
}
