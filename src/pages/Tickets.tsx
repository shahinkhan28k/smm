import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, Send, Clock, CheckCircle2 } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: any;
}

export default function Tickets() {
  const { user } = useAuth();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [subject, setSubject] = useState('Order Issue');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
      setLoading(false);
    }, (error) => {
      console.error("Tickets snapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'tickets');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    setSubmitting(true);
    try {
      const ticketData = {
        userId: user.uid,
        subject,
        message,
        status: 'open',
        createdAt: serverTimestamp()
      };

      const ticketPath = 'tickets';
      try {
        await addDoc(collection(db, ticketPath), ticketData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, ticketPath);
      }

      setMessage('');
      setShowNewTicket(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    const settingsPath = 'settings/site';
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
        if (doc.exists()) setSiteSettings(doc.data());
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, settingsPath);
    });
    return () => unsub();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'answered': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const supportNumbers = siteSettings?.supportLinks || { whatsapp: '', telegram: '' };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <a 
           href={`https://wa.me/${supportNumbers.whatsapp}`} 
           target="_blank" 
           rel="noreferrer"
           className="bg-[#25D366] p-6 rounded-[32px] text-white flex items-center justify-between hover:scale-[1.02] transition-transform active:scale-95 group shadow-xl shadow-green-100"
         >
            <div className="space-y-1">
               <h3 className="text-xl font-black uppercase tracking-tight">WhatsApp Support</h3>
               <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Chat with us instantly</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
               <MessageSquare size={24} />
            </div>
         </a>
         <a 
           href={`https://t.me/${supportNumbers.telegram}`} 
           target="_blank" 
           rel="noreferrer"
           className="bg-[#0088cc] p-6 rounded-[32px] text-white flex items-center justify-between hover:scale-[1.02] transition-transform active:scale-95 group shadow-xl shadow-blue-100"
         >
            <div className="space-y-1">
               <h3 className="text-xl font-black uppercase tracking-tight">Telegram Support</h3>
               <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Join our channel/chat</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
               <Send size={24} />
            </div>
         </a>
      </div>

      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-black text-gray-900 uppercase">Support Tickets</h1>
        <button 
          onClick={() => setShowNewTicket(!showNewTicket)}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95"
        >
          {showNewTicket ? <span>Cancel</span> : <><Plus size={18} /><span>Open Ticket</span></>}
        </button>
      </div>

      <AnimatePresence>
        {showNewTicket && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xl shadow-blue-50/50"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Open Support Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Order Issue</option>
                  <option>Payment Issue</option>
                  <option>Child Panel Issue</option>
                  <option>API Issue</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea 
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your issue in detail..."
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send size={18} />
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-400">#{ticket.id.slice(0, 8)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">{ticket.message}</p>
              <p className="text-[10px] text-gray-400">{ticket.createdAt?.toDate().toLocaleString()}</p>
            </div>
            <div className="shrink-0">
              <button className="text-blue-600 text-sm font-bold hover:underline">View</button>
            </div>
          </motion.div>
        ))}

        {tickets.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No active support tickets. We're here to help!</p>
          </div>
        )}
      </div>
    </div>
  );
}
