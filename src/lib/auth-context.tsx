import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "engineer" | "founder";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string | undefined) => {
    if (!uid) return setRoles([]);
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as Role));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) {
        try { localStorage.setItem("aveiq_ref", ref.toUpperCase().slice(0, 16)); } catch {}
      }
    }

    const applyIntent = async (uid: string | undefined) => {
      try {
        const pending = localStorage.getItem("aveiq_intent");
        if (pending !== "engineer" && pending !== "founder") return;
        localStorage.removeItem("aveiq_intent");
        const { applySignupIntent } = await import("@/lib/intent.functions");
        await applySignupIntent({ data: { intent: pending } });
        await loadRoles(uid);
      } catch { /* ignore */ }
    };

    const attributeRef = async () => {
      try {
        const ref = localStorage.getItem("aveiq_ref");
        if (!ref) return;
        const { attributeReferral } = await import("@/lib/referrals.functions");
        await attributeReferral({ data: { code: ref } });
        localStorage.removeItem("aveiq_ref");
      } catch { /* ignore */ }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setTimeout(() => {
        loadRoles(s?.user?.id);
        if (s?.user) attributeRef();
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadRoles(data.session?.user?.id).finally(() => setLoading(false));
      if (data.session?.user) attributeRef();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user,
    session,
    roles,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshRoles: () => loadRoles(user?.id),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
