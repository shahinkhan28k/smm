import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Smartphone, CreditCard, ChevronRight, CheckCircle2, Clock, Info, History, AlertCircle, X, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, onSnapshot, addDoc, collection, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AddFunds() {
  const { userData } = useAuth();
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [amount, setAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState('');
  const [pageSettings, setPageSettings] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
  const [transactions, setTransactions] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    const unsubPages = onSnapshot(doc(db, 'settings', 'pages'), (doc) => {
        if (doc.exists()) setPageSettings(doc.data());
    }, (err) => {
        console.warn("AddFunds: Error loading pages", err);
    });
    const unsubSite = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
        if (doc.exists()) setSiteSettings(doc.data());
        setLoadingSettings(false);
    }, (err) => {
        console.warn("AddFunds: Error loading site settings", err);
        setLoadingSettings(false);
    });
    
    let unsubTransactions = () => {};
    if (userData?.uid) {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userData.uid),
        where('type', '==', 'deposit'),
        orderBy('createdAt', 'desc')
      );
      unsubTransactions = onSnapshot(q, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("AddFunds: Error loading transactions", err);
      });
    }

    return () => {
      unsubPages();
      unsubSite();
      unsubTransactions();
    };
  }, [userData?.uid]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !transactionId) {
      alert('Please fill all fields');
      return;
    }
    if (!userData) return;

    setSubmitting(true);
    try {
      // Check for duplicate Transaction ID
      const qCheck = query(
        collection(db, 'transactions'),
        where('transactionId', '==', transactionId.trim().toUpperCase())
      );
      const checkSnap = await getDocs(qCheck);
      if (!checkSnap.empty) {
        alert('This Transaction ID has already been submitted or used.');
        setSubmitting(false);
        return;
      }

      console.log("AddFunds: Submitting transaction request...");
      const transData = {
        userId: userData.uid,
        userEmail: userData.email,
        amount: Number(amount),
        method: method.toUpperCase(),
        transactionId: transactionId.trim(),
        type: 'deposit',
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'transactions'), transData);
      console.log("AddFunds: Deposit request submitted successfully");
      setSuccess(true);
      // Detailed notification text
      alert('অর্ডারটি সাবমিট হয়েছে। কিছুক্ষণ অপেক্ষা করুন, এডমিন প্যানেল থেকে এটি রিভিউ করে আপনার ব্যালেন্স যোগ করা হবে।');
      setAmount(0);
      setTransactionId('');
    } catch (err: any) {
      console.error("AddFunds Error:", err);
      let errorMsg = 'Failed to submit request. Please try again.';
      if (err.message?.includes('permission')) {
          errorMsg = 'Permission denied. Please ensure you are logged in correctly.';
      }
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const methods = [
    { id: 'bkash', name: 'bKash', icon: Smartphone, color: 'bg-[#E2136E]' },
    { id: 'nagad', name: 'Nagad', icon: Smartphone, color: 'bg-[#F7941E]' },
    { id: 'rocket', name: 'Rocket', icon: Smartphone, color: 'bg-[#8B338A]' },
    { id: 'bank', name: 'Bank Transfer', icon: CreditCard, color: 'bg-gray-700' },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentNumbers = siteSettings?.paymentNumbers?.[method] || '';
  const numbersArray = currentNumbers.split(',').map((n: string) => n.trim()).filter((n: string) => n);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Automated Add Funds</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Select method and send request</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-100 p-6 rounded-[32px] flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-green-900 uppercase tracking-tight">Deposit Request Submitted!</h4>
                <p className="text-xs text-green-700 font-bold">Admin will review your request shortly. Check history below.</p>
              </div>
            </div>
            <button 
              onClick={() => setSuccess(false)}
              className="text-green-600 hover:bg-green-100 p-2 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Methods */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] px-1">Payment Method</h3>
          <div className="grid grid-cols-1 gap-3">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMethod(m.id as any);
                  setTimeLeft(300);
                }}
                className={cn(
                  "flex items-center justify-between p-5 rounded-[28px] border-2 transition-all active:scale-[0.95] text-left",
                  method === m.id ? "border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-100/50" : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", m.color)}>
                    <m.icon size={22} />
                  </div>
                  <div>
                    <span className="font-black text-gray-900 uppercase tracking-tight block">{m.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Safe & Secure</span>
                  </div>
                </div>
                {method === m.id && <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white"><ChevronRight size={14} /></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Form & Info */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-5">
                 <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl", methods.find(m => m.id === method)?.color)}>
                   <CreditCard size={32} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Deposit Details</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <Clock size={14} className="text-orange-500" />
                       <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Active session: {formatTime(timeLeft)}</span>
                    </div>
                 </div>
              </div>
              <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-100 min-w-[240px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Numbers to Pay ({method.toUpperCase()})</p>
                 <div className="space-y-2">
                    {loadingSettings ? (
                      <div className="space-y-2">
                        <div className="h-12 bg-white animate-pulse rounded-2xl border border-gray-100" />
                        <div className="h-12 bg-white animate-pulse rounded-2xl border border-gray-100" />
                      </div>
                    ) : numbersArray.length > 0 ? (
                      numbersArray.map((num: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
                          <span className="text-sm font-black text-gray-900 font-mono tracking-wider">{num}</span>
                          <button 
                            onClick={() => copyToClipboard(num)}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              copied === num ? "bg-green-100 text-green-600" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                            )}
                          >
                            {copied === num ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2">
                        <span className="text-xs font-bold text-gray-400 italic">No numbers added yet</span>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[32px] mb-10 flex gap-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-100">
                 <Info size={20} />
              </div>
              <p className="text-xs text-blue-900 font-bold leading-relaxed">
                {pageSettings?.addFundsInstructions || "Instructions: Send funds to our merchant number and provide the Transaction ID below. Minimum deposit: $1.00 (USD). 1 USD = 120 BDT."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (USD)</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">$</div>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full bg-gray-50 border border-transparent focus:border-blue-600 focus:bg-white rounded-[24px] pl-12 pr-6 py-5 font-black text-3xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction ID</label>
                <input
                  required
                  type="text"
                  placeholder="Paste TrxID here"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-blue-600 focus:bg-white rounded-[24px] px-6 py-5 font-black text-xl tracking-widest outline-none transition-all uppercase"
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <button 
                  disabled={submitting || timeLeft <= 0}
                  className="w-full bg-blue-600 text-white rounded-[24px] py-6 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Processing Request...' : timeLeft <= 0 ? 'Session Expired - Refresh' : 'Submit Deposit Request'}
                </button>
              </div>
            </form>
          </div>

          {/* Deposit History */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Deposits</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your payment history</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date / TrxID</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={tx.id} 
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">{tx.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</span>
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{tx.transactionId}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            tx.method === 'BKASH' ? 'bg-[#E2136E]' : 
                            tx.method === 'NAGAD' ? 'bg-[#F7941E]' : 
                            tx.method === 'ROCKET' ? 'bg-[#8B338A]' : 'bg-gray-400'
                          )} />
                          <span className="text-xs font-black text-gray-700 uppercase">{tx.method}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-gray-900">${tx.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {tx.status === 'pending' && <Clock size={12} className="text-orange-500" />}
                          {tx.status === 'completed' && <CheckCircle2 size={12} className="text-green-500" />}
                          {tx.status === 'rejected' && <AlertCircle size={12} className="text-red-500" />}
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                            tx.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                            tx.status === 'completed' ? 'bg-green-50 text-green-600' :
                            'bg-red-50 text-red-600'
                          )}>
                            {tx.status}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No transaction history found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
