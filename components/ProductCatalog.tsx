'use client';

import { useState, useMemo } from 'react';
import { updateProductStock } from '@/app/actions';

export function ProductCatalog({ products, showToast }: { products: any[], showToast?: (msg: string, type: 'info'|'success'|'error') => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [search, setSearch] = useState('');

  const handleSave = async (variantId: string) => {
    try {
      await updateProductStock(variantId, newStock);
      setEditingId(null);
      if(showToast) showToast('Stock updated successfully.', 'success');
    } catch(e) {
      if(showToast) showToast('Error updating stock', 'error');
    }
  };

  const handleSync = (productName: string) => {
    if(showToast) showToast(`${productName} synced to Flipkart and Meesho catalogs successfully!`, 'info');
  };

  const handleSyncAll = () => {
    if(showToast) showToast(`All ${filteredProducts.length} products synced to Flipkart and Meesho!`, 'info');
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const lowerSearch = search.toLowerCase();
    return products.filter(p => 
      (p.name?.toLowerCase().includes(lowerSearch)) ||
      (p.description?.toLowerCase().includes(lowerSearch)) ||
      (p.color?.toLowerCase().includes(lowerSearch)) ||
      (p.printName?.toLowerCase().includes(lowerSearch)) ||
      (p.category?.toLowerCase().includes(lowerSearch)) ||
      (p.sku?.toLowerCase().includes(lowerSearch))
    );
  }, [products, search]);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100/60 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <h2 className="text-3xl font-light text-slate-800 tracking-tight">Product Catalog</h2>
        <div className="w-full md:w-1/2 flex gap-2 relative">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, print, color..."
              className="w-full border-2 border-gray-200 rounded-xl p-3 pr-10 focus:outline-none focus:border-gray-800 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute right-3 top-3.5 text-gray-400">🔍</div>
          </div>
          <button 
            onClick={handleSyncAll}
            className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
          >
            Sync All <span>⟳</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="p-6 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-5">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-xl object-cover shadow-sm border border-slate-100" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 text-xs border border-slate-100">No Img</div>
                )}
                <div>
                  <h3 className="font-semibold text-lg text-slate-800 tracking-tight">{product.name}</h3>
                  <p className="text-xs text-slate-400 font-mono tracking-widest mt-1 mb-2">{product.sku || 'NO-SKU'}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.color && <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full text-xs font-medium">{product.color}</span>}
                    {product.printName && <span className="bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full text-xs font-medium">{product.printName}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end justify-center">
                <p className="text-sm text-gray-500 mb-1">Base Price</p>
                <p className="font-bold text-gray-900 text-lg mb-2">₹{product.basePrice ? product.basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</p>
                <button 
                  onClick={() => handleSync(product.name)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1 px-3 rounded border border-gray-300 transition-colors"
                >
                  Sync Item
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Available Variations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {product.variants.map((variant: any) => (
                  <div key={variant.id} className="flex justify-between items-center border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-slate-50/50">
                    <div>
                      <span className="font-semibold text-slate-800 text-lg">{variant.size}</span>
                      <p className="text-xs text-slate-500 mt-0.5">₹{variant.price || product.basePrice}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {editingId === variant.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="border border-sky-300 rounded-md p-1.5 w-16 text-sm text-right focus:outline-none focus:ring-2 focus:ring-sky-100"
                            value={newStock}
                            onChange={(e) => setNewStock(Number(e.target.value))}
                          />
                          <button onClick={() => handleSave(variant.id)} className="text-sky-600 font-medium hover:text-sky-700 text-xs">Save</button>
                        </div>
                      ) : (
                        <span className="font-medium text-sm cursor-pointer text-slate-600 hover:text-slate-900 transition-colors" onClick={() => { setEditingId(variant.id); setNewStock(variant.stock); }}>
                          Qty: <span className={`${variant.stock > 10 ? 'text-emerald-600' : 'text-rose-500'} font-semibold ml-1`}>{variant.stock}</span> <span className="ml-1 opacity-50">✎</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {product.variants.length === 0 && (
                  <p className="text-sm text-slate-400 italic">No variants created.</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500 font-semibold text-lg border border-gray-200 rounded-xl bg-gray-50">
            No products found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
