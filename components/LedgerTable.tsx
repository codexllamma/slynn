'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export function LedgerTable({ initialOrders, defaultView = 'ALL' }: { initialOrders: any[], defaultView?: 'ALL' | 'FINANCIALS' | 'ORDERS' }) {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'ONLINE_RETAIL' | 'OFFLINE_RETAIL' | 'WHOLESALE'>('ALL');

  const filteredOrders = useMemo(() => {
    let result = initialOrders;
    
    if (channelFilter !== 'ALL') {
      result = result.filter(o => o.channel === channelFilter);
    }
    
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(o => {
        const matchesCustomer = o.customerDetails?.toLowerCase().includes(lowerSearch);
        const matchesInvoice = o.invoice?.invoiceNumber?.toLowerCase().includes(lowerSearch);
        const matchesItems = o.items.some((item: any) => 
          item.product?.name.toLowerCase().includes(lowerSearch) ||
          item.product?.printName?.toLowerCase().includes(lowerSearch)
        );
        return matchesCustomer || matchesInvoice || matchesItems;
      });
    }
    
    return result;
  }, [initialOrders, search, channelFilter]);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalItemsSold = filteredOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
  }, 0);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100/60 font-sans">
      {defaultView === 'FINANCIALS' ? (
        <div className="mb-10 p-8 bg-slate-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-3xl font-light tracking-tight mb-2">Financial Overview</h2>
            <p className="text-slate-400 font-medium text-sm">Real-time revenue metrics based on current filters.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 min-w-[150px] shadow-inner">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Items Sold</p>
              <p className="text-3xl font-light text-slate-100">{totalItemsSold}</p>
            </div>
            <div className="bg-sky-900/40 p-5 rounded-2xl border border-sky-800/50 min-w-[200px] shadow-inner">
              <p className="text-xs text-sky-400 font-bold uppercase tracking-widest mb-2">Total Revenue</p>
              <p className="text-3xl font-light text-sky-200">
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <h2 className="text-3xl font-light tracking-tight text-slate-800 mb-8">Order History</h2>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Search by product, print, customer, or invoice #..."
            className="w-full border border-slate-200 rounded-xl p-3 pr-10 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all text-sm bg-slate-50/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute right-3 top-3 text-slate-400">🔍</div>
        </div>
        <select
          className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-sm font-medium focus:outline-none focus:border-slate-400 cursor-pointer text-slate-700"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as any)}
        >
          <option value="ALL">All Channels</option>
          <option value="ONLINE_RETAIL">Online Retail</option>
          <option value="OFFLINE_RETAIL">Offline Retail</option>
          <option value="WHOLESALE">Wholesale</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <th className="py-4 px-5 font-semibold text-xs uppercase tracking-widest">Date</th>
              <th className="py-4 px-5 font-semibold text-xs uppercase tracking-widest">Channel</th>
              <th className="py-4 px-5 font-semibold text-xs uppercase tracking-widest">Items & Details</th>
              <th className="py-4 px-5 font-semibold text-xs uppercase tracking-widest">Customer</th>
              <th className="py-4 px-5 font-semibold text-xs uppercase tracking-widest text-right">Order Total</th>
              <th className="py-4 px-5 font-semibold text-xs uppercase tracking-widest text-center">Invoice</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors align-top">
                <td className="py-5 px-5 font-medium text-slate-500 whitespace-nowrap">{new Date(order.orderDate).toLocaleDateString()}</td>
                <td className="py-5 px-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    order.channel === 'ONLINE_RETAIL' ? 'bg-sky-50 text-sky-700' :
                    order.channel === 'OFFLINE_RETAIL' ? 'bg-stone-100 text-stone-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.channel.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-5 px-5">
                  <div className="space-y-3">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-semibold text-slate-800">{item.product?.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.product?.color}{item.product?.printName ? ` (${item.product?.printName})` : ''} 
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-slate-400">{item.quantity} &times; ₹{item.pricePerUnit.toLocaleString('en-IN')}</p>
                          <p className="font-bold text-slate-800">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-5 px-5 font-medium text-slate-700">{order.customerDetails || '-'}</td>
                <td className="py-5 px-5 text-right font-bold text-slate-900 text-lg">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="py-5 px-5 text-center">
                  {order.invoice ? (
                    <Link href={`/invoice/${order.id}`} className="inline-block bg-slate-800 text-white px-4 py-1.5 rounded-full hover:bg-slate-700 transition-colors font-semibold text-xs shadow-sm" target="_blank">
                      View
                    </Link>
                  ) : '-'}
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-lg">No orders matching your criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
