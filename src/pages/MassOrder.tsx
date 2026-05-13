import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ListOrdered, AlertCircle, ShoppingCart, HelpCircle } from 'lucide-react';

export default function MassOrder() {
  const [input, setInput] = useState('');
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
          <ListOrdered size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Mass Order</h1>
          <p className="text-gray-500 text-sm font-medium">Place hundreds of orders at once using the format below</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"
          >
            <div className="mb-6">
              <label className="block text-sm font-black text-gray-900 mb-2 uppercase tracking-widest text-[10px]">Orders Data</label>
              <textarea 
                rows={12}
                placeholder="service_id|quantity|link"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-3xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm leading-relaxed"
              />
            </div>
            
            <button className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
              <ShoppingCart size={18} />
              Submit Mass Order
            </button>
          </motion.div>

          <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-3xl flex gap-4">
             <AlertCircle className="text-yellow-600 shrink-0" size={24} />
             <div>
                <p className="text-sm font-bold text-yellow-800 mb-1">Important Note</p>
                <p className="text-xs text-yellow-700 leading-relaxed font-medium">Please ensure each order is on a new line. Invalid formats will be automatically skipped by the processing engine.</p>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <HelpCircle size={20} className="text-blue-600" />
                 <h3 className="font-bold text-gray-900">Format Guide</h3>
              </div>
              <div className="space-y-6">
                 <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">One line per order</p>
                    <code className="text-xs text-blue-600 font-bold block bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                      service_id|quantity|link
                    </code>
                 </div>
                 
                 <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-500">Example:</p>
                    <div className="p-5 bg-gray-900 rounded-3xl text-indigo-300 font-mono text-[10px] space-y-2 leading-relaxed">
                       <p>102|500|https://insta.com/p/1</p>
                       <p>102|1000|https://insta.com/p/2</p>
                       <p>105|2500|https://fb.com/posts/3</p>
                    </div>
                 </div>
                 
                 <div className="pt-4 space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing</p>
                    <p className="text-xs font-medium text-gray-600 leading-relaxed">
                      Total charge will be calculated automatically based on each service's rate and deducted from your balance.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
