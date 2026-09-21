'use client';

import { useState } from 'react';
import { ChatbotInput } from './ChatbotInput';
import { ProductCatalog } from './ProductCatalog';
import { LedgerTable } from './LedgerTable';

export function Dashboard({ products, initialOrders }: { products: any[]; initialOrders: any[] }) {
  const [activeView, setActiveView] = useState<'CHAT' | 'CATALOG' | 'FINANCIALS' | 'ORDERS'>('CATALOG');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

  const showToast = (message: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 relative font-sans">
      
      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 ease-out transform ${toast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {toast && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border ${
            toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
            toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 
            'bg-slate-800/90 border-slate-700 text-white'
          }`}>
            <span className="text-xl">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <p className="font-medium tracking-wide">{toast.message}</p>
          </div>
        )}
      </div>

      <header className="flex justify-center pt-8 pb-4">
        <h1 className="text-3xl tracking-widest uppercase font-light text-slate-800">Slynn</h1>
      </header>
      
      {/* Central Collapsible Chatbot */}
      <div className="flex justify-center mb-12 relative z-50">
        {!isChatbotOpen ? (
          <button 
            onClick={() => setIsChatbotOpen(true)}
            className="w-full max-w-lg bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-full py-4 px-6 text-slate-400 font-medium text-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:border-sky-200 hover:text-slate-600 transition-all duration-500 ease-out flex items-center justify-center gap-3"
          >
            <span className="text-sky-400 text-lg">✦</span> What could I help you with today?
          </button>
        ) : (
          <div className="w-full max-w-4xl relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsChatbotOpen(false)}
              className="absolute -top-4 -right-4 bg-slate-800 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold z-50 hover:bg-slate-900 transition-transform hover:scale-110 shadow-lg"
            >
              ✕
            </button>
            <ChatbotInput 
              products={products} 
              activeView={activeView}
              onViewChange={setActiveView} 
              onClose={() => setIsChatbotOpen(false)}
              showToast={showToast}
            />
          </div>
        )}
      </div>

      {/* Dynamic Views below Chatbot */}
      <div className="transition-all duration-700 ease-in-out relative z-10">
        {activeView === 'CATALOG' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProductCatalog products={products} showToast={showToast} />
          </div>
        )}

        {(activeView === 'FINANCIALS' || activeView === 'ORDERS') && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LedgerTable initialOrders={initialOrders} defaultView={activeView} />
          </div>
        )}
      </div>
    </div>
  );
}
