import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Code, Key, Copy, Check, Terminal, Database, Server } from 'lucide-react';

export default function ApiDocs() {
  const { user, userData } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/order/add',
      desc: 'Place a new social media order',
      params: [
        { name: 'service', type: 'int', desc: 'Service ID' },
        { name: 'link', type: 'string', desc: 'Link to post/profile' },
        { name: 'quantity', type: 'int', desc: 'Amount to order' }
      ]
    },
    {
      method: 'POST',
      path: '/api/v1/order/status',
      desc: 'Check existing order status',
      params: [
        { name: 'order', type: 'int', desc: 'Order ID' }
      ]
    },
    {
      method: 'GET',
      path: '/api/v1/balance',
      desc: 'Get current user balance',
      params: []
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 text-white rounded-2xl">
              <Code size={24} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">API Integration</h1>
          </div>
          <p className="text-gray-500 font-bold max-w-lg">Developer documentation for integrating our services into your own applications.</p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6">
           <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Your API Key</p>
              <div className="font-mono text-sm text-gray-900 break-all max-w-[200px] truncate">
                 {user ? user.uid : '••••••••••••••••'}
              </div>
           </div>
           <button 
             onClick={copyKey}
             className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
               copied ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
             }`}
           >
             {copied ? <Check size={20} /> : <Key size={20} />}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           {endpoints.map((ep, i) => (
             <motion.div
               key={ep.path}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden"
             >
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        ep.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                         {ep.method}
                      </span>
                      <h3 className="font-mono text-sm font-black text-gray-900 underline decoration-blue-200 underline-offset-4">{ep.path}</h3>
                   </div>
                   <p className="text-xs font-bold text-gray-400">{ep.desc}</p>
                </div>
                <div className="p-8 space-y-6">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Terminal size={12} />
                        Parameters
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="flex bg-gray-50 rounded-2xl p-4 border border-gray-100 flex-col">
                            <span className="text-xs font-black text-gray-900 mb-0.5">key</span>
                            <span className="text-[10px] text-gray-500 font-medium">Your API key (Required)</span>
                         </div>
                         {ep.params.map(p => (
                           <div key={p.name} className="flex bg-gray-50 rounded-2xl p-4 border border-gray-100 flex-col">
                              <span className="text-xs font-black text-gray-900 mb-0.5">{p.name}</span>
                              <span className="text-[10px] text-gray-500 font-medium uppercase">{p.type} - {p.desc}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   <div className="bg-gray-900 rounded-3xl p-6 text-indigo-300 font-mono text-xs overflow-x-auto">
                      <p className="text-gray-500 mb-2">// Sample Request</p>
                      <pre>
{`fetch('${window.location.origin}${ep.path}', {
  method: '${ep.method}',
  body: JSON.stringify({
    key: '${user?.uid || 'YOUR_KEY'}',
    ${ep.params.map(p => `${p.name}: ${p.type === 'int' ? '123' : '"example"'}`).join(',\n    ')}
  })
})`}
                      </pre>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <Server size={20} className="text-blue-600" />
                 <h3 className="font-black text-gray-900 uppercase tracking-tighter">API Status</h3>
              </div>
              <div className="space-y-4">
                 {[
                   { label: 'HTTP API', status: 'online' },
                   { label: 'Webhook Engine', status: 'online' },
                   { label: 'Async Queue', status: 'online' },
                   { label: 'Global Edge', status: 'online' }
                 ].map(s => (
                   <div key={s.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <span className="text-xs font-bold text-gray-600">{s.label}</span>
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                         <span className="text-[10px] font-black uppercase text-green-600 tracking-widest">{s.status}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Database size={80} />
              </div>
              <div className="relative z-10">
                <h3 className="font-black text-xs uppercase tracking-widest mb-2">Need a custom feature?</h3>
                <p className="text-sm font-medium text-blue-100 leading-relaxed mb-6">Our enterprise API supports custom endpoints and high-throughput ordering.</p>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all">
                   Contact Developers
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
