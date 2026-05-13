import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Bell, Clock, Info, CheckCircle2 } from 'lucide-react';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Timestamp;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error("Notifications fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
          {notifications.filter(n => !n.read).length} Unread
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notif, index) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-5 rounded-2xl border transition-all ${notif.read ? 'bg-white border-gray-100 grayscale-[0.5]' : 'bg-white border-blue-100 shadow-md ring-1 ring-blue-50'}`}
          >
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notif.type === 'success' ? 'bg-green-50 text-green-600' :
                notif.type === 'error' ? 'bg-red-50 text-red-600' :
                notif.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {notif.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-bold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                    <Clock size={10} />
                    {notif.createdAt?.toDate().toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {notifications.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">All clear!</h3>
            <p className="text-gray-500">You're all caught up with your notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
