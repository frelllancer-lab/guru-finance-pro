import { createClient, User } from '@supabase/supabase-js';
import { BankAccount, Transaction } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// === TYPES ===

export interface UserAppData {
  accounts: BankAccount[];
  transactions: Transaction[];
  categoryLimits: Record<string, number>;
}

// === AUTH: Email ===

export const loginWithEmail = async (email: string, pass: string, isRegistering = false) => {
  if (isRegistering) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { display_name: email.split('@')[0] } },
    });
    if (error) throw error;
    return data.user!;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login') || msg.includes('not found') || msg.includes('invalid credentials')) {
      const { data: regData, error: regError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { display_name: email.split('@')[0] } },
      });
      if (regError) throw regError;
      return regData.user!;
    }
    throw error;
  }
  return data.user!;
};

// === AUTH: Google (redirect — works on mobile!) ===

export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
};

// === AUTH: Password Reset ===

export const sendResetPasswordEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
};

// === AUTH: Logout (both Supabase + Firebase) ===

export const logoutUser = async () => {
  await supabase.auth.signOut();
  try {
    const { getAuth, signOut } = await import('firebase/auth');
    await signOut(getAuth());
  } catch (_) {}
};

// === AUTH: State ===

export const getCurrentUser = () => supabase.auth.getUser();

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
};

// === DATABASE: Subscribe to real-time ===

export const subscribeToUserData = (
  userId: string,
  onData: (data: UserAppData) => void
) => {
  let initialized = false;

  // Initial fetch
  supabase
    .from('user_data')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
    .then(({ data }) => {
      if (!initialized && data) {
        onData({
          accounts: data.accounts || [],
          transactions: data.transactions || [],
          categoryLimits: data.category_limits || {},
        });
      }
      initialized = true;
    });

  // Realtime subscription
  const channel = supabase
    .channel(`user_data:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_data',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const data = payload.new as any;
        if (data) {
          onData({
            accounts: data.accounts || [],
            transactions: data.transactions || [],
            categoryLimits: data.category_limits || {},
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// === DATABASE: Save ===

export const saveUserDataToFirestore = async (userId: string, data: UserAppData) => {
  try {
    await supabase.from('user_data').upsert(
      {
        id: userId,
        accounts: data.accounts,
        transactions: data.transactions,
        category_limits: data.categoryLimits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Error saving user data to Supabase:', err);
  }
};

// === DATABASE: Check existence ===

export const checkUserDocExists = async (userId: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('user_data')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
};
