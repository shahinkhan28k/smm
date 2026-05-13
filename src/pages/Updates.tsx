import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Zap, Clock, Info, AlertTriangle } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'new_service' | 'maintenance' | 'price_change';
  createdAt: Timestamp;
}

export default function Updates() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'new_service': return 'bg-green-100 text-green-700 border-green-200';
      case 'maintenance': return 'bg-red-100 text-red-700 border-red-200';
      case 'price_change': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
          <Zap size={24} fill="currentColor" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">System Updates</h1>
          <p className="text-gray-500 text-sm font-medium">Latest news and service changes from the Boost team</p>
        </div>
      </div>

      <div className="space-y-6">
        {news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative group hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getTypeStyle(item.type)}`}>
                {item.type.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                <Clock size={14} />
                {item.createdAt?.toDate().toLocaleDateString()} at {item.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            <h2 className="text-xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
              {item.title}
            </h2>
            <div className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
              {item.content}
            </div>
            
            <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-10 transition-opacity">
               <Info size={48} />
            </div>
          </motion.div>
        ))}

        {news.length === 0 && (
          <div className="bg-white rounded-[32px] border-2 border-dashed border-gray-100 py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No updates posted yet</h3>
            <p className="text-gray-500 font-medium">We'll keep you posted on any system changes here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
