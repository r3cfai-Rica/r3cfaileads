import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, useTranslation, translations } from '@/lib/i18n';

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
  channel: 'whatsapp' | 'sms' | 'email';
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
  
  // Data
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [ctas, setCTAs] = useState<CTA[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const t = useTranslation(language);
  const isAuthenticated = user !== null;
  
  // Admins have unlimited access
  const isAdmin = user?.role === 'admin';

  const canSearch = isAdmin || user?.plan === 'paid' || (user?.searchesUsed ?? 0) < FREE_SEARCH_LIMIT;
  
  const canSaveLeads = useCallback((count: number) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admins have no limits
    if (user.plan === 'paid') return count <= PAID_LEAD_LIMIT_PER_DAY;
    return (user.leadsUsed + count) <= FREE_LEAD_LIMIT;
  }, [user]);

  const remainingSearches = isAdmin ? Infinity : (user?.plan === 'paid' ? Infinity : FREE_SEARCH_LIMIT - (user?.searchesUsed ?? 0));
  const remainingLeads = isAdmin ? Infinity : (user?.plan === 'paid' ? PAID_LEAD_LIMIT_PER_DAY : FREE_LEAD_LIMIT - (user?.leadsUsed ?? 0));

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        user,
        setUser,
        isAuthenticated,
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
