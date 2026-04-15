'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'staff' | 'manager';

interface AuthContextType {
  session:   Session | null;
  user:      User | null;
  role:      UserRole | null;
  isLoading: boolean;
  isPasscodeVerified: boolean;
  verifyPasscode: (email: string, passcode: string, requestedRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, role: null, isLoading: true, isPasscodeVerified: false,
  verifyPasscode: async () => ({ success: false }),
  signOut: async () => {},
});

async function fetchRole(email: string): Promise<UserRole | null> {
  try {
    const { data } = await supabase.from('staffs').select('role').eq('email', email).single();
    if (data?.role) return data.role.toLowerCase() as UserRole;
  } catch (err) {
    console.error('Error fetching role:', err);
  }
  return null;
}

const rolePromiseCache = new Map<string, Promise<UserRole | null>>();
function getCachedRole(userId: string): Promise<UserRole | null> {
  if (rolePromiseCache.has(userId)) {
    return rolePromiseCache.get(userId)!;
  }
  const promise = fetchRole(userId);
  rolePromiseCache.set(userId, promise);
  return promise;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session,   setSession]   = useState<any>(null);
  const [user,      setUser]      = useState<any>(null);
  const [role,      setRole]      = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    // 1. Staff "LocalStorage Only" Auth Check (Bypass Supabase for legacy staff keys)
    const token = typeof window !== 'undefined' ? localStorage.getItem('pharm_token') : null;

    if (token) {
      try {
        const parsed = JSON.parse(token);
        if (isMounted) {
          setSession({ user: { id: parsed.id, email: parsed.email } });
          setUser({ id: parsed.id, email: parsed.email, user_metadata: { full_name: parsed.name } });
          setRole('staff');
          setIsLoading(false);
          setIsPasscodeVerified(true); // Legacy tokens skip passcode prompt
        }
        return () => { isMounted = false; };
      } catch(e) { /* corrupted token — fall through */ }
    }

    // Safety timeout: If auth takes more than 5 seconds, force stop loading to prevent UI hang
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth initialization timed out. Forcing content load.');
        setIsLoading(false);
      }
    }, 5000);

    // 2. Admin/Manager "Supabase Auth" hydration
    const initAuth = async () => {
      try {
        console.log('🔑 initAuth: Getting session...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (initialSession?.user) {
          console.log('👤 initAuth: User found -', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          const verified = sessionStorage.getItem('isPasscodeVerified') === 'true';
          const tRole = sessionStorage.getItem('terminalRole');
          console.log('🛡️ initAuth: Verified status -', verified, 'Role -', tRole);
          
          setIsPasscodeVerified(verified);
          
          if (verified && tRole) {
            setRole(tRole as UserRole);
            setIsLoading(false);
          } else {
            console.log('🔍 initAuth: Fetching role...');
            getCachedRole(initialSession.user.email || '').then(r => {
              if (isMounted) {
                console.log('🎭 initAuth: Role fetched -', r);
                setRole(r);
                setIsLoading(false);
              }
            });
          }
        } else {
          console.log('❓ initAuth: No session found');
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
      } finally {
        // Only set isLoading to false if we don't have a user, 
        // or if we already have the role. 
        // If we have a user but no role yet, the .then() in initAuth will handle setting isLoading(false).
        if (isMounted) {
          const hasUserWithoutRole = session?.user && !role;
          if (!hasUserWithoutRole) {
            console.log('🏁 initAuth: Completed, setting isLoading to false');
            setIsLoading(false);
          }
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('🔄 onAuthStateChange:', _event, newSession?.user?.email);
      if (!isMounted) return;
      
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const verified = sessionStorage.getItem('isPasscodeVerified') === 'true';
        const tRole = sessionStorage.getItem('terminalRole');
        
        if (verified && tRole) {
          console.log('✅ onAuthStateChange: Using cached role -', tRole);
          setRole(tRole as UserRole);
          setIsLoading(false);
        } else {
          console.log('🔍 onAuthStateChange: Fetching role...');
          getCachedRole(newSession.user.email || '').then(r => {
            if (isMounted) {
              console.log('🎭 onAuthStateChange: Role fetched -', r);
              setRole(r);
              setIsLoading(false);
            }
          });
        }
      } else {
        console.log('👤 onAuthStateChange: No user, resetting state');
        setRole(null);
        setIsLoading(false);
      }

      if (_event === 'SIGNED_IN') {
        const path = window.location.pathname;
        if (path === '/login' || path === '/') {
          getCachedRole(newSession?.user?.email || '').then(r => {
            if (isMounted) router.push(r === 'staff' ? '/pos' : '/reports');
          });
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router]);

  const verifyPasscode = async (email: string, passcode: string, requestedRole?: UserRole) => {
    try {
      // 1. Check if staffs table is empty (Bootstrap case)
      const { count } = await supabase.from('staffs').select('*', { count: 'exact', head: true });
      
      // If table is empty, allow 1234 as the bootstrap passcode for the first manager
      if (count === 0 && passcode === '1234') {
        const sessionRole = requestedRole || 'admin';
        setIsPasscodeVerified(true);
        setRole(sessionRole);
        sessionStorage.setItem('isPasscodeVerified', 'true');
        sessionStorage.setItem('terminalRole', sessionRole);
        return { success: true };
      }

      // 2. Standard verification
      const { data, error } = await supabase
        .from('staffs')
        .select('role')
        .eq('email', email)
        .eq('passcode', passcode)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid email or passcode' };
      }

      const sessionRole = requestedRole || (data.role.toLowerCase() as UserRole);
      setIsPasscodeVerified(true);
      setRole(sessionRole);
      sessionStorage.setItem('isPasscodeVerified', 'true');
      sessionStorage.setItem('terminalRole', sessionRole);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Verification failed' };
    }
  };

  const signOut = async () => {
    // 1. Clear staff localStorage token immediately
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pharm_token');
    }

    // Clear role cache to ensure fresh fetches on next login
    rolePromiseCache.clear();

    // 2. Reset all auth state synchronously so the UI updates immediately
    setSession(null);
    setUser(null);
    setRole(null);
    setIsPasscodeVerified(false);
    sessionStorage.removeItem('isPasscodeVerified');
    sessionStorage.removeItem('terminalRole');
    setIsLoading(false);

    // 3. Sign out of Supabase (fire-and-forget — we've already cleared state)
    supabase.auth.signOut().catch(() => {/* no-op */});

    // 4. Navigate to login
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, user, role, isLoading, isPasscodeVerified, verifyPasscode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
