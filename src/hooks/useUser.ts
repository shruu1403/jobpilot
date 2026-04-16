import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileRole, setProfileRole] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', userId)
        .single();

      if (data) {
        setProfileName(data.full_name || '');
        setProfileRole(data.role || '');
        setProfileAvatar(data.avatar_url || null);
      }
    } catch {
      // Profile might not exist yet, that's okay
    }
  }, []);

  useEffect(() => {
    // Check initial user
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
      setLoading(false);
    };

    fetchUser();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
        setLoading(false);
      }
    );

    // Listen for custom profile-updated event
    const handleProfileUpdate = () => {
      setUser((prevUser) => {
        if (prevUser) {
          fetchProfile(prevUser.id);
        }
        return prevUser;
      });
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [fetchProfile]);

  const userName = profileName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User';

  const userRole = profileRole || user?.user_metadata?.role || '';
  const isGoogleUser = user?.app_metadata?.provider === 'google';

  const avatarUrl =
    profileAvatar ||
    (isGoogleUser
      ? user?.user_metadata?.avatar_url || user?.user_metadata?.picture
      : null) ||
    null;

  return { user, loading, userName, userRole, avatarUrl, refetchProfile: () => user ? fetchProfile(user.id) : Promise.resolve() };
}
