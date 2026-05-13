import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion } from 'motion/react';
import { Users, Search, Edit2, Wallet, Shield, Mail, CheckCircle2 } from 'lucide-react';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  role: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('email'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserData)));
      setLoading(false);
    }, (error) => {
      console.error("AdminUsers snapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateBalance = async () => {
    if (!editingUser || !newBalance) return;
    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, { balance: parseFloat(newBalance) });
      setEditingUser(null);
      setNewBalance('');
      // No need to fetchUsers() here anymore, snapshot handles it
    } catch (err) {
      console.error(err);
      alert('Failed to update balance');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">User Management</h1>
        <p className="text-gray-500 font-medium">Manage user accounts and balances</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold uppercase">
                        {user.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-indigo-600">${user.balance.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => {
                        setEditingUser(user);
                        setNewBalance(user.balance.toString());
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Edit Balance</h2>
            <p className="text-gray-500 text-sm mb-6 font-medium">Update balance for {editingUser.displayName}</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">New Balance ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold outline-none transition-all mt-1"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateBalance}
                  className="flex-1 bg-indigo-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Update
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
