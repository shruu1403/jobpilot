import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface UserState {
  user: User | null;
  loading: boolean;
  profileRole: string;
  profileName: string;
  profileAvatar: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setProfileData: (data: { role: string; name: string; avatar: string | null }) => void;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,
  profileRole: '',
  profileName: '',
  profileAvatar: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setProfileData: (data) => set({ profileRole: data.role, profileName: data.name, profileAvatar: data.avatar }),
  fetchProfile: async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', userId)
        .single();
      
      if (data) {
        set({
          profileName: data.full_name || '',
          profileRole: data.role || '',
          profileAvatar: data.avatar_url || null,
        });
      }
    } catch {
      // Profile might not exist yet, that's okay
    }
  }
}));

// Initialize auth listener outside of hooks to ensure it only runs once per app lifecycle client-side
let authListenerInitialized = false;

function initAuthListener() {
  if (typeof window === 'undefined' || authListenerInitialized) return;
  authListenerInitialized = true;

  const store = useUserStore.getState();

  // Check initial user
  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      store.setUser(user);
      if (user) {
        // Run profile fetch without blocking the initial render of user
        store.fetchProfile(user.id);
      }
    } finally {
      store.setLoading(false);
    }
  };

  fetchUser();

  // Listen for changes
  supabase.auth.onAuthStateChange(async (_event, session) => {
    const currentUser = session?.user ?? null;
    useUserStore.getState().setUser(currentUser);
    if (currentUser) {
      await useUserStore.getState().fetchProfile(currentUser.id);
    }
    useUserStore.getState().setLoading(false);
  });

  // Custom profile update event
  window.addEventListener('profile-updated', () => {
    const currentUser = useUserStore.getState().user;
    if (currentUser) {
      useUserStore.getState().fetchProfile(currentUser.id);
    }
  });
}

// Trigger initialization safely in the browser
if (typeof window !== 'undefined') {
  initAuthListener();
}

export function useUser() {
  const { user, loading, profileName, profileRole, profileAvatar, fetchProfile } = useUserStore();

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

  return { 
    user, 
    loading, 
    userName, 
    userRole, 
    avatarUrl, 
    refetchProfile: () => user ? fetchProfile(user.id) : Promise.resolve() 
  };
}
