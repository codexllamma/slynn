import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { numberToWords } from '@/lib/numberToWords';

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      invoice: true,
      items: {
        include: { product: true }
      }
    }
  });

  if (!order) return notFound();

  const invoiceNumber = order.invoice?.invoiceNumber || 'N/A';
  const issueDate = order.invoice?.issuedAt ? new Date(order.invoice.issuedAt).toLocaleDateString() : new Date(order.orderDate).toLocaleDateString();

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 font-sans print:p-0 print:m-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 10mm; }
        }
      `}} />
      
      <div className="max-w-4xl mx-auto border-2 border-black relative">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black p-2">
          <div className="w-32 h-16 bg-gray-200 flex items-center justify-center font-bold text-gray-500 border border-dashed border-gray-400">
            LOGO
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-2">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-center">Invoice</h1>
          </div>
          <div className="text-right text-[10px] leading-tight max-w-[280px]">
            <p className="font-bold text-sm">SLYN</p>
            <p>Sector 20, Nerul, Navi Mumbai,</p>
            <p>THANE, MAHARASHTRA-400706</p>
            <p>Phone no.: 7400140507</p>
            <p>Email: slyninda@gmail.com</p>
            <p>GSTIN Number: 27CAVPH8597Q1Z6 - Navi Mumbai</p>
          </div>
        </div>

        {/* Bill To & Invoice Details */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/2 border-r-2 border-black">
            <div className="bg-[#b91c1c] text-white font-bold p-1 text-sm border-b-2 border-black">Bill To</div>
            <div className="p-2 text-sm min-h-[80px]">
              {order.customerDetails ? order.customerDetails : 'Cash Customer'}
            </div>
          </div>
          <div className="w-1/2">
            <div className="bg-[#b91c1c] text-white font-bold p-1 text-sm border-b-2 border-black">Invoice Details</div>
            <div className="p-2 text-sm">
              <p>Invoice No: <strong>{invoiceNumber}</strong></p>
              <p>Date: {issueDate}</p>
            </div>
          </div>
        </div>
        <div className="border-b-2 border-black p-1 text-right text-xs font-bold">
          Place of Supply: Maharashtra
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse border-b-2 border-black">
          <thead>
            <tr className="bg-[#b91c1c] text-white text-xs border-b-2 border-black">
              <th className="border-r-2 border-black p-1">#</th>
              <th className="border-r-2 border-black p-1 text-left">Item Name</th>
              <th className="border-r-2 border-black p-1">HSN/SAC</th>
              <th className="border-r-2 border-black p-1">Quantity</th>
              <th className="border-r-2 border-black p-1">Unit</th>
              <th className="border-r-2 border-black p-1">Price/Unit</th>
              <th className="p-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.id} className="text-sm border-b border-black">
                <td className="border-r-2 border-black p-1 text-center">{idx + 1}</td>
                <td className="border-r-2 border-black p-1">{item.product.name} {item.product.printName ? `(${item.product.printName})` : ''}</td>
                <td className="border-r-2 border-black p-1 text-center">{item.hsnSac || '-'}</td>
                <td className="border-r-2 border-black p-1 text-center">{item.quantity}</td>
                <td className="border-r-2 border-black p-1 text-center">{item.unit}</td>
                <td className="border-r-2 border-black p-1 text-right">{item.pricePerUnit.toFixed(2)}</td>
                <td className="p-1 text-right">{item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
            {/* Empty rows filler if needed, but not strictly requested. */}
          </tbody>
        </table>

        {/* Tax & Totals Split */}
        <div className="flex border-b-2 border-black">
          <div className="w-[60%] border-r-2 border-black flex flex-col">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#b91c1c] text-white text-xs border-b-2 border-black">
                  <th className="border-r-2 border-black p-1 text-left">Tax type</th>
                  <th className="border-r-2 border-black p-1 text-right">Taxable amount</th>
                  <th className="border-r-2 border-black p-1 text-right">Rate</th>
                  <th className="p-1 text-right">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr>
                  <td className="border-r-2 border-black p-1">GST</td>
                  <td className="border-r-2 border-black p-1 text-right">{(order.subTotal - order.discount).toFixed(2)}</td>
                  <td className="border-r-2 border-black p-1 text-right">{order.taxRate.toFixed(1)}%</td>
                  <td className="p-1 text-right">{order.taxAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="w-[40%] flex flex-col justify-between text-sm">
            <div className="flex justify-between border-b border-black p-1">
              <span>Sub Total</span>
              <span>{order.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-black p-1">
              <span>Discount(0.000%)</span>
              <span>{order.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-black p-1">
              <span>Tax ({order.taxRate.toFixed(1)}%)</span>
              <span>{order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b-2 border-black p-1">
              <span>Round off</span>
              <span>{(order.totalAmount - (order.subTotal - order.discount + order.taxAmount)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b-2 border-black p-1 bg-[#b91c1c] text-white font-bold">
              <span>Total</span>
              <span>{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-black p-1">
              <span>Received</span>
              <span>{order.receivedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-black p-1">
              <span>Balance</span>
              <span>{order.balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-1 font-bold text-[#b91c1c]">
              <span>You Saved</span>
              <span>{order.discount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Amount in words & Payment Mode */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/2 border-r-2 border-black">
            <div className="bg-[#b91c1c] text-white font-bold p-1 text-sm border-b-2 border-black">Invoice Amount In Words</div>
            <div className="p-2 text-sm font-bold uppercase">{numberToWords(order.totalAmount)}</div>
          </div>
          <div className="w-1/2 flex flex-col">
            <div className="bg-[#b91c1c] text-white font-bold p-1 text-sm border-b-2 border-black">Payment Mode</div>
            <div className="p-2 text-sm font-bold">ABHYUDAYA BANK</div>
          </div>
        </div>

        {/* Footer Sections */}
        <div className="flex">
          <div className="w-1/3 border-r-2 border-black p-2 text-xs">
            <div className="text-[#b91c1c] font-bold mb-1">Bank Details</div>
            <p className="font-bold">ABHYUDAYA BANK</p>
            <p>Account No.: 031021100014459</p>
            <p>IFSC code: ABHY0065031</p>
          </div>
          <div className="w-1/3 border-r-2 border-black p-2 text-xs">
            <div className="text-[#b91c1c] font-bold mb-1">Terms and conditions</div>
            <ul className="list-disc pl-3">
              <li>50% ADVANCE & BALANCE WILL BE AGAINST DELIVERY</li>
              <li>GOODS ONCE SOLD WILL NOT BE TAKEN BACK</li>
            </ul>
          </div>
          <div className="w-1/3 p-2 flex flex-col justify-between text-xs items-end h-24">
            <div className="font-bold">For: SLYN</div>
            <div className="mt-auto">Authorized Signatory</div>
          </div>
        </div>

      </div>
    </div>
  );
}
