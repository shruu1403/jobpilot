'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from "@/components/landing/LandingPage";
import { supabase } from '@/lib/supabaseClient';

export default function HomeClient() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    const redirectAuthenticatedUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        router.replace('/dashboard');
        return;
      }

      setCheckingAuth(false);
    };

    redirectAuthenticatedUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session) {
        router.replace('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAuth) {
    return <div className="min-h-screen bg-black" />;
  }

  return <LandingPage />;
}
