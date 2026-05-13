import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Smartphone, CreditCard, ChevronRight, CheckCircle2, Clock, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AddFunds() {
  const { userData } = useAuth();
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [amount, setAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState('');
  const [pageSettings, setPageSettings] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer

  useEffect(() => {
    const unsubPages = onSnapshot(doc(db, 'settings', 'pages'), (doc) => {
        if (doc.exists()) setPageSettings(doc.data());
    });
    const unsubSite = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
        if (doc.exists()) setSiteSettings(doc.data());
    });
    return () => {
      unsubPages();
      unsubSite();
    };
  }, []);

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
      await addDoc(collection(db, 'transactions'), {
        userId: userData.uid,
        userEmail: userData.email,
        amount: amount,
        method: method.toUpperCase(),
        transactionId: transactionId,
        type: 'deposit',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setAmount(0);
      setTransactionId('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit request');
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

  if (success) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase">Request Sent!</h2>
          <p className="text-gray-500 font-bold mt-2">Admin will review your deposit shortly.</p>
        </div>
        <button 
          onClick={() => setSuccess(false)}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
        >
          Send Another Request
        </button>
      </div>
    );
  }

  const currentNumbers = siteSettings?.paymentNumbers?.[method] || '';
  const numbersArray = currentNumbers.split(',').map((n: string) => n.trim()).filter((n: string) => n);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Automated Add Funds</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Select method and send request</p>
      </div>

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
              <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Numbers to Pay</p>
                 <div className="flex flex-wrap gap-2 justify-center">
                    {numbersArray.length > 0 ? numbersArray.map((num: string, idx: number) => (
                      <span key={idx} className="text-sm font-black text-gray-900 bg-white px-3 py-1 rounded-xl border border-gray-200">{num}</span>
                    )) : <span className="text-xs font-bold text-gray-400 italic">No numbers added yet</span>}
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
        </div>
      </div>
    </div>
  );
}
