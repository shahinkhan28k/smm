import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, setDoc, getDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Plus, Trash2, Globe, Key, RefreshCw, Layers, CheckCircle2, AlertCircle, Palette, Image as ImageIcon, Type, Link as LinkIcon, Newspaper, Wallet, MessageSquare } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  status: string;
  markupPercentage: number;
}

interface PageContent {
    dashboardNews?: string;
    newOrderTitle?: string;
    newOrderSubtitle?: string;
    newOrderInstructions?: string;
    servicesDescription?: string;
    addFundsInstructions?: string;
}

interface SiteSettings {
  siteName: string;
  faviconUrl: string;
  bannerTitle: string;
  bannerText: string;
  bannerImage: string;
  tabTitle: string;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'branding' | 'providers' | 'pages' | 'payments' | 'support'>('branding');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [siteSettings, setSiteSettings] = useState<SiteSettings & { paymentNumbers?: any, supportLinks?: any }>({
    siteName: 'Natok Boost',
    faviconUrl: '',
    bannerTitle: 'Welcome to NATOK BOOST',
    bannerText: 'Get the best SMM services at lowest price!',
    bannerImage: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200',
    tabTitle: 'Natok Boost | Best SMM Panel',
    paymentNumbers: { bkash: '', nagad: '', rocket: '', bank: '' },
    supportLinks: { whatsapp: '', telegram: '' }
  });

  const [pageContent, setPageContent] = useState<PageContent>({
    dashboardNews: '',
    newOrderTitle: 'Make a New Order',
    newOrderSubtitle: 'Select a service and boost your growth.',
    newOrderInstructions: '',
    servicesDescription: '',
    addFundsInstructions: ''
  });

  const [newProvider, setNewProvider] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    status: 'active',
    markupPercentage: 10
  });

  useEffect(() => {
    const unsubProviders = onSnapshot(collection(db, 'providers'), (snap) => {
      setProviders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider)));
    }, (err) => {
      console.error("AdminSettings: Error loading providers", err);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSiteSettings(prev => ({
          ...prev,
          ...data,
          paymentNumbers: data.paymentNumbers || prev.paymentNumbers,
          supportLinks: data.supportLinks || prev.supportLinks
        }));
      }
    }, (err) => {
      console.warn("AdminSettings: Error loading site settings", err);
    });

    const unsubPages = onSnapshot(doc(db, 'settings', 'pages'), (snap) => {
      if (snap.exists()) {
        setPageContent(snap.data() as PageContent);
      }
      setLoading(false);
    }, (err) => {
      console.error("AdminSettings: Error loading page content", err);
      setLoading(false);
    });

    return () => {
      unsubProviders();
      unsubSettings();
      unsubPages();
    };
  }, []);

  const handleUpdateSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      console.log("AdminSettings: Updating site settings...", siteSettings);
      const settingsRef = doc(db, 'settings', 'site');
      await setDoc(settingsRef, siteSettings, { merge: true });
      alert('Branding settings updated successfully!');
    } catch (err: any) {
      console.error("AdminSettings Branding Update Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/site');
      alert('Failed to update branding: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdatePaymentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      console.log("AdminSettings: Updating payment numbers...", siteSettings.paymentNumbers);
      const settingsRef = doc(db, 'settings', 'site');
      await updateDoc(settingsRef, {
        paymentNumbers: siteSettings.paymentNumbers
      });
      alert('Payment information updated successfully!');
    } catch (err: any) {
      console.error("AdminSettings Payment Update Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/site');
      alert('Failed to update payments: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateSupportInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      console.log("AdminSettings: Updating support links...", siteSettings.supportLinks);
      const settingsRef = doc(db, 'settings', 'site');
      await updateDoc(settingsRef, {
        supportLinks: siteSettings.supportLinks
      });
      alert('Support information updated successfully!');
    } catch (err: any) {
      console.error("AdminSettings Support Update Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/site');
      alert('Failed to update support info: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdatePageContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      console.log("AdminSettings: Updating page content...", pageContent);
      const pagesRef = doc(db, 'settings', 'pages');
      await setDoc(pagesRef, pageContent, { merge: true });
      alert('Page content updated successfully!');
    } catch (err: any) {
      console.error("AdminSettings Page Content Update Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/pages');
      alert('Failed to update page content: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'providers'), newProvider);
      alert('Provider added successfully!');
      setNewProvider({ name: '', apiUrl: '', apiKey: '', status: 'active', markupPercentage: 10 });
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      alert('Failed to add provider: ' + (err.message || String(err)));
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    try {
      await deleteDoc(doc(db, 'providers', id));
    } catch (err) {
      console.error(err);
    }
  };

  const syncServices = async (provider: Provider) => {
    setSyncing(provider.id);
    try {
      console.log(`Starting sync for ${provider.name}...`);
      const response = await fetch('/api/provider/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: provider.apiUrl,
          apiKey: provider.apiKey,
          action: 'services'
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API fetch failed');
      }
      
      const externalServices = data;
      if (!Array.isArray(externalServices)) {
        console.error('Invalid response format:', externalServices);
        throw new Error('Provider returned invalid format. Expected a list of services.');
      }

      console.log(`Received ${externalServices.length} services. Applying ${provider.markupPercentage}% markup...`);
      const batch = writeBatch(db);
      const catSnap = await getDocs(collection(db, 'categories'));
      const existingCats = new Map(catSnap.docs.map(doc => [doc.data().name.toLowerCase(), doc.id]));
      
      const newCats = new Map<string, string>();
      let operations = 0;
      let totalImported = 0;

      const markup = 1 + (provider.markupPercentage / 100);

      for (const s of externalServices) {
        if (operations >= 480) {
           console.warn('Batch limit reached, stopping for this sync.');
           break;
        }

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
          providerId: provider.id,
          providerServiceId: s.service,
          serviceType: s.type || 'Default',
          dripFeed: s.dripfeed === "1" || s.dripfeed === true,
          refill: s.refill === "1" || s.refill === true,
          cancelPossible: s.cancel === "1" || s.cancel === true,
          description: s.description || ''
        });
        operations++;
        totalImported++;
      }

      await batch.commit();
      alert(`Successfully synced ${totalImported} services from ${provider.name}.\nMarkup (+${provider.markupPercentage}%) applied successfully.`);
    } catch (err: any) {
      console.error('Sync Error:', err);
      alert('Sync failed. Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSyncing(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'providers', label: 'API Providers', icon: Globe },
    { id: 'pages', label: 'Page Content', icon: Newspaper },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'support', label: 'Support Info', icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">System Settings</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Manage your panel configuration</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="md:hidden">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Settings Category</label>
          <select 
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 font-black uppercase text-xs tracking-widest outline-none shadow-sm"
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl md:inline-flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all
                ${activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden"
      >
        {activeTab === 'branding' && (
          <form onSubmit={handleUpdateSiteSettings} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest mb-4">Identity</h3>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Website Name</label>
                  <input type="text" value={siteSettings.siteName} onChange={e => setSiteSettings({...siteSettings, siteName: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tab Title</label>
                  <input type="text" value={siteSettings.tabTitle} onChange={e => setSiteSettings({...siteSettings, tabTitle: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Favicon URL</label>
                  <input type="text" value={siteSettings.faviconUrl} onChange={e => setSiteSettings({...siteSettings, faviconUrl: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all mt-1" />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest mb-4">Hero Section</h3>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Banner Title</label>
                  <input type="text" value={siteSettings.bannerTitle} onChange={e => setSiteSettings({...siteSettings, bannerTitle: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Banner Text</label>
                  <input type="text" value={siteSettings.bannerText} onChange={e => setSiteSettings({...siteSettings, bannerText: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Banner Image URL</label>
                  <input type="text" value={siteSettings.bannerImage} onChange={e => setSiteSettings({...siteSettings, bannerImage: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all mt-1" />
                </div>
              </div>
            </div>
            <button disabled={savingSettings} className="w-full bg-blue-600 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-100">
              {savingSettings ? 'Saving...' : 'Save Branding Changes'}
            </button>
          </form>
        )}

        {activeTab === 'providers' && (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest">Active Providers</h3>
              <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2">
                <Plus size={14} /> Add Provider
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map(p => (
                <div key={p.id} className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                  <div className="flex justify-between mb-4">
                     <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-tight">{p.name}</h4>
                        <span className="text-[10px] font-black text-green-500 uppercase">{p.status}</span>
                     </div>
                     <button onClick={() => deleteProvider(p.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="text-[10px] font-mono text-gray-400 truncate">{p.apiUrl}</p>
                    <p className="text-[10px] font-black text-indigo-600 uppercase">Markup: +{p.markupPercentage}%</p>
                  </div>
                  <button onClick={() => syncServices(p)} disabled={!!syncing} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    {syncing === p.id ? <RefreshCw size={14} className="animate-spin mx-auto" /> : `Sync Services`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pages' && (
          <form onSubmit={handleUpdatePageContent} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Dashboard News</label>
                  <textarea value={pageContent.dashboardNews} onChange={e => setPageContent({...pageContent, dashboardNews: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold h-32 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">New Order Instructions</label>
                  <textarea value={pageContent.newOrderInstructions} onChange={e => setPageContent({...pageContent, newOrderInstructions: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold h-32 mt-1" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">New Order Title</label>
                  <input type="text" value={pageContent.newOrderTitle} onChange={e => setPageContent({...pageContent, newOrderTitle: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Services Description</label>
                  <input type="text" value={pageContent.servicesDescription} onChange={e => setPageContent({...pageContent, servicesDescription: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold mt-1" />
                </div>
              </div>
            </div>
            <button disabled={savingSettings} className="w-full bg-blue-600 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-[10px]">
              {savingSettings ? 'Saving...' : 'Update Page Content'}
            </button>
          </form>
        )}

        {activeTab === 'payments' && (
          <form onSubmit={handleUpdatePaymentInfo} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest mb-4">Payment Numbers (Comma separated)</h3>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">bKash Numbers</label>
                  <input type="text" value={siteSettings.paymentNumbers?.bkash || ''} onChange={e => setSiteSettings({...siteSettings, paymentNumbers: {...siteSettings.paymentNumbers, bkash: e.target.value}})} placeholder="017..., 018..." className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nagad Numbers</label>
                  <input type="text" value={siteSettings.paymentNumbers?.nagad || ''} onChange={e => setSiteSettings({...siteSettings, paymentNumbers: {...siteSettings.paymentNumbers, nagad: e.target.value}})} placeholder="019..." className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold mt-1" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Rocket Numbers</label>
                  <input type="text" value={siteSettings.paymentNumbers?.rocket || ''} onChange={e => setSiteSettings({...siteSettings, paymentNumbers: {...siteSettings.paymentNumbers, rocket: e.target.value}})} placeholder="018..." className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Bank Transfer Details</label>
                  <textarea value={siteSettings.paymentNumbers?.bank || ''} onChange={e => setSiteSettings({...siteSettings, paymentNumbers: {...siteSettings.paymentNumbers, bank: e.target.value}})} placeholder="Bank Name / Account No" className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold h-24 mt-1" />
                </div>
              </div>
            </div>
            <button disabled={savingSettings} className="w-full bg-pink-600 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-pink-100">
              {savingSettings ? 'Saving...' : 'Update Payment Info'}
            </button>
          </form>
        )}

        {activeTab === 'support' && (
          <form onSubmit={handleUpdateSupportInfo} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest mb-4">Contact Links</h3>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">WhatsApp Number/Link</label>
                  <input type="text" value={siteSettings.supportLinks?.whatsapp || ''} onChange={e => setSiteSettings({...siteSettings, supportLinks: {...siteSettings.supportLinks, whatsapp: e.target.value}})} placeholder="e.g. 8801700000000" className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Telegram Username/Link</label>
                  <input type="text" value={siteSettings.supportLinks?.telegram || ''} onChange={e => setSiteSettings({...siteSettings, supportLinks: {...siteSettings.supportLinks, telegram: e.target.value}})} placeholder="e.g. natokboost_support" className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold mt-1" />
                </div>
              </div>
            </div>
            <button disabled={savingSettings} className="w-full bg-green-600 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-green-100">
              {savingSettings ? 'Saving...' : 'Update Support Links'}
            </button>
          </form>
        )}
      </motion.div>

    <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">Add API Provider</h2>
              <form onSubmit={handleAddProvider} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Provider Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. SMM Provider A"
                    value={newProvider.name}
                    onChange={e => setNewProvider({...newProvider, name: e.target.value})}
                    className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">API URL (V2)</label>
                  <input 
                    required
                    type="url" 
                    placeholder="https://provider.com/api/v2"
                    value={newProvider.apiUrl}
                    onChange={e => setNewProvider({...newProvider, apiUrl: e.target.value})}
                    className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">API Key (String or JSON)</label>
                  <textarea 
                    required
                    placeholder='Enter your API Key. If your provider requires JSON, paste the full JSON object here.'
                    value={newProvider.apiKey}
                    onChange={e => setNewProvider({...newProvider, apiKey: e.target.value})}
                    className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all h-24 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Markup Percentage (%)</label>
                  <input 
                    required
                    type="number" 
                    placeholder="10"
                    value={newProvider.markupPercentage}
                    onChange={e => setNewProvider({...newProvider, markupPercentage: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Add Provider
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
