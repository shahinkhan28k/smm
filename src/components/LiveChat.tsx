import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Image as ImageIcon, User, Bot, Paperclip } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  imageUrl?: string;
  isAdmin: boolean;
  createdAt: any;
}

export default function LiveChat() {
  const { user, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !isOpen) return;

    // Listen for messages between this user and admins
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!message.trim() && !image)) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'messages'), {
        chatId: user.uid,
        senderId: user.uid,
        senderName: userData?.displayName || 'User',
        recipientId: 'admin',
        text: message.trim(),
        imageUrl: image,
        isAdmin: false,
        createdAt: serverTimestamp()
      });
      setMessage('');
      setImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-[40px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-sm">Live Support</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Always Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50"
            >
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-3">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <MessageCircle className="text-gray-400" size={24} />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Start a conversation</p>
                </div>
              )}
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.isAdmin ? "self-start" : "self-end items-end"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-[24px] text-sm font-medium shadow-sm",
                    msg.isAdmin 
                      ? "bg-white text-gray-900 rounded-tl-none border border-gray-100" 
                      : "bg-blue-600 text-white rounded-tr-none"
                  )}>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="attachment" className="rounded-xl mb-2 max-w-full h-auto shadow-inner" />
                    )}
                    {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1.5 px-1">
                    {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sending...'}
                  </span>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              {image && (
                <div className="mb-3 relative inline-block">
                  <img src={image} className="h-16 w-16 object-cover rounded-xl border-2 border-blue-100" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-gray-50 border-transparent focus:bg-white focus:border-blue-600 rounded-2xl px-4 py-2 text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                />
                <button 
                  disabled={submitting || (!message.trim() && !image)}
                  className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 disabled:opacity-50 shadow-lg shadow-blue-100"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gray-900 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
}
