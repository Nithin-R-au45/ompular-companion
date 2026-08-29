import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface OmpularUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: OmpularUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    age: number,
    bio: string,
  ) => Promise<{ needsVerification: boolean }>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<OmpularUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const authUser = nextSession.user;
      setUser({
        id: authUser.id,
        email: authUser.email ?? "",
        name:
          (authUser.user_metadata?.['name'] as string | undefined) ??
          authUser.email?.split("@")[0] ??
          "friend",
      });
      setLoading(false);
      setTimeout(() => {
        supabase
          .from("profiles")
          .select("name, email")
          .eq("id", authUser.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setUser({ id: authUser.id, name: data.name, email: data.email });
            }
          });
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setLoading(false);
      setSession(data.session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    age: number,
    bio: string,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name, age: age ? String(age) : "", bio },
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!session,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
