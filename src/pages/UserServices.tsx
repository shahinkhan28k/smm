import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Search, ListOrdered, Filter } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  pricePer1k: number;
  minQuantity: number;
  maxQuantity: number;
  description: string;
  refill?: boolean;
  avgTime?: string;
  speed?: string;
}

export default function UserServices() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pageSettings, setPageSettings] = useState<any>(null);

  useEffect(() => {
    // Let's do it properly with onSnapshot for real-time
    const unsub = onSnapshot(doc(db, 'settings', 'pages'), (doc) => {
        if (doc.exists()) setPageSettings(doc.data());
    });
    
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('name')));
        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));

        const servSnap = await getDocs(collection(db, 'services'));
        setServices(servSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      } catch (err) {
        console.error("Services fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => unsub();
  }, []);

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Our Services</h1>
           {pageSettings?.servicesDescription && (
            <p className="text-sm text-gray-500 font-medium">{pageSettings.servicesDescription}</p>
           )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search services..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Average Time</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate (1k)</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Min/Max</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Refill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredServices.map((service, index) => (
              <motion.tr 
                key={service.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-6 py-4 text-xs font-mono text-gray-400">#{service.id.slice(0, 4)}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">{service.name}</p>
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">
                    {categories.find(c => c.id === service.categoryId)?.name || 'Unknown'}
                  </p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-[10px] font-bold text-gray-500">{service.avgTime || 'Instant'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-blue-700">${service.pricePer1k.toFixed(3)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600">{service.minQuantity}</span>
                    <span className="text-gray-300">/</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600">{service.maxQuantity}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${service.refill ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {service.refill ? 'Yes' : 'No'}
                   </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filteredServices.length === 0 && (
          <div className="py-20 text-center text-gray-400 italic">
            No services found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
