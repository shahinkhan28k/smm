import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Shield, UserCheck, Mail, Search, Trash2, AlertCircle } from 'lucide-react';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

export default function AdminStaff() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [staff, setStaff] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<UserData | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'moderator']));
      const snap = await getDocs(q);
      setStaff(snap.docs.map(doc => ({ ...doc.data() } as UserData)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    setSearching(true);
    setFoundUser(null);
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setFoundUser({ ...snap.docs[0].data() } as UserData);
      } else {
        alert('User not found. They must sign in at least once.');
      }
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.GET, 'users-search');
    } finally {
      setSearching(false);
    }
  };

  const updateRole = async (uid: string, role: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role });
      setFoundUser(null);
      setSearchEmail('');
      fetchStaff();
      alert(`User role updated to ${role}`);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'users-role-update');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Staff Management</h1>
        <p className="text-gray-500 font-medium">Add and manage admins and moderators</p>
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
          <UserPlus size={24} className="text-indigo-600" />
          Add New Staff Member
        </h2>
        
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Enter user's Gmail address..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-indigo-500 rounded-2xl font-bold outline-none transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={searching}
            className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
          >
            {searching ? 'Finding...' : 'Find User'}
          </button>
        </form>

        <AnimatePresence>
          {foundUser && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 bg-indigo-50 rounded-[24px] border border-indigo-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                  {foundUser.displayName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{foundUser.displayName}</p>
                  <p className="text-sm text-gray-500">{foundUser.email}</p>
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-1">Current Role: {foundUser.role}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateRole(foundUser.uid, 'moderator')}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all"
                >
                  Make Moderator
                </button>
                <button 
                  onClick={() => updateRole(foundUser.uid, 'admin')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all"
                >
                  Make Admin
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <Shield size={20} className="text-gray-400" />
            Active Staff List
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map(member => (
                <tr key={member.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4 font-bold text-gray-900">{member.displayName}</td>
                  <td className="px-8 py-4 text-sm text-gray-500">{member.email}</td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-center">
                    {member.email !== 'shahinkhan28w@gmail.com' ? (
                      <button 
                        onClick={() => updateRole(member.uid, 'user')}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    ) : (
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">System Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
