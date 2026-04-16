'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, Loader2, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import rocketImg from '@/assets/rocket.png';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; s: number; d: number; dl: number }[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2 + 0.8,
        d: Math.random() * 4 + 2,
        dl: Math.random() * 5,
      }))
    );
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signup successful! Please check your email.');
      router.push('/login');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((st) => (
          <div
            key={st.id}
            className="absolute rounded-full bg-white/50"
            style={{
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: st.s,
              height: st.s,
              animation: `ldg-twinkle ${st.d}s ease-in-out infinite ${st.dl}s`,
            }}
          />
        ))}
      </div>

      {/* Moving Rocket — diagonal fly from bottom-left to top-right */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ zIndex: 5 }}
        initial={{ left: '-15%', bottom: '-15%', opacity: 0 }}
        animate={{ left: '110%', bottom: '110%', opacity: [0, 1, 1, 1, 0] }}
        transition={{ duration: 5, ease: 'easeInOut' }}
      >
        <Image src={rocketImg} alt="Rocket" width={200} height={200} priority style={{ filter: 'drop-shadow(0 0 24px rgba(99,102,241,0.5))', transform: 'rotate(20deg)' }} />
      </motion.div>

      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      </div>



      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-[#111827] border border-white/5 rounded-[32px] p-8 relative z-10 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3 mb-6 relative z-10">
          <Image src="/logo.png" alt="JobPilot Logo" width={48} height={48} className="rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">JobPilot</h1>
          <p className="text-muted-text font-medium text-[15px]">Smarter resumes. Better matches. Faster results.</p>
        </div>



        {/* Email/Password Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text group-focus-within:text-blue-400 transition-colors" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-[#0B1220] border border-white/5 rounded-2xl text-white placeholder:text-muted-text/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text group-focus-within:text-blue-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-14 bg-[#0B1220] border border-white/5 rounded-2xl text-white placeholder:text-muted-text/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
                    <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
          </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[10px] font-black text-muted-text uppercase tracking-widest leading-none">Or</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>
        
        {/* OAuth Actions */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-4 border border-white/10 rounded-2xl bg-white/[0.02] text-white font-black text-[13px] tracking-widest hover:bg-white/[0.05] transition-all duration-300 uppercase shadow-lg shadow-black/20"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Continue with Google
        </button>

        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-muted-text font-medium text-[15px]">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
