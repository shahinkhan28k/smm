import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ListOrdered, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Order {
  id: string;
  serviceId: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
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

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${getStatusStyle(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800 break-all">{order.link}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Qty: <b>{order.quantity}</b></span>
                <span>Charge: <b>${order.charge.toFixed(3)}</b></span>
                <span>{order.createdAt?.toDate().toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:self-center">
              <button className="text-blue-600 font-medium text-sm hover:underline">Details</button>
            </div>
          </motion.div>
        ))}

        {orders.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <ListOrdered size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="text-gray-500">Start boosting your social media now!</p>
          </div>
        )}
      </div>
    </div>
  );
}
