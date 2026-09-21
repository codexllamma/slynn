'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createOrderFlow, createProduct } from '@/app/actions';

export function ChatbotInput({ products, activeView, onViewChange, onClose, showToast }: { products: any[], activeView: string, onViewChange: (view: any) => void, onClose: () => void, showToast?: (msg: string, type: 'info'|'success'|'error') => void }) {
  const [step, setStep] = useState(0);
  const [actionType, setActionType] = useState<'SALE' | 'ADD_PRODUCT' | null>(null);
  
  const [channel, setChannel] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '', address: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchProduct, setSelectedSearchProduct] = useState<any>(null);
  
  // Inline Form State for selecting existing variants
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null);
  const [variantAddQty, setVariantAddQty] = useState<number>(1);
  const [variantAddPrice, setVariantAddPrice] = useState<number>(0);
  
  const [newProductName, setNewProductName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [printName, setPrintName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [newVariants, setNewVariants] = useState([{ size: 'M', quantity: 1, price: 0 }]);

  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Only scroll inner container smoothly when interactions happen
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [step, cartItems.length, selectedSearchProduct, addingVariantId]);

  const reset = () => {
    setStep(0);
    setActionType(null);
    setChannel('');
    setCartItems([]);
    setCustomerDetails({ name: '', email: '', phone: '', address: '' });
    setSelectedSearchProduct(null);
    resetNewProductForm();
  };

  const resetNewProductForm = () => {
    setNewProductName('');
    setSku('');
    setDescription('');
    setCategory('');
    setColor('');
    setPrintName('');
    setImageUrl('');
    setBasePrice('');
    setNewVariants([{ size: 'M', quantity: 1, price: 0 }]);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lower = searchQuery.toLowerCase();
    
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.printName?.toLowerCase().includes(lower) || 
      p.color?.toLowerCase().includes(lower) || 
      p.sku?.toLowerCase().includes(lower)
    ).slice(0, 10);
  }, [searchQuery, products]);

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const payloadItems = cartItems.map(item => {
        if (item.isNew) {
          return {
            isNewProduct: true,
            newProductDetails: {
              name: item.name,
              description: item.description,
              category: item.category,
              color: item.color,
              printName: item.printName,
              imageUrl: item.imageUrl,
              basePrice: Number(item.basePrice),
              variants: item.variants.map((v: any) => ({
                size: v.size,
                quantity: Number(v.quantity),
                price: Number(v.price)
              }))
            }
          };
        } else {
          return {
            isNewProduct: false,
            productVariantId: item.variantId,
            quantity: Number(item.quantity),
            soldPricePerUnit: Number(item.price)
          };
        }
      });

      await createOrderFlow({
        channel: channel as any,
        items: payloadItems,
        customerDetails: customerDetails.name ? customerDetails : undefined,
      });
      if(showToast) showToast('Order logged successfully!', 'success');
      reset();
      onViewChange('ORDERS');
      onClose(); // Close the chatbot on success
    } catch (e: any) {
      if(showToast) showToast('Error: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleAddProduct = async () => {
    setLoading(true);
    try {
      if(!newProductName) throw new Error("Name required");
      await createProduct({
        name: newProductName,
        sku,
        description,
        category,
        color,
        printName: printName || undefined,
        imageUrl,
        basePrice: Number(basePrice),
        variants: newVariants.map(v => ({ size: v.size, stock: Number(v.quantity), price: Number(v.price) || Number(basePrice) }))
      });
      if(showToast) showToast('Product added successfully!', 'success');
      reset();
      onViewChange('CATALOG');
      onClose();
    } catch (e: any) {
      if(showToast) showToast('Error: ' + e.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col h-[700px] animate-fadeIn transition-all duration-500">
      
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-white/50 backdrop-blur-3xl scrollbar-hide">
        
        {/* Step 0: Main Menu */}
        <div className="flex flex-col animate-slideUp">
          <div className="bg-slate-50 text-slate-700 rounded-2xl rounded-tl-sm p-5 self-start max-w-md shadow-sm border border-slate-100">
            <p className="font-light text-lg mb-2">Hello! How can I help you today?</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 max-w-md">
            <button onClick={() => { setActionType('SALE'); setStep(1); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-medium py-2.5 px-5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
              Log a Consignment / Sale
            </button>
            <button onClick={() => { setActionType('ADD_PRODUCT'); setStep(1); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-medium py-2.5 px-5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
              Add a New Product Catalog Entry
            </button>
            <button onClick={() => { onViewChange('CATALOG'); onClose(); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-medium py-2.5 px-5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
              View Product Catalog
            </button>
            <button onClick={() => { onViewChange('FINANCIALS'); onClose(); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-medium py-2.5 px-5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
              View Financials
            </button>
            <button onClick={() => { onViewChange('ORDERS'); onClose(); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-medium py-2.5 px-5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
              View Orders
            </button>
          </div>
        </div>

        {/* --- LOG A SALE FLOW --- */}
        {actionType === 'SALE' && step >= 1 && (
          <div className="flex flex-col animate-slideUp">
            <div className="bg-slate-50 text-slate-700 rounded-2xl rounded-tl-sm p-5 self-start max-w-md shadow-sm border border-slate-100">
              Which channel is this consignment for?
            </div>
            {step === 1 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {['ONLINE_RETAIL', 'OFFLINE_RETAIL', 'WHOLESALE'].map((ch) => (
                  <button key={ch} onClick={() => { setChannel(ch); setStep(2); }} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-2 px-4 rounded-xl transition-all">
                    {ch.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
            {step > 1 && (
              <div className="bg-slate-800 text-white rounded-2xl rounded-tr-sm p-4 self-end max-w-xs mt-3 shadow-md font-medium text-sm">
                {channel.replace('_', ' ')}
              </div>
            )}
          </div>
        )}

        {actionType === 'SALE' && step >= 2 && (
          <div className="flex flex-col animate-slideUp">
            <div className="bg-slate-50 text-slate-700 rounded-2xl rounded-tl-sm p-5 self-start max-w-md shadow-sm border border-slate-100">
              Who is the customer or consignee?
            </div>
            {step === 2 && (
              <div className="mt-3 space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm max-w-lg w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Customer Name *</label>
                    <input type="text" className="w-full border-gray-300 rounded-lg p-2 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={customerDetails.name} onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
                    <input type="email" className="w-full border-gray-300 rounded-lg p-2 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={customerDetails.email} onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Phone</label>
                    <input type="text" className="w-full border-gray-300 rounded-lg p-2 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={customerDetails.phone} onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Address</label>
                    <input type="text" className="w-full border-gray-300 rounded-lg p-2 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" value={customerDetails.address} onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})} />
                  </div>
                </div>
                
                <button onClick={() => setStep(3)} disabled={!customerDetails.name} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg w-full transition-colors disabled:opacity-50 mt-4">
                  Confirm Customer
                </button>
              </div>
            )}
            {step > 2 && (
              <div className="bg-slate-800 text-white rounded-2xl rounded-tr-sm p-4 self-end max-w-xs mt-3 shadow-md font-medium text-sm">
                Customer: {customerDetails.name}
              </div>
            )}
          </div>
        )}

        {actionType === 'SALE' && step >= 3 && (
          <div className="flex flex-col animate-slideUp">
            <div className="bg-slate-50 text-slate-700 rounded-2xl rounded-tl-sm p-5 self-start max-w-xl shadow-sm border border-slate-100">
              Let's add products to the consignment.
              {cartItems.length > 0 && <span className="block mt-2 font-medium text-sky-700">{cartItems.length} items added so far.</span>}
            </div>
            
            {step === 3 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <button onClick={() => setStep(4)} className="bg-white border-2 border-purple-500 text-purple-600 font-bold py-2 px-4 rounded-xl hover:bg-purple-50">
                  + Add New Product
                </button>
                <button onClick={() => setStep(5)} className="bg-white border-2 border-blue-500 text-blue-600 font-bold py-2 px-4 rounded-xl hover:bg-blue-50">
                  + Select Existing Product
                </button>
                
                {cartItems.length > 0 && (
                  <button onClick={handleCreateOrder} disabled={loading} className="w-full mt-4 bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700">
                    {loading ? 'Processing...' : 'Create Consignment & Invoice'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add New Product inside Sale Flow */}
        {actionType === 'SALE' && step === 4 && (
          <div className="flex flex-col animate-slideUp">
             <div className="mt-3 w-full bg-white p-5 rounded-xl border border-purple-200 shadow-sm">
                <h3 className="font-bold text-purple-800 mb-3">Create New Product Consignment</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input type="text" className="col-span-2 border rounded p-2 text-sm" placeholder="Product Name" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
                  <input type="text" className="col-span-2 border rounded p-2 text-sm" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                  <input type="text" className="border rounded p-2 text-sm" placeholder="Category (T-Shirt)" value={category} onChange={e => setCategory(e.target.value)} />
                  <input type="text" className="border rounded p-2 text-sm" placeholder="Base Color" value={color} onChange={e => setColor(e.target.value)} />
                  <input type="text" className="border rounded p-2 text-sm" placeholder="Print Name" value={printName} onChange={e => setPrintName(e.target.value)} />
                  <input type="number" className="border rounded p-2 text-sm" placeholder="Base Price (₹)" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} />
                </div>
                
                <div className="mb-4">
                  <label className="text-sm font-bold text-gray-700 mb-3 block">Sizes & Quantities Received</label>
                  <div className="flex gap-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-slate-500 w-1/3">Size (e.g. M, L)</span>
                    <span className="text-xs font-semibold text-slate-500 w-1/3">Quantity</span>
                    <span className="text-xs font-semibold text-slate-500 w-1/3">Price (₹)</span>
                  </div>
                  {newVariants.map((v, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" placeholder="M" className="border border-slate-200 rounded p-2 text-sm w-1/3 focus:outline-none focus:border-sky-400" value={v.size} onChange={e => { const nw = [...newVariants]; nw[i].size = e.target.value; setNewVariants(nw); }} />
                      <input type="number" placeholder="0" className="border border-slate-200 rounded p-2 text-sm w-1/3 focus:outline-none focus:border-sky-400" value={v.quantity} onChange={e => { const nw = [...newVariants]; nw[i].quantity = Number(e.target.value); setNewVariants(nw); }} />
                      <input type="number" placeholder="Base" className="border border-slate-200 rounded p-2 text-sm w-1/3 focus:outline-none focus:border-sky-400" value={v.price} onChange={e => { const nw = [...newVariants]; nw[i].price = Number(e.target.value); setNewVariants(nw); }} />
                    </div>
                  ))}
                  <button onClick={() => setNewVariants([...newVariants, { size: '', quantity: 1, price: Number(basePrice) }])} className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors mt-1">+ Add another size</button>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => {
                    if(!newProductName) return alert("Name required");
                    setCartItems([...cartItems, {
                      isNew: true, name: newProductName, description, category, color, printName, imageUrl, basePrice, variants: newVariants
                    }]);
                    resetNewProductForm();
                    setStep(3); // Go back to Add Products menu
                  }} className="flex-1 bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700">Add to Consignment</button>
                  <button onClick={() => { resetNewProductForm(); setStep(3); }} className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 rounded hover:bg-gray-300">Cancel</button>
                </div>
             </div>
          </div>
        )}

        {/* Select Existing Product inside Sale Flow */}
        {actionType === 'SALE' && step === 5 && (
          <div className="flex flex-col animate-slideUp">
             <div className="mt-3 w-full bg-white p-6 rounded-2xl border border-sky-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                <h3 className="font-bold text-sky-800 mb-4 text-lg">Search Existing Catalog</h3>
                
                {!selectedSearchProduct ? (
                  <>
                    <input 
                      type="text" 
                      placeholder="Search products (e.g. Wolf Graphic Tee)..." 
                      className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 mb-4 bg-slate-50/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="border border-slate-100 shadow-sm rounded-xl max-h-64 overflow-y-auto mb-4 bg-white">
                        {searchResults.map(p => (
                          <div key={p.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors" onClick={() => setSelectedSearchProduct(p)}>
                            <div>
                              <p className="font-semibold text-slate-800">{p.name} {p.printName ? `(${p.printName})` : ''}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{p.color} | {p.variants.length} Variants Available</p>
                            </div>
                            <div className="text-xs font-bold bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full hover:bg-sky-100 transition-colors">Select Product →</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mb-6">
                    <button onClick={() => setSelectedSearchProduct(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1 transition-colors"><span>←</span> Back to Search</button>
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 mb-5">
                      <p className="font-bold text-slate-800 text-lg">{selectedSearchProduct.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{selectedSearchProduct.color} {selectedSearchProduct.printName ? `(${selectedSearchProduct.printName})` : ''}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-3">Select Size Variant:</p>
                    <div className="space-y-3">
                      {selectedSearchProduct.variants.map((v: any) => (
                        <div key={v.id} className="p-4 border border-slate-200 rounded-xl hover:border-sky-300 hover:bg-sky-50/30 transition-all shadow-sm">
                          
                          {addingVariantId !== v.id ? (
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => {
                              setAddingVariantId(v.id);
                              setVariantAddQty(1);
                              setVariantAddPrice(v.price || selectedSearchProduct.basePrice);
                            }}>
                              <div>
                                <p className="font-bold text-slate-800 text-lg">Size {v.size}</p>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">Stock Available: {v.stock}</p>
                              </div>
                              <div className="text-xs font-bold bg-sky-100 text-sky-800 px-4 py-2 rounded-full hover:bg-sky-200 transition-colors shadow-sm">Add Size +</div>
                            </div>
                          ) : (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <p className="font-bold text-slate-800 text-lg mb-3">Adding Size {v.size}</p>
                              <div className="flex gap-3 mb-4">
                                <div className="flex-1">
                                  <label className="text-xs font-semibold text-slate-500 block mb-1">Quantity</label>
                                  <input type="number" min="1" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-sky-400" value={variantAddQty} onChange={e => setVariantAddQty(Number(e.target.value))} />
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs font-semibold text-slate-500 block mb-1">Price (₹)</label>
                                  <input type="number" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-sky-400" value={variantAddPrice} onChange={e => setVariantAddPrice(Number(e.target.value))} />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => {
                                  if(variantAddQty > 0) {
                                    setCartItems([...cartItems, { isNew: false, variantId: v.id, name: selectedSearchProduct.name, size: v.size, quantity: variantAddQty, price: variantAddPrice }]);
                                    setAddingVariantId(null);
                                    setSelectedSearchProduct(null);
                                    setSearchQuery('');
                                    setStep(3); // Return to menu
                                  }
                                }} className="flex-1 bg-sky-600 text-white font-bold py-2 rounded-lg hover:bg-sky-700 transition-colors">Confirm & Add</button>
                                <button onClick={() => setAddingVariantId(null)} className="bg-slate-100 text-slate-600 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {selectedSearchProduct.variants.length === 0 && (
                        <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-xl text-center">No variants exist for this product.</p>
                      )}
                    </div>
                  </div>
                )}

                <button onClick={() => { setSelectedSearchProduct(null); setSearchQuery(''); setStep(3); }} className="w-full border border-slate-200 bg-white text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
             </div>
          </div>
        )}

        {/* --- ADD PRODUCT FLOW (Standalone Database Entry) --- */}
        {actionType === 'ADD_PRODUCT' && step >= 1 && (
          <div className="flex flex-col animate-slideUp">
            <div className="bg-slate-50 text-slate-700 rounded-2xl rounded-tl-sm p-5 self-start max-w-xl shadow-sm border border-slate-100">
              Let's add a new item to your clothing line database.
            </div>
            {step === 1 && (
              <div className="mt-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm w-full space-y-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input type="text" className="col-span-2 border rounded p-2 text-sm" placeholder="Product Name" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
                  <input type="text" className="col-span-2 border rounded p-2 text-sm" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                  <input type="text" className="border rounded p-2 text-sm" placeholder="SKU Base" value={sku} onChange={e => setSku(e.target.value)} />
                  <input type="text" className="border rounded p-2 text-sm" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
                  <input type="text" className="border rounded p-2 text-sm" placeholder="Base Color" value={color} onChange={e => setColor(e.target.value)} />
                  <input type="text" className="border rounded p-2 text-sm" placeholder="Print Name" value={printName} onChange={e => setPrintName(e.target.value)} />
                  <input type="text" className="col-span-2 border rounded p-2 text-sm" placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                  <input type="number" className="border rounded p-2 text-sm" placeholder="Base Price (₹)" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} />
                </div>
                
                <div className="mb-4">
                  <label className="text-sm font-bold text-gray-700 mb-3 block">Sizes & Quantities</label>
                  <div className="flex gap-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-slate-500 w-1/3">Size (e.g. M, L)</span>
                    <span className="text-xs font-semibold text-slate-500 w-1/3">Quantity</span>
                    <span className="text-xs font-semibold text-slate-500 w-1/3">Price (₹)</span>
                  </div>
                  {newVariants.map((v, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" placeholder="M" className="border border-slate-200 rounded p-2 text-sm w-1/3 focus:outline-none focus:border-sky-400" value={v.size} onChange={e => { const nw = [...newVariants]; nw[i].size = e.target.value; setNewVariants(nw); }} />
                      <input type="number" placeholder="0" className="border border-slate-200 rounded p-2 text-sm w-1/3 focus:outline-none focus:border-sky-400" value={v.quantity} onChange={e => { const nw = [...newVariants]; nw[i].quantity = Number(e.target.value); setNewVariants(nw); }} />
                      <input type="number" placeholder="Base" className="border border-slate-200 rounded p-2 text-sm w-1/3 focus:outline-none focus:border-sky-400" value={v.price} onChange={e => { const nw = [...newVariants]; nw[i].price = Number(e.target.value); setNewVariants(nw); }} />
                    </div>
                  ))}
                  <button onClick={() => setNewVariants([...newVariants, { size: '', quantity: 1, price: Number(basePrice) }])} className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors mt-1">+ Add another size</button>
                </div>
                
                <button onClick={handleAddProduct} disabled={loading || !newProductName} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg w-full transition-colors disabled:opacity-50 mt-4">
                  {loading ? 'Saving...' : 'Add Product'}
                </button>
                <button onClick={reset} className="text-gray-500 font-semibold w-full text-center hover:text-gray-800 transition-colors mt-2">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
