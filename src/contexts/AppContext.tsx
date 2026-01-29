import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Language, useTranslation, translations } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import type { Session as SupabaseSession } from '@supabase/supabase-js';

export type { Language };

export type UserPlan = 'free' | 'paid';
export type UserRole = 'user' | 'admin';

export interface Lead {
  id: string;
  name: string;
  position?: string;
  location?: string;
  intentSignal: string;
  urgency: 'low' | 'medium' | 'high';
  email?: string;
  phone?: string;
  whatsapp?: string;
  sources: string[];
  isCompetitor: boolean;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  createdAt: Date;
  folderId?: string;
}

export interface CTA {
  id: string;
  title: string;
  text: string;
  imageUrl?: string;
  folderId: string;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  leadCount: number;
  createdAt: Date;
}

export interface NicheInsights {
  pains: string[];
  questions: string[];
  trends: string[];
  urgency: 'low' | 'medium' | 'high';
  urgencyReason: string;
}

export interface SearchHistory {
  id: string;
  name: string;
  category: string;
  niche: string;
  date: Date;
  leadsFound: number;
  leadsSaved: number;
  insights: NicheInsights;
  folderId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: UserPlan;
  role: UserRole;
  searchesUsed: number;
  leadsUsed: number;
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface MessageLog {
  id: string;
  leadId: string;
  leadName: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'telegram';
  message: string;
  status: 'sent' | 'failed' | 'replied';
  sentAt: Date;
}

interface AppContextType {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['pt-BR'];
  
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  ctas: CTA[];
  setCTAs: React.Dispatch<React.SetStateAction<CTA[]>>;
  searchHistory: SearchHistory[];
  setSearchHistory: React.Dispatch<React.SetStateAction<SearchHistory[]>>;
  messageLogs: MessageLog[];
  setMessageLogs: React.Dispatch<React.SetStateAction<MessageLog[]>>;
  
  // Admin
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  
  // Plan limits
  canSearch: boolean;
  canSaveLeads: (count: number) => boolean;
  remainingSearches: number;
  remainingLeads: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FREE_SEARCH_LIMIT = 1;
const FREE_LEAD_LIMIT = 10;
const PAID_LEAD_LIMIT_PER_DAY = 200;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [ctas, setCTAs] = useState<CTA[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const t = useTranslation(language);

  const hydrateUserFromSession = useCallback(async (session: SupabaseSession) => {
    const supaUser = session.user;
    const email = supaUser.email ?? '';
    const derivedName =
      (supaUser.user_metadata?.name as string | undefined) ||
      (supaUser.user_metadata?.full_name as string | undefined) ||
      (email ? email.split('@')[0] : undefined) ||
      'User';

    // Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', supaUser.id)
      .maybeSingle();

    let effectiveProfile = profileData;

    if (!effectiveProfile) {
      const { error: createProfileError } = await supabase.from('profiles').insert({
        user_id: supaUser.id,
        name: derivedName,
        email,
        plan: 'free',
        plan_type: 'basic',
        searches_used: 0,
        leads_used: 0,
        is_active: true,
      });

      if (!createProfileError) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', supaUser.id)
          .maybeSingle();
        effectiveProfile = newProfile ?? null;
      }
    }

    // Role (optional)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', supaUser.id)
      .maybeSingle();

    const role: UserRole = roleData?.role === 'admin' ? 'admin' : 'user';

    setUser({
      id: supaUser.id,
      name: effectiveProfile?.name || derivedName,
      email,
      plan: effectiveProfile?.plan === 'paid' ? 'paid' : 'free',
      role,
      searchesUsed: effectiveProfile?.searches_used ?? 0,
      leadsUsed: effectiveProfile?.leads_used ?? 0,
      isActive: effectiveProfile?.is_active ?? true,
      createdAt: new Date(effectiveProfile?.created_at || Date.now()),
      lastLogin: new Date(),
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleSession = (session: SupabaseSession | null) => {
      if (!mounted) return;

      if (!session) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      setTimeout(() => {
        hydrateUserFromSession(session)
          .catch(() => {
            // If hydration fails, keep the app in a safe logged-out state.
            if (mounted) setUser(null);
          })
          .finally(() => {
            if (mounted) setAuthLoading(false);
          });
      }, 0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUserFromSession]);

  const isAuthenticated = user !== null;

  // Admins have unlimited access
  const isAdmin = user?.role === 'admin';

  const canSearch = isAdmin || user?.plan === 'paid' || (user?.searchesUsed ?? 0) < FREE_SEARCH_LIMIT;

  const canSaveLeads = useCallback(
    (count: number) => {
      if (!user) return false;
      if (user.role === 'admin') return true; // Admins have no limits
      if (user.plan === 'paid') return count <= PAID_LEAD_LIMIT_PER_DAY;
      return user.leadsUsed + count <= FREE_LEAD_LIMIT;
    },
    [user]
  );

  const remainingSearches = isAdmin
    ? Infinity
    : user?.plan === 'paid'
      ? Infinity
      : FREE_SEARCH_LIMIT - (user?.searchesUsed ?? 0);
  const remainingLeads = isAdmin
    ? Infinity
    : user?.plan === 'paid'
      ? PAID_LEAD_LIMIT_PER_DAY
      : FREE_LEAD_LIMIT - (user?.leadsUsed ?? 0);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        user,
        setUser,
        isAuthenticated,
        authLoading,
        leads,
        setLeads,
        folders,
        setFolders,
        ctas,
        setCTAs,
        searchHistory,
        setSearchHistory,
        messageLogs,
        setMessageLogs,
        allUsers,
        setAllUsers,
        canSearch,
        canSaveLeads,
        remainingSearches,
        remainingLeads,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
