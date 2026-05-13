import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, CheckCircle2, Clock, XCircle, Loader2, Search, Filter, Eye, RefreshCw, ArrowUpRight } from 'lucide-react';

interface Order {
  id: string;
  userId: string;
  serviceId: string;
  serviceName?: string;
  userEmail?: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  createdAt: any;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [processingSync, setProcessingSync] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const syncOrderStatus = async (order: any) => {
    if (!order.providerOrderId || !order.providerId) return;
    setProcessingSync(order.id);
    try {
      const pDoc = await getDoc(doc(db, 'providers', order.providerId));
      if (!pDoc.exists()) throw new Error('Provider not found');
      const pData = pDoc.data();

      const response = await fetch('/api/provider/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: pData.apiUrl,
          apiKey: pData.apiKey,
          action: 'status',
          order: order.providerOrderId
        })
      });

      const data = await response.json();
      if (data.status) {
        await updateDoc(doc(db, 'orders', order.id), {
          status: data.status.replace(' ', '_').toLowerCase(),
          apiStatusResponse: data
        });
      }
    } catch (err: any) {
      console.error("Sync Error:", err);
    } finally {
      setProcessingSync(null);
    }
  };

  const syncAllActiveOrders = async () => {
    const activeOrders = orders.filter(o => 
      ['pending', 'processing', 'in_progress', 'pending_provider'].includes(o.status) && 
      (o as any).providerOrderId
    );
    if (activeOrders.length === 0) return alert('No active provider orders to sync.');
    
    setSyncingAll(true);
    let count = 0;
    for (const order of activeOrders) {
      await syncOrderStatus(order);
      count++;
    }
    setSyncingAll(false);
    alert(`Successfully synced ${count} orders.`);
  };

  const pushToProvider = async (order: any) => {
    if (!order.providerId || !order.serviceId) return alert('No provider assigned to this service.');
    setProcessingSync(order.id);
    try {
      const pDoc = await getDoc(doc(db, 'providers', order.providerId));
      if (!pDoc.exists()) throw new Error('Provider config missing.');
      const pData = pDoc.data();
      
      const sDoc = await getDoc(doc(db, 'services', order.serviceId));
      const sData = sDoc.data();
      const pServiceId = sData?.providerServiceId;
      
      if (!pServiceId) throw new Error('Provider Service ID not mapped.');

      const res = await fetch('/api/provider/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: pData.apiUrl,
          apiKey: pData.apiKey,
          action: 'add',
          service: pServiceId,
          link: order.link,
          quantity: order.quantity
        })
      });

      const data = await res.json();
      if (data.order) {
        await updateDoc(doc(db, 'orders', order.id), {
          providerOrderId: data.order,
          status: 'processing',
          apiResponse: data
        });
        alert('Order successfully pushed to provider! Provider ID: ' + data.order);
      } else {
        throw new Error(data.error || 'Provider rejected request');
      }
    } catch (err: any) {
      alert('Push Failed: ' + err.message);
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'error',
        adminNote: 'Manual API Push Error: ' + err.message
      });
    } finally {
      setProcessingSync(null);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.link.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'canceled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Order Management</h1>
          <p className="text-gray-500 font-medium">Monitor and update system orders</p>
        </div>
        <button
          onClick={syncAllActiveOrders}
          disabled={syncingAll}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          <RefreshCw size={20} className={syncingAll ? 'animate-spin' : ''} />
          <span>Sync All Active</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Order ID or Link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          {['all', 'pending', 'processing', 'completed', 'canceled', 'error'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-gray-400 hover:text-indigo-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Info / User</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Link</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {filteredOrders.map(order => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                        <span className="text-xs font-bold text-gray-900">{order.userEmail || 'UID: ' + order.userId.slice(0, 6)}</span>
                        <span className="text-[10px] text-gray-400">{order.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-gray-800 truncate max-w-xs">{order.link}</p>
                        {order.serviceName && <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{order.serviceName}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600 font-bold">Qty: {order.quantity}</span>
                        <span className="text-xs text-indigo-600 font-black">${order.charge.toFixed(3)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="canceled">Canceled</option>
                          <option value="error">Error</option>
                        </select>
                        {(order as any).providerOrderId ? (
                          <button 
                            onClick={() => syncOrderStatus(order)}
                            disabled={processingSync === order.id}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Sync Status from API"
                          >
                            <RefreshCw size={14} className={processingSync === order.id ? 'animate-spin' : ''} />
                          </button>
                        ) : (
                          (order as any).providerId && (
                            <button 
                              onClick={() => pushToProvider(order)}
                              disabled={processingSync === order.id}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                              title="Push manually to Provider"
                            >
                              <ArrowUpRight size={14} className={processingSync === order.id ? 'animate-spin' : ''} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <ShoppingCart size={32} />
            </div>
            <p className="text-gray-500 font-bold">No orders found matching criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
