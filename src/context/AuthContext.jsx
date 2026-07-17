import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid) => {
    try {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      setProfile(p || null);
    } catch (e) {
      console.error("profile fetch error", e);
    }
  }, []);

  const fetchWallet = useCallback(async (uid) => {
    try {
      const { data: w } = await supabase.from("wallets").select("*").eq("user_id", uid).maybeSingle();
      setWallet(w || null);
    } catch (e) {
      console.error("wallet fetch error", e);
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    if (session?.user?.id) await fetchWallet(session.user.id);
  }, [session, fetchWallet]);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user?.id) {
        Promise.all([fetchProfile(s.user.id), fetchWallet(s.user.id)]).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id);
        fetchWallet(s.user.id);
      } else {
        setProfile(null);
        setWallet(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile, fetchWallet]);

  const signUp = async (email, password, meta = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setWallet(null);
  };

  const updateProfile = async (updates) => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) setProfile(data);
    return data;
  };

  const value = {
    session,
    user: session?.user || null,
    profile,
    wallet,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshWallet,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
