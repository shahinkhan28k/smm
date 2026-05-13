import { useState, useEffect } from 'react';
import { collection, query, where, doc, updateDoc, increment, runTransaction, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Check, X, Search, Clock, User as UserIcon, Bell } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [processProgress, setProcessProgress] = useState(0);

  const processWithDelay = async (actionFn: () => Promise<void>) => {
    setProcessProgress(0);
    // Start progress timer
    const progressInterval = setInterval(() => {
      setProcessProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 1;
      });
    }, 45);

    try {
      const startTime = Date.now();
      await actionFn();
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      const minDelay = 4500;

      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
      setProcessProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setProcessing(null);
        setProcessProgress(0);
      }, 500);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('type', '==', 'deposit'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest));
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error in AdminDeposits:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (request: DepositRequest) => {
    if (!confirm(`Are you sure you want to approve $${request.amount} for user ID ${request.userId}?`)) return;
    setProcessing(request.id);
    await processWithDelay(async () => {
      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', request.userId);
          const transRef = doc(db, 'transactions', request.id);
          
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw new Error("Target user profile not found in database!");

          transaction.update(userRef, {
            balance: increment(request.amount)
          });
          
          transaction.update(transRef, {
            status: 'completed',
            updatedAt: new Date(),
            processedBy: auth.currentUser?.email || 'admin'
          });
        });
      } catch (err: any) {
        console.error("Approval Error:", err);
        if (err.message?.includes('permissions') || err.message?.includes('Permission denied')) {
           alert("সম্মানি এডমিন, আপনার একাউন্টে এডমিন পারমিশন নেই। দয়া করে আপনার প্রোফাইল চেক করুন অথবা ডেভেলপার এর সাথে যোগাযোগ করুন।");
        } else {
           alert('Error: ' + err.message);
        }
        throw err;
      }
    });
    alert('Deposit approved successfully!');
  };

  const handleReject = async (request: DepositRequest) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    setProcessing(request.id);
    await processWithDelay(async () => {
      try {
        await updateDoc(doc(db, 'transactions', request.id), {
          status: 'rejected',
          adminNote: reason,
          updatedAt: new Date()
        });
      } catch (err: any) {
        console.error(err);
        throw err;
      }
    });
    alert('Deposit rejected.');
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const filteredRequests = requests.filter(r => 
    r.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pending = filteredRequests.filter(r => r.status === 'pending');
  const history = filteredRequests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Deposit Requests</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Manage and approve user deposits</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search TrxID, Email, or UID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 font-bold text-sm outline-none focus:border-indigo-500 shadow-sm transition-all"
          />
        </div>
      </div>

      <AnimatePresence>
        {processing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-10 text-center shadow-2xl"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <svg className="w-full h-full rotate-[-90deg]">
                  <circle
                    cx="48"
                    cy="48"
                    r="45"
                    fill="none"
                    stroke="#F3F4F6"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="45"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="6"
                    strokeDasharray="283"
                    animate={{ strokeDashoffset: 283 - (283 * processProgress) / 100 }}
                    transition={{ duration: 0.2 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                   <Bell size={32} className="animate-bounce" />
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Processing Deposit</h3>
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-6">Updating Ledger securely...</p>
              
              <div className="bg-gray-100 h-1 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-amber-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${processProgress}%` }}
                />
              </div>
              <p className="mt-4 text-[10px] font-black text-amber-600 uppercase tracking-widest">{processProgress}% Syncing</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{req.method}</p>
                      {req.userEmail && <p className="text-[10px] font-bold text-indigo-500 lowercase">{req.userEmail}</p>}
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
                        <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{req.userEmail || req.userId}</p>
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
