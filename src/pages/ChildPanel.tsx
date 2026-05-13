import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, LayoutDashboard, Settings, Info } from 'lucide-react';

export default function ChildPanel() {
  const [panelName, setPanelName] = useState('');
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Shield size={120} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Child Panel</h1>
          <p className="text-blue-100 font-medium max-w-lg opacity-90 leading-relaxed">
            Start your own SMM business today. Create sub-reseller panels and manage your own customers with custom markups and branding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Settings size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Setup New Panel</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-widest text-[10px]">Domain Name</label>
              <input 
                type="text" 
                placeholder="example.com"
                value={panelName}
                onChange={(e) => setPanelName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-widest text-[10px]">Currency</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all">
                <option value="USD">USD - US Dollar</option>
                <option value="BDT">BDT - Bangladeshi Taka</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
            <div className="pt-4">
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl mb-6">
                <span className="text-sm font-bold text-blue-700">Monthly Cost</span>
                <span className="text-2xl font-black text-blue-800">$25.00</span>
              </div>
              <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                Get Child Panel
              </button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Info size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">How it works</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Point your domain name to our nameservers.",
                "Register here and your panel will be active within 24 hours.",
                "Set your own service prices and profit margins.",
                "Your customers' orders are automatically linked to us."
              ].map((text, i) => (
                <li key={i} className="flex gap-4">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center shrink-0 text-xs font-black">{i+1}</span>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{text}</p>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 text-indigo-900">
             <div className="flex items-center gap-3 mb-2">
                <LayoutDashboard size={20} className="text-indigo-600" />
                <h3 className="font-black text-xs uppercase tracking-widest">Revenue Model</h3>
             </div>
             <p className="text-sm font-medium opacity-80 leading-relaxed">
               You pay us the reseller price, and your customers pay you your set price. The difference is your pure profit!
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
