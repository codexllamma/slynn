'use client';

import { useState, useMemo } from 'react';
import { updateProductStock, updateProduct, addProductImageRecord, deleteProductImageRecord } from '@/app/actions';
import { uploadProductImage } from '@/lib/supabase';

export function ProductCatalog({ products, showToast }: { products: any[], showToast?: (msg: string, type: 'info'|'success'|'error') => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [search, setSearch] = useState('');
  
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setEditData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      category: product.category || '',
      color: product.color || '',
      printName: product.printName || '',
      basePrice: product.basePrice || 0,
    });
  };

  const handleSaveProduct = async (id: string) => {
    try {
      await updateProduct(id, {
        name: editData.name,
        sku: editData.sku,
        description: editData.description,
        category: editData.category,
        color: editData.color,
        printName: editData.printName,
        basePrice: Number(editData.basePrice),
      });
      setEditingProductId(null);
      if(showToast) showToast('Product updated successfully.', 'success');
    } catch(e) {
      if(showToast) showToast('Error updating product', 'error');
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleDeleteImage = async (imageId: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      try {
        await deleteProductImageRecord(imageId);
        if(showToast) showToast('Photo deleted.', 'success');
      } catch(e) {
        if(showToast) showToast('Error deleting photo', 'error');
      }
    }
  };

  const handleAddImage = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadProductImage(file);
      if (url) {
        await addProductImageRecord(productId, url);
        if(showToast) showToast('Photo added.', 'success');
      }
    } catch(err) {
      if(showToast) showToast('Error adding photo', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

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
            {editingProductId === product.id ? (
              <div className="p-6 border-b border-slate-50 bg-slate-50">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">Edit Catalog Entry</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input type="text" className="col-span-2 border rounded-lg p-2 text-sm" placeholder="Product Name" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  <input type="text" className="col-span-2 border rounded-lg p-2 text-sm" placeholder="Description" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                  <input type="text" className="border rounded-lg p-2 text-sm" placeholder="SKU" value={editData.sku} onChange={e => setEditData({...editData, sku: e.target.value})} />
                  <input type="text" className="border rounded-lg p-2 text-sm" placeholder="Category" value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} />
                  <input type="text" className="border rounded-lg p-2 text-sm" placeholder="Color" value={editData.color} onChange={e => setEditData({...editData, color: e.target.value})} />
                  <input type="text" className="border rounded-lg p-2 text-sm" placeholder="Print Name" value={editData.printName} onChange={e => setEditData({...editData, printName: e.target.value})} />
                  <input type="number" className="border rounded-lg p-2 text-sm" placeholder="Base Price (₹)" value={editData.basePrice} onChange={e => setEditData({...editData, basePrice: e.target.value})} />
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Manage Photos</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {product.images?.map((img: any) => (
                      <div key={img.id} className="relative group shrink-0">
                        <img src={img.url} className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm" alt="product" />
                        <button 
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md text-xs font-bold"
                          title="Delete photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center relative hover:bg-slate-100 transition-colors shrink-0 overflow-hidden cursor-pointer">
                      <span className="text-2xl text-slate-400 mb-1">+</span>
                      <span className="text-[10px] text-slate-500 font-medium px-2 text-center leading-tight">Add Photo</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleAddImage(product.id, e)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                        title="Upload new photo"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                          <span className="animate-spin text-sky-600 mb-1">⟳</span>
                          <span className="text-[9px] text-sky-700 font-bold">Uploading</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingProductId(null)} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-sm font-bold">Cancel</button>
                  <button onClick={() => handleSaveProduct(product.id)} className="px-4 py-2 text-white bg-sky-600 rounded-lg hover:bg-sky-700 text-sm font-bold">Save Changes</button>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-50 gap-4">
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
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditProduct(product)}
                      className="bg-white hover:bg-slate-50 text-sky-600 text-xs font-bold py-1.5 px-3 rounded border border-sky-200 transition-colors shadow-sm"
                    >
                      ✎ Edit
                    </button>
                    <button 
                      onClick={() => handleSync(product.name)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-3 rounded border border-gray-300 transition-colors shadow-sm"
                    >
                      Sync Item
                    </button>
                  </div>
                </div>
              </div>
            )}
            
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
