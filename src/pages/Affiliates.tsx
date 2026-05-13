import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Users, Link as LinkIcon, DollarSign, Award, Copy, Check } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AffiliateData {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
}

export default function Affiliates() {
  const { user } = useAuth();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchAffiliate = async () => {
      const ref = doc(db, 'affiliates', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setData(snap.data() as AffiliateData);
      } else {
        // Create initial affiliate data
        const newData = {
          referralCode: user.uid.slice(0, 8),
          totalReferrals: 0,
          totalEarnings: 0,
          userId: user.uid
        };
        await setDoc(ref, newData);
        setData(newData as any);
      }
      setLoading(false);
    };
    fetchAffiliate();
  }, [user]);

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${data?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 p-12 opacity-10">
          <Award size={200} />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Affiliate Program</h1>
          <p className="text-indigo-100 font-bold max-w-xl opacity-90 text-lg leading-relaxed">
            Invite your friends and earn <span className="text-white underline decoration-white/40 underline-offset-4">5% commission</span> on every order they place. Lifetime earnings!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Users, label: 'Total Referrals', value: data?.totalReferrals || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: DollarSign, label: 'Total Earnings', value: `$${(data?.totalEarnings || 0).toFixed(2)}`, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Award, label: 'Commission Rate', value: '5%', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Your Referral Link</h2>
          <p className="text-gray-500 font-medium">Share this link with your network to start earning.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-3xl px-6 py-5 font-mono text-sm text-gray-600 flex items-center truncate">
            {window.location.origin}/register?ref={data?.referralCode}
          </div>
          <button
            onClick={copyLink}
            className={`px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
              copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
            }`}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
          <div className="space-y-4">
            <h3 className="font-black text-sm uppercase tracking-widest text-gray-400">How to earn</h3>
            <div className="space-y-4">
              {[
                "Copy your unique referral link above.",
                "Share it on social media, blogs, or with friends.",
                "Whenever they add funds, you get commission.",
                "Withdraw your earnings to your balance anytime."
              ].map((text, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 text-xs font-black">{i+1}</div>
                  <p className="text-sm font-medium text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100">
             <div className="flex items-center gap-3 mb-4">
                < Award className="text-yellow-500" size={24} />
                <h3 className="font-black text-gray-900 uppercase tracking-tight">Withdrawal Rules</h3>
             </div>
             <ul className="space-y-3">
               <li className="text-sm font-medium text-gray-600 flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></div>
                 Minimum payout is $10.00
               </li>
               <li className="text-sm font-medium text-gray-600 flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></div>
                 Referral must specify your link on register
               </li>
               <li className="text-sm font-medium text-gray-600 flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></div>
                 Payouts are processed within 48 hours
               </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
