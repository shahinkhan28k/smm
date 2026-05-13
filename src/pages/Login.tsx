import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { Chrome, Mail, ArrowLeft, Zap } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
      >
        <NavLink to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors mb-8 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Back to Home</span>
        </NavLink>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
            <Zap size={32} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Access Natok Boost</h1>
          <p className="text-gray-500 font-medium">Choose your preferred login method</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 px-4 py-4 rounded-2xl font-bold text-gray-700 hover:border-blue-600 hover:bg-blue-50 transition-all active:scale-95 group"
          >
            <Chrome size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <span>Continue with Google</span>
          </button>

          {!showEmailLogin ? (
            <button
              onClick={() => setShowEmailLogin(true)}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 px-4 py-4 rounded-2xl font-bold text-white hover:bg-gray-800 transition-all active:scale-95"
            >
              <Mail size={20} />
              <span>Continue with Email</span>
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-medium"
                />
              </div>
              <button
                className="w-full bg-blue-600 py-4 rounded-2xl font-bold text-white hover:bg-blue-700 transition-all active:scale-95"
                onClick={() => setError("Email login is coming soon. Please use Google for now.")}
              >
                Sign In / Sign Up
              </button>
              <button 
                onClick={() => setShowEmailLogin(false)}
                className="w-full text-sm font-bold text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </div>

        <p className="mt-10 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-loose">
          By signing in, you agree to our <br/> 
          <span className="text-gray-400 hover:text-blue-600 cursor-pointer">Terms of Service</span> & 
          <span className="text-gray-400 hover:text-blue-600 cursor-pointer pl-1">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}
