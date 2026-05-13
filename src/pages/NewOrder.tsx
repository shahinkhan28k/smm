import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, getDoc, doc, runTransaction, updateDoc, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Info, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  pricePer1k: number;
  minQuantity: number;
  maxQuantity: number;
  description: string;
  providerId?: string;
  serviceType?: string;
  refill?: boolean;
  cancelPossible?: boolean;
  speed?: string;
  avgTime?: string;
  orderFieldsType?: 'url' | 'username' | 'post_link' | 'custom';
}

interface PageSettings {
  newOrderTitle?: string;
  newOrderSubtitle?: string;
  newOrderInstructions?: string;
}

export default function NewOrder() {
  const { user, userData } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null);

  useEffect(() => {
    const unsubPages = onSnapshot(doc(db, 'settings', 'pages'), (snap) => {
      if (snap.exists()) setPageSettings(snap.data());
    }, (err) => {
      console.warn("NewOrder: Error loading pages", err);
    });

    const unsubCats = onSnapshot(query(collection(db, 'categories'), orderBy('name')), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].id);
      }
    }, (err) => {
      console.warn("NewOrder: Error loading categories", err);
    });

    const unsubServs = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      setLoading(false);
    }, (err) => {
      console.error("NewOrder: Error loading services", err);
      setLoading(false);
    });

    let unsubRecent = () => {};
    if (user?.uid) {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      unsubRecent = onSnapshot(q, (snap) => {
        setRecentOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubPages();
      unsubCats();
      unsubServs();
      unsubRecent();
    };
  }, []);

  useEffect(() => {
    const filtered = services.filter(s => s.categoryId === selectedCategory);
    setFilteredServices(filtered);
    if (filtered.length > 0) {
      setSelectedService(filtered[0].id);
    } else {
      setSelectedService('');
    }
  }, [selectedCategory, services]);

  const currentService = services.find(s => s.id === selectedService);
  const totalCost = currentService ? (quantity / 1000) * currentService.pricePer1k : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !currentService) {
      console.warn("NewOrder: Cannot submit, missing data", { user: !!user, userData: !!userData, service: !!currentService });
      return;
    }

    const calculatedCost = (quantity / 1000) * currentService.pricePer1k;
    if (userData.balance < calculatedCost - 0.0001) { // precision buffer
      setMessage({ type: 'error', text: 'Insufficient balance. Please add funds.' });
      return;
    }

    if (quantity < currentService.minQuantity || quantity > currentService.maxQuantity) {
      setMessage({ type: 'error', text: `Quantity must be between ${currentService.minQuantity} and ${currentService.maxQuantity}` });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      console.log("NewOrder: Starting transaction for order...");
      const orderId = await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) throw new Error("Profile not found. Please refresh the page.");
        const currentBalance = userDoc.data().balance || 0;
        
        // Final balance check inside transaction
        if (currentBalance < calculatedCost - 0.0001) {
            throw new Error("Insufficient funds for this order.");
        }

        const newOrderData = {
          userId: user.uid,
          userEmail: user.email,
          serviceId: selectedService,
          serviceName: currentService.name,
          link,
          quantity,
          charge: Number(calculatedCost.toFixed(4)),
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, newOrderData);

        transaction.update(userRef, {
            balance: Number((currentBalance - calculatedCost).toFixed(4))
        });
        
        return orderRef.id;
      });
      
      console.log("NewOrder: Firestore transaction completed");

      // Now forward to provider if applicable
      if (currentService.providerId && (currentService as any).providerServiceId) {
        try {
          const pDoc = await getDoc(doc(db, 'providers', currentService.providerId));
          if (pDoc.exists()) {
            const pData = pDoc.data();
            const proxyRes = await fetch('/api/provider/proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apiUrl: pData.apiUrl,
                apiKey: pData.apiKey,
                action: 'add',
                service: (currentService as any).providerServiceId,
                link: link,
                quantity: quantity
              })
            });
            
            const proxyData = await proxyRes.json();
            if (proxyData.order) {
              // Successfully forwarded to provider
              await updateDoc(doc(db, 'orders', orderId), {
                providerOrderId: proxyData.order,
                status: 'pending_provider', // or keep as pending
                apiResponse: proxyData
              });
            } else if (proxyData.error) {
              console.error("Provider rejected order:", proxyData.error);
              await updateDoc(doc(db, 'orders', orderId), {
                status: 'error',
                adminNote: 'Provider error: ' + (proxyData.error || 'Unknown error')
              });
            }
          }
        } catch (apiErr) {
          console.error("Failed to forward order to provider:", apiErr);
          // Still success for user as balance was deducted and order recorded
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: `অর্ডারটি সাবমিট হয়েছে! অর্ডার আইডি: ${orderId.slice(0,8)}. কিছুক্ষণ অপেক্ষা করুন, এটি প্রসেসিং হচ্ছে।`
      });
      setLink('');
      setQuantity(0);
    } catch (err: any) {
      console.error("NewOrder Submission Error:", err);
      let errorMsg = "Failed to place order. Please check your connection.";
      if (err.message?.includes('Insufficient funds')) errorMsg = err.message;
      if (err.message?.includes('permission')) errorMsg = "Permission denied. We are looking into it.";
      
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            {pageSettings?.newOrderTitle || 'Make a New Order'}
        </h1>
        <p className="text-gray-500 font-medium">{pageSettings?.newOrderSubtitle || 'Select a service and boost your growth.'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Select Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-blue-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Select Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-blue-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all"
                >
                  {filteredServices.map(ser => (
                    <option key={ser.id} value={ser.id}>{ser.name} - ${ser.pricePer1k}/1k</option>
                  ))}
                  {filteredServices.length === 0 && <option disabled>No services in this category</option>}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    {currentService?.orderFieldsType === 'username' ? 'Profile Username' : 
                     currentService?.orderFieldsType === 'post_link' ? 'Post Link' : 
                     currentService?.orderFieldsType === 'custom' ? 'Account/Target' : 
                     'Target Link (URL)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentService?.orderFieldsType === 'username' ? '@username' : 'https://...'}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-blue-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-transparent focus:border-blue-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all"
                  />
                  {currentService && (
                    <div className="mt-2 flex items-center gap-3">
                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">Min: {currentService.minQuantity}</span>
                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">Max: {currentService.maxQuantity}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cost Summary</label>
                  <div className="w-full bg-blue-600 text-white rounded-2xl px-5 py-4 font-black flex items-center justify-between shadow-lg shadow-blue-100">
                    <span className="opacity-80 uppercase tracking-widest text-[10px]">Total Charge</span>
                    <span className="text-xl">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <AnimatePresence>
              {message && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                    "p-4 rounded-2xl text-sm font-bold flex items-center gap-3",
                    message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                    )}
                >
                  {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  {message.text}
                </motion.div>
              )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting || !selectedService}
                className="w-full bg-gray-900 text-white rounded-2xl py-5 font-black uppercase tracking-widest text-sm shadow-xl shadow-gray-100 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {submitting ? 'Authenticating Order...' : 'Submit Order Now'}
              </button>
            </form>
          </motion.div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              <h3 className="font-black text-gray-900 uppercase tracking-tight">Service Info</h3>
            </div>
            {currentService ? (
              <div className="space-y-6">
                <p className="text-sm text-gray-500 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 whitespace-pre-wrap">
                  {currentService.description || 'No description available for this service.'}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 border-b border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Time</span>
                    <span className="text-xs font-bold text-gray-900">{currentService.avgTime || '0-24 Hours'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border-b border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Speed</span>
                    <span className="text-xs font-bold text-gray-900">{currentService.speed || 'High'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border-b border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refill</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${currentService.refill ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {currentService.refill ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancelable</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${currentService.cancelPossible ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {currentService.cancelPossible ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
                <div className="text-center py-12">
                   <Zap size={32} className="text-gray-200 mx-auto mb-4" />
                   <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Choose a service</p>
                </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-100">
             <h4 className="font-black uppercase tracking-widest text-xs mb-4 opacity-80">Manual Instructions</h4>
             <div className="text-sm font-medium leading-relaxed opacity-90 space-y-4">
                {pageSettings?.newOrderInstructions ? (
                    <div dangerouslySetInnerHTML={{ __html: pageSettings.newOrderInstructions }} />
                ) : (
                    <p>Make sure your profile is set to PUBLIC before placing an order. Wrong links will not be refunded.</p>
                )}
             </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Your Recent Orders</h3>
          <NavLink to="/orders" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All</NavLink>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td className="py-4 text-[10px] font-mono text-gray-400">#{order.id.slice(0, 8)}</td>
                  <td className="py-4 text-xs font-bold text-gray-700 truncate max-w-[200px]">{order.serviceName}</td>
                  <td className="py-4 text-right">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg",
                      order.status === 'completed' ? 'bg-green-50 text-green-600' :
                      order.status === 'pending' ? 'bg-gray-50 text-gray-400' : 'bg-blue-50 text-blue-600'
                    )}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">No recent orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
