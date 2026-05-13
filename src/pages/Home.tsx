import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ShoppingCart, Zap, TrendingUp, Wallet, Bell, BarChart3, ArrowRight, Star, ShieldCheck, Newspaper } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SiteSettings {
  siteName: string;
  bannerTitle: string;
  bannerText: string;
  bannerImage: string;
}

interface PageSettings {
    dashboardWelcome?: string;
    dashboardNews?: string;
}

export default function Home() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubSite = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as SiteSettings);
    }, (err) => {
      console.warn("Home: Error loading site settings", err);
    });

    const unsubPages = onSnapshot(doc(db, 'settings', 'pages'), (snap) => {
      if (snap.exists()) setPageSettings(snap.data());
      setLoading(false);
    }, (err) => {
      console.warn("Home: Error loading page settings", err);
      setLoading(false);
    });

    let unsubOrders = () => {};
    if (user) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      unsubOrders = onSnapshot(q, (snap) => {
        setRecentOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.warn("Home: Error loading recent orders", err);
      });
    }

    return () => {
      unsubSite();
      unsubPages();
      unsubOrders();
    };
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const stats = [
    { label: 'Total Balance', value: `$${userData?.balance.toFixed(2)}`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Orders', value: '0', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Completed', value: '0', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header / Banner */}
      {settings && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-64 sm:h-80 rounded-[40px] overflow-hidden shadow-2xl shadow-blue-100 group"
        >
          <img 
            src={settings.bannerImage} 
            alt="Banner" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/40 to-transparent flex flex-col justify-center px-8 sm:px-16 backdrop-blur-[1px]">
            <div className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-[10px] text-white font-black uppercase tracking-[0.2em] mb-4 border border-white/10">
                Official Dashboard
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter max-w-xl leading-[0.95] mb-4">
              {settings.bannerTitle}
            </h1>
            <p className="text-blue-50 font-bold sm:text-lg max-w-md opacity-80 leading-snug">
              {settings.bannerText}
            </p>
            <div className="mt-8">
                <NavLink to="/new-order" className="inline-flex items-center gap-3 bg-white text-blue-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all active:scale-95 shadow-xl">
                    Build Your Brand <ArrowRight size={16} />
                </NavLink>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Actions */}
        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-gray-100 flex flex-col gap-4 shadow-sm">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Announcements Section */}
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Newspaper size={20} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">System Updates</h3>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">Live Now</span>
                </div>
                
                <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <p className="text-gray-600 font-medium leading-relaxed leading-relaxed">
                            {pageSettings?.dashboardNews || "Welcome to Natok Boost! We have updated our services with higher speeds and 0% drop rates. Check out the new Facebook and Instagram categories."}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <NavLink to="/new-order" className="flex items-center justify-between p-6 bg-blue-600 text-white rounded-[24px] group hover:bg-blue-700 transition-all">
                            <div>
                                <h4 className="font-black uppercase tracking-tighter text-lg">New Order</h4>
                                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-70">Start growing now</p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-1">
                                <Zap size={20} fill="currentColor" />
                            </div>
                        </NavLink>
                        <NavLink to="/add-funds" className="flex items-center justify-between p-6 bg-gray-900 text-white rounded-[24px] group hover:bg-black transition-all">
                            <div>
                                <h4 className="font-black uppercase tracking-tighter text-lg">Top Up</h4>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-70">Recharge balance</p>
                            </div>
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-1">
                                <Wallet size={20} />
                            </div>
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Mini Tables / History */}
        <div className="space-y-8">
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Star size={18} />
                    </div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight">Recent Orders</h3>
                </div>
                
                <div className="space-y-4">
                    {recentOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className="max-w-[150px]">
                                <p className="text-[10px] font-black text-gray-400 uppercase truncate">Service #{order.serviceId.substring(0,6)}</p>
                                <p className="text-xs font-bold text-gray-900 truncate">{order.link}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {order.status}
                                </span>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">${order.charge.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                    {recentOrders.length === 0 && (
                        <p className="text-center py-8 text-xs font-bold text-gray-300 uppercase tracking-widest">No recent orders</p>
                    )}
                    <NavLink to="/orders" className="block text-center text-xs font-black text-blue-600 uppercase tracking-widest mt-4 hover:underline">
                        View All Orders
                    </NavLink>
                </div>
            </div>

            <div className="bg-indigo-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-10">
                    <Zap size={150} fill="white" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Need Help?</h3>
                    <p className="text-indigo-200 text-sm font-medium mb-6 leading-relaxed">Our support team is available 24/7 to assist you with any issues.</p>
                    <NavLink to="/tickets" className="w-full inline-flex items-center justify-center gap-2 bg-white text-indigo-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 transition-all">
                        Open Support Ticket
                    </NavLink>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
