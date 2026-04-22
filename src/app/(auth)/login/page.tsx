'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "@/lib/toast";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import rocketImg from '@/assets/rocket.png';

export default function Login() {
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
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome to JobPilot!');
      router.replace('/dashboard');
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Error sending reset link');
    }
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

      {/* Brand Header */}


      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-[#111827] border border-white/5 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl backdrop-blur-xl animate-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-2 sm:gap-3 mb-6 sm:mb-8 relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-top-4">
          <Image src="/logo.png" alt="JobPilot Logo" width={48} height={48} className="rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-transform hover:scale-110" />
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">JobPilot</h1>
        </div>



        {/* Email/Password Form */}
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text group-focus-within:text-blue-400 transition-colors" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 sm:h-14 pl-12 pr-4 bg-[#0B1220] border border-white/5 rounded-2xl text-white placeholder:text-muted-text/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-muted-text uppercase tracking-widest">Password</label>
              <button
                onClick={handleForgotPassword}
                className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                type="button"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text group-focus-within:text-blue-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 sm:h-14 pl-12 pr-14 bg-[#0B1220] border border-white/5 rounded-2xl text-white placeholder:text-muted-text/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
              <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest text-[13px]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In to Dashboard'}
          </button>
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] font-black text-muted-text uppercase tracking-[0.25em] leading-none">Or</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>
          {/* OAuth Actions */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-4 border border-white/5 rounded-2xl bg-white/[0.03] text-white font-black text-[12px] tracking-[0.2em] hover:bg-white/[0.05] transition-all duration-300 uppercase shadow-lg shadow-black/20 group"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 transition-transform group-hover:scale-125" />
            Continue with Google
          </button>


      
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-muted-text font-medium text-[15px]">
          Don’t have an account?{' '}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}
