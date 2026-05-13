import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'motion/react';
import { Users, ShoppingCart, Wallet, MessageSquare, ArrowUpRight, TrendingUp, RefreshCw, Server, Zap } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    openTickets: 0,
    totalUserBalance: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    pendingDeposits: 0
  });
  const [loading, setLoading] = useState(true);
  const [apiBalances, setApiBalances] = useState<{name: string, balance: string, currency: string}[]>([]);
  const [fetchingBalances, setFetchingBalances] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeFailedOrders = async () => {
    setAnalyzing(true);
    try {
      const q = query(collection(db, 'orders'), where('status', 'in', ['error', 'canceled']), limit(20));
      const snap = await getDocs(q);
      const failedOrders = snap.docs.map(doc => ({
        id: doc.id,
        service: doc.data().serviceName,
        note: doc.data().adminNote || doc.data().apiResponse?.error || 'Unknown'
      }));

      if (failedOrders.length === 0) {
        setAiAnalysis("বর্তমানে কোনো ফেইল হওয়া অর্ডার নেই এনালাইসিস করার জন্য।");
        return;
      }

      const res = await fetch('/api/ai/analyze-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: failedOrders })
      });
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
      setAiAnalysis("AI এনালাইসিস সম্ভব হয়নি। দয়া করে পরে চেষ্টা করুন।");
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchApiBalances = async () => {
    setFetchingBalances(true);
    try {
      const providersSnap = await getDocs(collection(db, 'providers'));
      const balancesList: any[] = [];
      
      for (const pDoc of providersSnap.docs) {
        const pData = pDoc.data();
        try {
          const res = await fetch('/api/provider/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiUrl: pData.apiUrl,
              apiKey: pData.apiKey,
              action: 'balance'
            })
          });
          const data = await res.json();
          if (data.balance) {
            balancesList.push({
              name: pData.name,
              balance: data.balance,
              currency: data.currency || 'USD'
            });
          }
        } catch (e) {
          console.error(`Failed to fetch balance for ${pData.name}`, e);
        }
      }
      setApiBalances(balancesList);
    } catch (err) {
      console.error("Error fetching providers:", err);
    } finally {
      setFetchingBalances(false);
    }
  };

  useEffect(() => {
    fetchApiBalances();
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const usersData = snap.docs.map(doc => doc.data());
      const totalUserBalance = usersData.reduce((acc, data) => acc + (data.balance || 0), 0);
      setStats(prev => ({ ...prev, totalUsers: snap.size, totalUserBalance }));
      setLoading(false);
    }, (err) => {
      console.error("AdminDashboard: Error loading users", err);
      setLoading(false);
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const ordersData = snap.docs.map(doc => doc.data());
      const totalRevenue = ordersData.reduce((acc, data) => acc + (data.charge || 0), 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = ordersData.filter(data => {
        const createdAt = data.createdAt?.toDate();
        return createdAt && createdAt >= today;
      }).length;

      const pendingOrders = ordersData.filter(data => data.status === 'pending').length;
      const completedOrders = ordersData.filter(data => data.status === 'completed').length;

      setStats(prev => ({ 
        ...prev, 
        totalOrders: snap.size, 
        totalRevenue, 
        todayOrders, 
        pendingOrders, 
        completedOrders 
      }));
    }, (err) => {
      console.warn("AdminDashboard: Error loading orders", err);
    });

    const unsubTickets = onSnapshot(collection(db, 'tickets'), (snap) => {
      const openTickets = snap.docs.filter(doc => doc.data().status === 'open').length;
      setStats(prev => ({ ...prev, openTickets }));
    }, (err) => {
      console.warn("AdminDashboard: Error loading tickets", err);
    });

    const unsubDeposits = onSnapshot(query(collection(db, 'transactions'), where('type', '==', 'deposit'), where('status', '==', 'pending')), (snap) => {
      setStats(prev => ({ ...prev, pendingDeposits: snap.size }));
    }, (err) => {
      console.warn("AdminDashboard: Error loading deposits", err);
    });

    return () => {
      unsubUsers();
      unsubOrders();
      unsubTickets();
      unsubDeposits();
    };
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Today Orders', value: stats.todayOrders, icon: ShoppingCart, color: 'bg-indigo-500' },
    { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: ArrowUpRight, color: 'bg-green-500' },
    { label: 'User Balances', value: `$${stats.totalUserBalance.toFixed(2)}`, icon: Wallet, color: 'bg-orange-500' },
  ];

  const secondaryStats = [
    { label: 'Pending Orders', value: stats.pendingOrders, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Pending Deposits', value: stats.pendingDeposits, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Tickets', value: stats.openTickets, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Orders', value: stats.totalOrders, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Admin Overview</h1>
          <p className="text-gray-500 font-medium">System performance and statistics</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <TrendingUp size={18} className="text-indigo-600" />
          <span className="text-indigo-700 font-bold text-sm">System Healthy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={20} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {secondaryStats.map((stat, index) => (
           <motion.div
             key={stat.label}
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.4 + index * 0.05 }}
             className={`${stat.bg} p-6 rounded-[32px] border border-white/50 shadow-sm flex flex-col items-center justify-center text-center`}
           >
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">API Provider Balances</h3>
            <button 
              onClick={fetchApiBalances}
              disabled={fetchingBalances}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={20} className={`text-indigo-600 ${fetchingBalances ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-4">
            {apiBalances.length === 0 && !fetchingBalances ? (
              <div className="text-center py-8">
                <Server size={40} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No API providers connected</p>
              </div>
            ) : (
              apiBalances.map((prov, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      <Server size={16} />
                    </div>
                    <span className="font-bold text-gray-700">{prov.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600">{prov.balance} <span className="text-[10px] text-gray-400">{prov.currency}</span></p>
                  </div>
                </div>
              ))
            )}
            {fetchingBalances && apiBalances.length === 0 && (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">AI Order Analysis</h3>
            <button 
              onClick={analyzeFailedOrders}
              disabled={analyzing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {analyzing ? <RefreshCw size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              <span>Generate Report</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {aiAnalysis ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 italic text-sm text-indigo-900 leading-relaxed"
              >
                 <div className="flex items-center gap-2 mb-2 text-indigo-600 font-black uppercase text-[10px] tracking-widest">
                    <Zap size={14} />
                    Gemini Manager Insights
                 </div>
                 {aiAnalysis}
              </motion.div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Click to analyze failed orders</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">System Health</h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
               <span className="font-bold text-green-700">Database (Firestore)</span>
               <span className="text-green-600 font-black uppercase text-[10px] tracking-widest">Operational</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
               <span className="font-bold text-green-700">Proxy Server (Node.js)</span>
               <span className="text-green-600 font-black uppercase text-[10px] tracking-widest">Operational</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
               <span className="font-bold text-green-700">Auth Service</span>
               <span className="text-green-600 font-black uppercase text-[10px] tracking-widest">Operational</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
