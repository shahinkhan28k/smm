import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Image as ImageIcon, User, Search, Hash, Clock, X, Paperclip } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  chatId: string;
  text: string;
  imageUrl?: string;
  isAdmin: boolean;
  createdAt: any;
}

interface ChatSession {
  chatId: string;
  lastMessage: string;
  lastMessageTime: any;
  userName: string;
}

export default function AdminMessages() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // This is a simplified "sessions" fetch. In a real app, you'd have a 'chats' collection.
    // For now, we'll derive it from the messages.
    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uniqueSessions: Record<string, ChatSession> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!uniqueSessions[data.chatId]) {
          uniqueSessions[data.chatId] = {
            chatId: data.chatId,
            lastMessage: data.text || 'Image attached',
            lastMessageTime: data.createdAt,
            userName: data.senderName || 'Anonymous'
          };
        }
      });
      setSessions(Object.values(uniqueSessions));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', selectedChat),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
    });

    return () => unsubscribe();
  }, [selectedChat]);

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
    if (!selectedChat || (!newMessage.trim() && !image)) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'messages'), {
        chatId: selectedChat,
        senderId: 'admin',
        senderName: 'Admin Support',
        recipientId: selectedChat,
        text: newMessage.trim(),
        imageUrl: image,
        isAdmin: true,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
      setImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Live Chat Center</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Manage real-time customer support</p>
      </div>

      <div className="flex-1 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-full md:w-[350px] border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search conversations..."
                className="w-full bg-gray-50 border-transparent rounded-[20px] pl-12 pr-4 py-3 text-sm focus:bg-white focus:border-blue-600 outline-none transition-all font-medium"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.map(session => (
              <button
                key={session.chatId}
                onClick={() => setSelectedChat(session.chatId)}
                className={cn(
                  "w-full p-6 text-left border-b border-gray-50 flex items-start gap-4 transition-all hover:bg-gray-50",
                  selectedChat === session.chatId ? "bg-blue-50/50 border-r-4 border-r-blue-600" : ""
                )}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 shrink-0 uppercase font-black text-xs">
                  {session.userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-black text-gray-900 text-sm truncate uppercase tracking-tight">{session.userName}</h4>
                    <span className="text-[10px] font-bold text-gray-400">
                      {session.lastMessageTime?.toDate?.().toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate font-medium">{session.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-gray-50/30 transition-all",
          !selectedChat && "items-center justify-center text-center opacity-50"
        )}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                      <User size={20} />
                   </div>
                   <div>
                      <h3 className="font-black uppercase tracking-tight text-sm">
                        {sessions.find(s => s.chatId === selectedChat)?.userName}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Session</p>
                   </div>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
                   <Hash size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map((msg, idx) => {
                  const isLastAdmin = msg.isAdmin && messages[idx + 1]?.isAdmin === false;
                  return (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[70%]",
                        msg.isAdmin ? "self-end items-end" : "self-start"
                      )}
                    >
                      <div className={cn(
                        "p-5 rounded-[32px] text-sm font-medium shadow-sm transition-all hover:shadow-md",
                        msg.isAdmin 
                          ? "bg-gray-900 text-white rounded-tr-none" 
                          : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
                      )}>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="attachment" className="rounded-2xl mb-3 max-w-full h-auto" />
                        )}
                        {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 px-1">
                        {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sending...'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-gray-100">
                {image && (
                   <div className="mb-4 relative inline-block">
                     <img src={image} className="h-24 w-24 object-cover rounded-[24px] border-4 border-gray-50 shadow-lg" />
                     <button 
                       onClick={() => setImage(null)}
                       className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-xl hover:scale-110 transition-transform"
                     >
                       <X size={14} />
                     </button>
                   </div>
                )}
                <form onSubmit={handleSend} className="flex items-center gap-4 bg-gray-50 p-2 rounded-[28px]">
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
                    className="w-12 h-12 bg-white text-gray-400 rounded-[20px] flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input 
                    type="text"
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-transparent border-none px-4 py-3 text-sm focus:ring-0 outline-none font-medium placeholder:text-gray-400"
                  />
                  <button 
                    disabled={submitting || (!newMessage.trim() && !image)}
                    className="h-12 px-6 bg-gray-900 text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send size={16} />
                    Send Response
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="space-y-6">
               <div className="w-24 h-24 bg-gray-100 rounded-[40px] flex items-center justify-center mx-auto">
                  <MessageSquare size={40} className="text-gray-300" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">No Conversation Selected</h3>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Select a user from the sidebar to start chatting</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
