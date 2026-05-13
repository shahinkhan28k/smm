import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ListOrdered, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Order {
  id: string;
  serviceId: string;
  serviceName?: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  providerOrderId?: string;
  apiStatusResponse?: any;
  createdAt: Timestamp;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Orders snapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'inprogress': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'canceled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle2 size={14} />;
      case 'canceled': return <XCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return <Loader2 size={14} className="animate-spin" />;
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Orders History</h1>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Link</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty / Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-mono text-gray-400">#{order.id.slice(0, 8)}</p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1">{order.createdAt?.toDate().toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-gray-700 leading-tight max-w-[200px] truncate">
                      {order.serviceName || 'Unknown Service'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">ID: {order.serviceId.slice(0,6)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[250px]">
                      <p className="text-xs font-medium text-blue-600 truncate underline cursor-pointer" title={order.link}>{order.link}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-gray-700">{order.quantity}</p>
                    <p className="text-[10px] font-bold text-indigo-600 mt-1">${order.charge.toFixed(3)}</p>
                  </td>
                  <td className="px-6 py-4">
                    {order.providerOrderId ? (
                      <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
                        {order.providerOrderId}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-300">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </div>
                    {order.apiStatusResponse?.status && (
                      <p className="text-[9px] text-gray-400 mt-1 font-medium italic">
                        API: {order.apiStatusResponse.status}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest">Details</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <ListOrdered size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">No orders yet</h3>
            <p className="text-gray-400 font-medium text-sm">Start boosting your social media now!</p>
          </div>
        )}
      </div>
    </div>
  );
}
