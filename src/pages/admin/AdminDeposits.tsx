import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, runTransaction, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Check, X, Search, Clock, User as UserIcon } from 'lucide-react';

interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: any;
  userEmail?: string;
}

export default function AdminDeposits() {
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('type', '==', 'deposit'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest));
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: DepositRequest) => {
    if (!confirm(`Are you sure you want to approve $${request.amount} for user ID ${request.userId}?`)) return;
    setProcessing(request.id);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', request.userId);
        const transRef = doc(db, 'transactions', request.id);
        
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User does not exist!");

        transaction.update(userRef, {
          balance: increment(request.amount)
        });
        
        transaction.update(transRef, {
          status: 'completed',
          updatedAt: new Date()
        });
      });
      alert('Deposit approved successfully!');
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert('Failed to approve: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: DepositRequest) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    setProcessing(request.id);
    try {
      await updateDoc(doc(db, 'transactions', request.id), {
        status: 'rejected',
        adminNote: reason,
        updatedAt: new Date()
      });
      alert('Deposit rejected.');
      fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const pending = requests.filter(r => r.status === 'pending');
  const history = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Deposit Requests</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Manage and approve user deposits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-orange-500" size={20} />
            Pending Approval ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map(req => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">${req.amount.toFixed(2)}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest uppercase">{req.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{req.transactionId}</p>
                    <p className="text-[10px] text-gray-400">{req.createdAt?.toDate?.().toLocaleString() || 'Just now'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <UserIcon size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600 truncate">UID: {req.userId}</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    disabled={!!processing}
                    onClick={() => handleApprove(req)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                  >
                    {processing === req.id ? <Clock size={14} className="animate-spin" /> : <Check size={14} />}
                    Approve
                  </button>
                  <button
                    disabled={!!processing}
                    onClick={() => handleReject(req)}
                    className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
            {pending.length === 0 && (
              <div className="py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100 text-center">
                <p className="text-gray-400 font-bold uppercase text-[10px]">No pending requests</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent History */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-gray-400" size={20} />
            Recent History
          </h2>
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User / Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{req.userId}</p>
                        <p className="text-[10px] text-gray-400">{req.createdAt?.toDate?.().toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-900">${req.amount.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{req.method}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg
                          ${req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        `}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
