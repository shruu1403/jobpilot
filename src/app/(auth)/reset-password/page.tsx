'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Loader2, Eye, EyeOff, Zap } from 'lucide-react';

export default function ResetPassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if we have a session to perform the reset
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event triggered");
      }
    });
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      </div>


      {/* Brand Header */}
      <div className="flex flex-col items-center gap-4 mb-10 relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <Image src="/logo.png" alt="JobPilot Logo" width={54} height={54} className="rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-transform hover:scale-110" />
        <h1 className="text-3xl font-black text-white tracking-widest uppercase italic">JobPilot</h1>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-[#111827] border border-white/5 rounded-[32px] p-10 relative z-10 shadow-2xl backdrop-blur-xl animate-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-6">
            <Zap className="text-blue-400" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Password Reset</h2>
          <p className="text-muted-text font-medium text-[15px]">Enter your new password</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text group-focus-within:text-blue-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-text uppercase tracking-widest ml-1">Confirm New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text group-focus-within:text-blue-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-14 bg-[#0B1220] border border-white/5 rounded-2xl text-white placeholder:text-muted-text/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest text-[13px]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm New Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
