import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, getDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Plus, Trash2, Edit2, CheckCircle2, XCircle, Search, RefreshCw, Globe } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  pricePer1k: number;
  minQuantity: number;
  maxQuantity: number;
  status: string;
  serviceType?: string;
  apiRate?: number;
  dripFeed?: boolean;
  refill?: boolean;
  speed?: string;
  avgTime?: string;
  description?: string;
  providerId?: string;
  providerServiceId?: string;
  cancelPossible?: boolean;
  startingMinimum?: number;
  autoCompleteDays?: number;
  orderFieldsType?: 'url' | 'username' | 'post_link' | 'custom';
}

export default function AdminServices() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newCatName, setNewCatName] = useState('');
  
  const initialServiceState = {
    categoryId: '',
    name: '',
    pricePer1k: 0,
    apiRate: 0,
    minQuantity: 100,
    maxQuantity: 10000,
    description: '',
    status: 'active',
    serviceType: 'Default',
    dripFeed: false,
    refill: false,
    speed: 'Fast',
    avgTime: '0-24 Hours',
    providerId: '',
    providerServiceId: '',
    cancelPossible: false,
    startingMinimum: 10,
    autoCompleteDays: 3,
    orderFieldsType: 'url' as any
  };

  const [newService, setNewService] = useState(initialServiceState);

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, 'categories'), orderBy('name')), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      if (cats.length > 0 && !newService.categoryId) {
        setNewService(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    }, (err) => {
      console.error("AdminServices: Error loading categories", err);
    });

    const unsubServs = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      setLoading(false);
    }, (err) => {
      console.error("AdminServices: Error loading services", err);
      setLoading(false);
    });

    const unsubProvs = onSnapshot(collection(db, 'providers'), (snap) => {
      const provs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
      setProviders(provs);
      if (provs.length > 0 && !selectedProvider) {
        setSelectedProvider(provs[0].id);
        setNewService(prev => ({ ...prev, providerId: provs[0].id }));
      }
    }, (err) => {
      console.error("AdminServices: Error loading providers", err);
    });

    return () => {
      unsubCats();
      unsubServs();
      unsubProvs();
    };
  }, []);

  const handleSync = async () => {
    if (!selectedProvider) return;
    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return;
    
    setSyncing(true);
    try {
      // Re-fetch provider to get API details
      const pDoc = await getDoc(doc(db, 'providers', selectedProvider));
      if (!pDoc.exists()) throw new Error('Provider not found');
      const pData = pDoc.data();

      const response = await fetch('/api/provider/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: pData.apiUrl,
          apiKey: pData.apiKey,
          action: 'services'
        })
      });
      if (!response.ok) throw new Error('API fetch failed');
      
      const externalServices = await response.json();
      if (!Array.isArray(externalServices)) throw new Error('Invalid response form provider');

      const markup = 1 + (pData.markupPercentage / 100);
      const batch = writeBatch(db);
      
      const catSnap = await getDocs(collection(db, 'categories'));
      const existingCats = new Map(catSnap.docs.map(doc => [doc.data().name.toLowerCase(), doc.id]));
      const newCats = new Map<string, string>();

      let operations = 0;
      for (const s of externalServices) {
        if (operations >= 450) break;

        const catName = s.category || 'Other Services';
        let catId = existingCats.get(catName.toLowerCase()) || newCats.get(catName.toLowerCase());

        if (!catId) {
          const catRef = doc(collection(db, 'categories'));
          batch.set(catRef, { name: catName });
          catId = catRef.id;
          newCats.set(catName.toLowerCase(), catId);
          operations++;
        }

        const serviceRef = doc(collection(db, 'services'));
        batch.set(serviceRef, {
          categoryId: catId,
          name: s.name,
          pricePer1k: (parseFloat(s.rate) * markup) || 0,
          apiRate: parseFloat(s.rate) || 0,
          minQuantity: parseInt(s.min) || 10,
          maxQuantity: parseInt(s.max) || 10000,
          status: 'active',
          providerId: selectedProvider,
          providerServiceId: s.service,
          serviceType: s.type || 'Default',
          dripFeed: s.dripfeed === "1" || s.dripfeed === true,
          refill: s.refill === "1" || s.refill === true,
          cancelPossible: s.cancel === "1" || s.cancel === true,
          description: s.description || ''
        });
        operations++;
      }

      await batch.commit();
      // fetchData(); // Auto updated by onSnapshot
      alert(`Successfully synced ${externalServices.length} services from provider with ${pData.markupPercentage}% markup!`);
    } catch (err) {
      console.error(err);
      alert('Sync failed. Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSyncing(false);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'categories'), { name: newCatName });
      setNewCatName('');
      setShowAddCat(false);
      // fetchData(); // Auto updated
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), newService);
      } else {
        await addDoc(collection(db, 'services'), newService);
      }
      setShowAddService(false);
      setEditingService(null);
      setNewService(initialServiceState);
      // fetchData(); // Auto updated
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setNewService({
      categoryId: service.categoryId || '',
      name: service.name || '',
      pricePer1k: service.pricePer1k || 0,
      apiRate: service.apiRate || 0,
      minQuantity: service.minQuantity || 100,
      maxQuantity: service.maxQuantity || 10000,
      description: service.description || '',
      status: service.status || 'active',
      serviceType: service.serviceType || 'Default',
      dripFeed: service.dripFeed || false,
      refill: service.refill || false,
      speed: service.speed || 'Fast',
      avgTime: service.avgTime || '0-24 Hours',
      providerId: service.providerId || '',
      providerServiceId: service.providerServiceId || '',
      cancelPossible: service.cancelPossible || false,
      startingMinimum: service.startingMinimum || 10,
      autoCompleteDays: service.autoCompleteDays || 3,
      orderFieldsType: service.orderFieldsType || 'url'
    });
    setShowAddService(true);
  };

  const deleteService = async (id: string) => {
    if(!confirm('Delete this service?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      // fetchData(); // Auto updated
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Service Management</h1>
          <p className="text-gray-500 font-medium">Create and manage your service catalog</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
            <Globe size={18} className="text-gray-400" />
            <select 
              value={selectedProvider} 
              onChange={e => setSelectedProvider(e.target.value)}
              className="bg-transparent font-bold text-sm outline-none"
            >
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              {providers.length === 0 && <option value="">No Providers</option>}
            </select>
            <button 
              onClick={handleSync}
              disabled={syncing || providers.length === 0}
              className="ml-2 text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            </button>
          </div>
          <button 
            onClick={() => setShowAddCat(true)}
            className="flex items-center gap-2 bg-white border border-gray-100 text-gray-700 px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm text-sm"
          >
            <Plus size={18} />
            <span>Add Category</span>
          </button>
          <button 
            onClick={() => setShowAddService(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 text-sm"
          >
            <Plus size={18} />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-medium">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Price/1k</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map(service => (
                <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-mono text-gray-300">#{service.id.slice(0, 4)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-800">{service.name}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-black uppercase">
                      {categories.find(c => c.id === service.categoryId)?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-indigo-600 font-black">${service.pricePer1k.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${service.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                       {service.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditService(service)}
                        className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteService(service.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {showAddCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddCat(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">New Category</h2>
              <form onSubmit={addCategory} className="space-y-4">
                <input required type="text" placeholder="Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all" />
                <button type="submit" className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-bold">Create Category</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Service Modal */}
      <AnimatePresence>
        {showAddService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddService(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative w-full max-w-2xl bg-white rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <form onSubmit={handleSaveService} className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Category</label>
                      <select value={newService.categoryId} onChange={e => setNewService({...newService, categoryId: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold border border-transparent focus:border-indigo-500 outline-none transition-all">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Service Name</label>
                      <input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} placeholder="e.g. Instagram Followers" className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Service Type</label>
                      <select value={newService.serviceType} onChange={e => setNewService({...newService, serviceType: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold border border-transparent focus:border-indigo-500 outline-none transition-all">
                        <option value="Default">Default</option>
                        <option value="Package">Package</option>
                        <option value="Custom Comment">Custom Comment</option>
                        <option value="Mentions">Mentions</option>
                        <option value="Subscriptions">Subscriptions</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 font-mono tracking-tighter">Your Price / 1k</label>
                        <input required type="number" step="0.001" value={newService.pricePer1k} onChange={e => setNewService({...newService, pricePer1k: parseFloat(e.target.value)})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 font-mono tracking-tighter">API Rate (Cost)</label>
                        <input type="number" step="0.001" value={newService.apiRate} onChange={e => setNewService({...newService, apiRate: parseFloat(e.target.value)})} className="w-full bg-indigo-50 text-indigo-900 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Limits & Provider */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 font-mono tracking-tighter">Min Qty</label>
                        <input required type="number" value={newService.minQuantity} onChange={e => setNewService({...newService, minQuantity: parseInt(e.target.value)})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 font-mono tracking-tighter">Max Qty</label>
                        <input required type="number" value={newService.maxQuantity} onChange={e => setNewService({...newService, maxQuantity: parseInt(e.target.value)})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">API Provider</label>
                      <select value={newService.providerId} onChange={e => setNewService({...newService, providerId: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold border border-transparent focus:border-indigo-500 outline-none transition-all">
                        <option value="">Manual / No API</option>
                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Provider Service ID</label>
                      <input type="text" value={newService.providerServiceId} onChange={e => setNewService({...newService, providerServiceId: e.target.value})} placeholder="ID from upstream API" className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Order Field Type</label>
                      <select value={newService.orderFieldsType} onChange={e => setNewService({...newService, orderFieldsType: e.target.value as any})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold border border-transparent focus:border-indigo-500 outline-none transition-all">
                        <option value="url">URL</option>
                        <option value="username">Username</option>
                        <option value="post_link">Post Link</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Toggles & Meta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-[24px]">
                  <label className="flex flex-col items-center gap-2 cursor-pointer group">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Drip-Feed</span>
                    <input type="checkbox" checked={newService.dripFeed} onChange={e => setNewService({...newService, dripFeed: e.target.checked})} className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500" />
                  </label>
                  <label className="flex flex-col items-center gap-2 cursor-pointer group">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Refill</span>
                     <input type="checkbox" checked={newService.refill} onChange={e => setNewService({...newService, refill: e.target.checked})} className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500" />
                  </label>
                  <label className="flex flex-col items-center gap-2 cursor-pointer group">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Cancelable</span>
                     <input type="checkbox" checked={newService.cancelPossible} onChange={e => setNewService({...newService, cancelPossible: e.target.checked})} className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500" />
                  </label>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Status</label>
                    <select value={newService.status} onChange={e => setNewService({...newService, status: e.target.value})} className="w-full bg-white text-xs font-black uppercase rounded-xl px-3 py-2 border border-gray-200">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Speed</label>
                      <select value={newService.speed} onChange={e => setNewService({...newService, speed: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold">
                        <option value="Slow">Slow</option>
                        <option value="Medium">Medium</option>
                        <option value="Fast">Fast</option>
                        <option value="Instant">Instant</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Avg Time</label>
                      <input type="text" value={newService.avgTime} onChange={e => setNewService({...newService, avgTime: e.target.value})} placeholder="0-24 Hours" className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Starting Min</label>
                      <input type="number" value={newService.startingMinimum} onChange={e => setNewService({...newService, startingMinimum: parseInt(e.target.value)})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold" />
                   </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Service Description / Terms</label>
                  <textarea value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} placeholder="Detailed rules and info for customer..." className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all h-32" />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => { setShowAddService(false); setEditingService(null); setNewService(initialServiceState); }} className="flex-1 bg-gray-100 text-gray-900 rounded-2xl py-5 font-black uppercase tracking-widest text-xs">Cancel</button>
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white rounded-2xl py-5 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">{editingService ? 'Update Service' : 'Add Service'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
