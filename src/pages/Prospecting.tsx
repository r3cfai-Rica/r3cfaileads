import React, { useState, useEffect, useCallback } from 'react';
import { useApp, Lead, NicheInsights } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Loader2,
  User,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Link as LinkIcon,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  Target,
  Save,
  Plus,
  Zap,
  Crown,
  Clock,
  Hash,
  Flag,
  Sparkles,
  X,
  Building2,
  UserCircle,
  Upload,
  Globe,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { generateLeadsWithAI, generateLeadsByInterest, generateLeadsFromWeb, generateLeadsPerson } from '@/lib/ai-api';
import { useToast } from '@/hooks/use-toast';
import { useFolders } from '@/hooks/useFolders';
import { useLeads } from '@/hooks/useLeads';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { CSVImportDialog } from '@/components/prospecting/CSVImportDialog';

const STORAGE_KEY = 'prospecting_search_state';

interface ProspectingState {
  searchQuery: string;
  country: string;
  city: string;
  postalCode: string;
  searchResults: Lead[];
  insights: NicheInsights | null;
  selectedLeads: string[];
  leadType: 'b2b' | 'b2c' | 'person' | 'interest' | 'web' | 'both';
  excludePublicSector: boolean;
  contactOnly: boolean;
  hideCompetitors: boolean;
  interestQuery: string;
  interestCountry: string;
  interestCity: string;
  interestResults: Lead[];
  interestInsights: NicheInsights | null;
  selectedInterestLeads: string[];
  webQuery: string;
  webCountry: string;
  webCity: string;
  webResults: Lead[];
  webInsights: NicheInsights | null;
  selectedWebLeads: string[];
  personQuery: string;
  personCountry: string;
  personCity: string;
  personResults: Lead[];
  personInsights: NicheInsights | null;
  selectedPersonLeads: string[];
}

const countries = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
];

const PUBLIC_SECTOR_TYPES = ['government', 'hospital', 'school', 'university', 'city_hall', 'courthouse', 'fire_station', 'police', 'post_office', 'library', 'local_government_office'];

export const Prospecting: React.FC = () => {
  const {
    t,
    user,
    canSearch,
    canSaveLeads,
    remainingSearches,
    remainingLeads,
    setUser,
    language,
  } = useApp();
  
  const { folders, createFolder, updateFolderLeadCount } = useFolders();
  const { saveLeads } = useLeads();
  const { createSearchHistory } = useSearchHistory();
  const navigate = useNavigate();

  const loadPersistedState = useCallback((): ProspectingState | null => {
    try {
      // Migrate from sessionStorage if present
      const legacy = sessionStorage.getItem(STORAGE_KEY);
      if (legacy && !localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, legacy);
        sessionStorage.removeItem(STORAGE_KEY);
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.searchResults) {
          parsed.searchResults = parsed.searchResults.map((l: Lead) => ({
            ...l,
            createdAt: new Date(l.createdAt),
          }));
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading prospecting state:', e);
    }
    return null;
  }, []);

  const persistedState = loadPersistedState();

  const [searchQuery, setSearchQuery] = useState(persistedState?.searchQuery || '');
  const [country, setCountry] = useState(persistedState?.country || 'BR');
  const [city, setCity] = useState(persistedState?.city || '');
  const [postalCode, setPostalCode] = useState(persistedState?.postalCode || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Lead[]>(persistedState?.searchResults || []);
  const [insights, setInsights] = useState<NicheInsights | null>(persistedState?.insights || null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set(persistedState?.selectedLeads || []));
  const [targetFolder, setTargetFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  // New filters
  const [leadType, setLeadType] = useState<'b2b' | 'b2c' | 'person' | 'interest' | 'web' | 'both'>(persistedState?.leadType || 'b2b');
  const [excludePublicSector, setExcludePublicSector] = useState(persistedState?.excludePublicSector ?? true);
  const [contactOnly, setContactOnly] = useState(persistedState?.contactOnly ?? true);
  const [hideCompetitors, setHideCompetitors] = useState(persistedState?.hideCompetitors ?? true);

  // B2C
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [b2cLeads, setB2cLeads] = useState<Lead[]>([]);
  const [selectedB2cLeads, setSelectedB2cLeads] = useState<Set<string>>(new Set());

  // Interest-based search
  const [interestQuery, setInterestQuery] = useState(persistedState?.interestQuery || '');
  const [interestCountry, setInterestCountry] = useState(persistedState?.interestCountry || 'BR');
  const [interestCity, setInterestCity] = useState(persistedState?.interestCity || '');
  const [interestResults, setInterestResults] = useState<Lead[]>(persistedState?.interestResults || []);
  const [interestInsights, setInterestInsights] = useState<NicheInsights | null>(persistedState?.interestInsights || null);
  const [selectedInterestLeads, setSelectedInterestLeads] = useState<Set<string>>(new Set(persistedState?.selectedInterestLeads || []));
  const [isSearchingInterest, setIsSearchingInterest] = useState(false);

  // Web search
  const [webQuery, setWebQuery] = useState(persistedState?.webQuery || '');
  const [webCountry, setWebCountry] = useState(persistedState?.webCountry || 'BR');
  const [webCity, setWebCity] = useState(persistedState?.webCity || '');
  const [webResults, setWebResults] = useState<Lead[]>(persistedState?.webResults || []);
  const [webInsights, setWebInsights] = useState<NicheInsights | null>(persistedState?.webInsights || null);
  const [selectedWebLeads, setSelectedWebLeads] = useState<Set<string>>(new Set(persistedState?.selectedWebLeads || []));
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);

  // Person search (Perplexity — B2C Pessoa Física)
  const [personQuery, setPersonQuery] = useState(persistedState?.personQuery || '');
  const [personCountry, setPersonCountry] = useState(persistedState?.personCountry || 'BR');
  const [personCity, setPersonCity] = useState(persistedState?.personCity || '');
  const [personResults, setPersonResults] = useState<Lead[]>(persistedState?.personResults || []);
  const [personInsights, setPersonInsights] = useState<NicheInsights | null>(persistedState?.personInsights || null);
  const [selectedPersonLeads, setSelectedPersonLeads] = useState<Set<string>>(new Set(persistedState?.selectedPersonLeads || []));
  const [isSearchingPerson, setIsSearchingPerson] = useState(false);

  // Persist state
  useEffect(() => {
    const stateToSave: ProspectingState = {
      searchQuery, country, city, postalCode, searchResults, insights,
      selectedLeads: Array.from(selectedLeads), leadType, excludePublicSector, contactOnly, hideCompetitors,
      interestQuery, interestCountry, interestCity, interestResults, interestInsights,
      selectedInterestLeads: Array.from(selectedInterestLeads),
      webQuery, webCountry, webCity, webResults, webInsights,
      selectedWebLeads: Array.from(selectedWebLeads),
      personQuery, personCountry, personCity, personResults, personInsights,
      selectedPersonLeads: Array.from(selectedPersonLeads),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [searchQuery, country, city, postalCode, searchResults, insights, selectedLeads, leadType, excludePublicSector, contactOnly, hideCompetitors, interestQuery, interestCountry, interestCity, interestResults, interestInsights, selectedInterestLeads, webQuery, webCountry, webCity, webResults, webInsights, selectedWebLeads, personQuery, personCountry, personCity, personResults, personInsights, selectedPersonLeads]);

  // Total unsaved results currently shown on screen
  const unsavedCount = searchResults.length + interestResults.length + webResults.length + b2cLeads.length + personResults.length;

  // Warn before closing/reloading the tab if there are unsaved results
  useEffect(() => {
    if (unsavedCount === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsavedCount]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCity('');
    setPostalCode('');
    setSearchResults([]);
    setInsights(null);
    setSelectedLeads(new Set());
    setTargetFolder('');
    setB2cLeads([]);
    setSelectedB2cLeads(new Set());
    setInterestQuery('');
    setInterestCity('');
    setInterestResults([]);
    setInterestInsights(null);
    setSelectedInterestLeads(new Set());
    setWebQuery('');
    setWebCity('');
    setWebResults([]);
    setWebInsights(null);
    setSelectedWebLeads(new Set());
    setPersonQuery('');
    setPersonCity('');
    setPersonResults([]);
    setPersonInsights(null);
    setSelectedPersonLeads(new Set());
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const tt2 = language === 'pt-BR' ? {
    discoverTitle: 'Descobrir Clientes Potenciais',
    discoverDesc: 'Busque por empresas ou consumidores interessados no seu nicho.',
    savedSearch: 'BUSCA SALVA',
    leadsCount: 'LEADS',
    searchPlaceholder: 'Ex: Pisos Uretanos',
    cityPlaceholder: 'Cidade',
    postalPlaceholder: 'CEP / Código Postal',
    searchButton: 'Buscar Clientes',
    leadTypeLabel: 'Tipo de Lead',
    b2b: 'B2B (Empresas)',
    b2c: 'B2C (Consumidor)',
    interest: 'Por Interesses',
    both: 'Ambos',
    excludePublic: 'Excluir setor público',
    contactOnlyLabel: 'Somente com contato',
    hideCompetitorsLabel: 'Ocultar concorrentes',
    b2cTitle: 'Leads Opt-in (por interesse)',
    b2cDesc: 'Importe leads via CSV ou integre formulários.',
    importCSV: 'Importar CSV',
    metaAds: 'Meta Lead Ads',
    googleForms: 'Google Lead Forms',
    comingSoon: 'Em breve',
    b2bTab: 'B2B (Maps)',
    b2cTab: 'B2C (Opt-in)',
    interestTab: 'Tendências',
    publicSector: 'Setor Público',
    interestPlaceholder: 'Ex: fitness, alimentação saudável, marketing digital, pets...',
    interestSearchButton: 'Buscar Tendências',
    interestTitle: 'Busca por Tendências de Interesse',
    interestDesc: 'Descubra o que as pessoas estão buscando no Google e encontre negócios alinhados com a demanda real.',
    relevanceHigh: 'Alta',
    relevanceMedium: 'Média',
    relevanceLow: 'Baixa',
    web: 'Busca Web',
    webTitle: 'Busca Web (Internet)',
    webDesc: 'Encontre leads reais na internet, redes sociais e diretórios usando IA.',
    webPlaceholder: 'Ex: clínicas de estética com Instagram ativo em São Paulo...',
    webSearchButton: 'Buscar na Web',
    webPremium: 'Premium',
    person: 'Pessoa Física',
    personTitle: 'Busca por Pessoa Física (Perplexity)',
    personDesc: 'Encontre profissionais autônomos, criadores e influenciadores reais com presença pública verificável.',
    personPlaceholder: 'Ex: nutricionistas com atendimento online, coaches de carreira, personal trainers...',
    personSearchButton: 'Buscar Pessoas',
    personPremium: 'Premium',
    b2bLabel: 'Pessoa Jurídica (Google)',
    personLabel: 'Pessoa Física (Perplexity)',
  } : {
    discoverTitle: 'Discover Potential Clients',
    discoverDesc: 'Search for businesses or consumers interested in your niche.',
    savedSearch: 'SAVED SEARCH',
    leadsCount: 'LEADS',
    searchPlaceholder: 'Ex: Industrial Flooring',
    cityPlaceholder: 'City',
    postalPlaceholder: 'ZIP / Postal Code',
    searchButton: 'Search Clients',
    leadTypeLabel: 'Lead Type',
    b2b: 'B2B (Business)',
    b2c: 'B2C (Consumer)',
    interest: 'By Interests',
    both: 'Both',
    excludePublic: 'Exclude public sector',
    contactOnlyLabel: 'Contact info only',
    hideCompetitorsLabel: 'Hide competitors',
    b2cTitle: 'Opt-in Leads (by interest)',
    b2cDesc: 'Import leads via CSV or integrate forms.',
    importCSV: 'Import CSV',
    metaAds: 'Meta Lead Ads',
    googleForms: 'Google Lead Forms',
    comingSoon: 'Coming soon',
    b2bTab: 'B2B (Maps)',
    b2cTab: 'B2C (Opt-in)',
    interestTab: 'Trends',
    publicSector: 'Public Sector',
    interestPlaceholder: 'Ex: fitness, healthy eating, digital marketing, pets...',
    interestSearchButton: 'Search Trends',
    interestTitle: 'Interest Trends Search',
    interestDesc: 'Discover what people are searching for on Google and find businesses aligned with real demand.',
    relevanceHigh: 'High',
    relevanceMedium: 'Medium',
    relevanceLow: 'Low',
    web: 'Web Search',
    webTitle: 'Web Search (Internet)',
    webDesc: 'Find real leads across the internet, social media and directories using AI.',
    webPlaceholder: 'Ex: crossfit gyms with active Instagram in Austin...',
    webSearchButton: 'Search the Web',
    webPremium: 'Premium',
    person: 'Individuals',
    personTitle: 'Individual Search (Perplexity)',
    personDesc: 'Find real freelancers, creators and influencers with verifiable public presence.',
    personPlaceholder: 'Ex: online nutritionists, career coaches, personal trainers...',
    personSearchButton: 'Search People',
    personPremium: 'Premium',
    b2bLabel: 'Business (Google)',
    personLabel: 'Individual (Perplexity)',
  };

  const selectedCountry = countries.find(c => c.code === country);
  const { toast: toastHook } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (!canSearch) return;

    setIsSearching(true);
    setSearchResults([]);
    setInsights(null);
    setSelectedLeads(new Set());

    try {
      const selectedCountryData = countries.find(c => c.code === country);
      const isPaidUser = user?.plan === 'paid';
      const result = await generateLeadsWithAI({
        niche: searchQuery,
        country: selectedCountryData?.name || 'Brazil',
        city: city,
        postalCode: postalCode,
        language: language,
        useRealData: isPaidUser,
      });

      let filteredLeads = result.leads;

      // Apply B2B filters
      if (excludePublicSector) {
        filteredLeads = filteredLeads.filter(l => {
          const pos = (l.position || '').toLowerCase();
          return !PUBLIC_SECTOR_TYPES.some(t => pos.includes(t.replace(/_/g, ' ')));
        });
      }

      if (contactOnly) {
        filteredLeads = filteredLeads.filter(l => l.email || l.phone || l.whatsapp || (l.sources && l.sources.length > 0));
      }

      const limitedLeads = user?.plan === 'free' ? filteredLeads.slice(0, 10) : filteredLeads;
      
      setSearchResults(limitedLeads);
      setInsights(result.insights);

      if (user) {
        setUser({ ...user, searchesUsed: user.searchesUsed + 1 });
      }

      toastHook({
        title: language === 'pt-BR' ? 'Leads gerados com sucesso!' : 'Leads generated successfully!',
        description: language === 'pt-BR' 
          ? `${limitedLeads.length} leads encontrados para "${searchQuery}"`
          : `${limitedLeads.length} leads found for "${searchQuery}"`,
      });
    } catch (error) {
      console.error('Error generating leads:', error);
      toastHook({
        title: language === 'pt-BR' ? 'Erro ao gerar leads' : 'Error generating leads',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleInterestSearch = async () => {
    if (!interestQuery.trim()) return;
    if (!canSearch) return;

    setIsSearchingInterest(true);
    setInterestResults([]);
    setInterestInsights(null);
    setSelectedInterestLeads(new Set());

    try {
      const selectedCountryData = countries.find(c => c.code === interestCountry);
      const isPaidUser = user?.plan === 'paid';
      const result = await generateLeadsByInterest({
        interest: interestQuery,
        country: selectedCountryData?.name || 'Brazil',
        city: interestCity,
        language: language,
        useRealData: isPaidUser,
      });

      const limitedLeads = user?.plan === 'free' ? result.leads.slice(0, 10) : result.leads;

      setInterestResults(limitedLeads);
      setInterestInsights(result.insights);

      if (user) {
        setUser({ ...user, searchesUsed: user.searchesUsed + 1 });
      }

      toastHook({
        title: language === 'pt-BR' ? 'Leads por interesse gerados!' : 'Interest-based leads generated!',
        description: language === 'pt-BR'
          ? `${limitedLeads.length} leads encontrados para "${interestQuery}"`
          : `${limitedLeads.length} leads found for "${interestQuery}"`,
      });
    } catch (error) {
      console.error('Error generating interest leads:', error);
      toastHook({
        title: language === 'pt-BR' ? 'Erro ao gerar leads' : 'Error generating leads',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingInterest(false);
    }
  };

  const handleWebSearch = async () => {
    if (!webQuery.trim()) return;
    if (!canSearch) return;
    if (user?.plan !== 'paid') {
      toastHook({
        title: language === 'pt-BR' ? 'Recurso Premium' : 'Premium Feature',
        description: language === 'pt-BR' ? 'A Busca Web está disponível apenas para usuários Premium.' : 'Web Search is only available for Premium users.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearchingWeb(true);
    setWebResults([]);
    setWebInsights(null);
    setSelectedWebLeads(new Set());

    try {
      const selectedCountryData = countries.find(c => c.code === webCountry);
      const result = await generateLeadsFromWeb({
        query: webQuery,
        country: selectedCountryData?.name,
        city: webCity || undefined,
        language: language,
      });

      setWebResults(result.leads);
      setWebInsights(result.insights);

      if (user) {
        setUser({ ...user, searchesUsed: user.searchesUsed + 1 });
      }

      toastHook({
        title: language === 'pt-BR' ? 'Leads encontrados na web!' : 'Web leads found!',
        description: language === 'pt-BR'
          ? `${result.leads.length} leads encontrados para "${webQuery}"`
          : `${result.leads.length} leads found for "${webQuery}"`,
      });
    } catch (error) {
      console.error('Error in web search:', error);
      toastHook({
        title: language === 'pt-BR' ? 'Erro na Busca Web' : 'Web Search Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingWeb(false);
    }
  };

  const handlePersonSearch = async () => {
    if (!personQuery.trim()) return;
    if (!canSearch) return;
    if (user?.plan !== 'paid') {
      toastHook({
        title: language === 'pt-BR' ? 'Recurso Premium' : 'Premium Feature',
        description: language === 'pt-BR' ? 'A busca por Pessoa Física está disponível apenas para usuários Premium.' : 'Individual search is only available for Premium users.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearchingPerson(true);
    setPersonResults([]);
    setPersonInsights(null);
    setSelectedPersonLeads(new Set());

    try {
      const selectedCountryData = countries.find(c => c.code === personCountry);
      const result = await generateLeadsPerson({
        query: personQuery,
        country: selectedCountryData?.name,
        city: personCity || undefined,
        language: language,
      });

      setPersonResults(result.leads);
      setPersonInsights(result.insights);

      if (user) {
        setUser({ ...user, searchesUsed: user.searchesUsed + 1 });
      }

      toastHook({
        title: language === 'pt-BR' ? 'Pessoas encontradas!' : 'People found!',
        description: language === 'pt-BR'
          ? `${result.leads.length} leads encontrados para "${personQuery}"`
          : `${result.leads.length} leads found for "${personQuery}"`,
      });
    } catch (error) {
      console.error('Error in person search:', error);
      toastHook({
        title: language === 'pt-BR' ? 'Erro na Busca por Pessoa Física' : 'Individual Search Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingPerson(false);
    }
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) newSelected.delete(leadId);
    else newSelected.add(leadId);
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    const validLeads = getDisplayLeads();
    if (selectedLeads.size === validLeads.length) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(validLeads.map(l => l.id)));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const newFolder = await createFolder(newFolderName);
    if (newFolder) {
      setTargetFolder(newFolder.id);
      setNewFolderName('');
      setShowNewFolderDialog(false);
    }
  };

  const handleSaveLeads = async (leadsToSaveFrom: Lead[], selectedSet: Set<string>) => {
    if (!targetFolder || selectedSet.size === 0) return;
    if (!canSaveLeads(selectedSet.size)) return;

    const leadsToSave = leadsToSaveFrom.filter(l => selectedSet.has(l.id) && !l.isCompetitor);
    const savedLeads = await saveLeads(leadsToSave, targetFolder);
    
    if (savedLeads.length > 0) {
      await updateFolderLeadCount(targetFolder, savedLeads.length);
      if (insights) {
        await createSearchHistory({
          name: searchQuery,
          niche: searchQuery,
          category: 'Prospecção',
          leadsFound: leadsToSaveFrom.length,
          leadsSaved: savedLeads.length,
          insights,
          folderId: targetFolder,
        });
      }
      if (user) setUser({ ...user, leadsUsed: user.leadsUsed + savedLeads.length });
      selectedSet === selectedLeads ? setSelectedLeads(new Set()) : setSelectedB2cLeads(new Set());
    }
  };

  const handleCSVImport = (leads: Lead[]) => {
    setB2cLeads(prev => [...prev, ...leads]);
    toastHook({
      title: language === 'pt-BR' ? 'CSV importado!' : 'CSV imported!',
      description: `${leads.length} leads`,
    });
  };

  const getDisplayLeads = () => {
    let leads = searchResults;
    if (hideCompetitors) leads = leads.filter(l => !l.isCompetitor);
    return leads;
  };

  const urgencyVariant = {
    low: 'urgencyLow' as const,
    medium: 'urgencyMedium' as const,
    high: 'urgencyHigh' as const,
  };

  const renderLeadsList = (leads: Lead[], selected: Set<string>, onSelect: (id: string) => void, onSelectAll: () => void, onSave: () => void, isInterestMode = false) => (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">
              {t.prospecting.results} ({leads.length})
            </CardTitle>
            <CardDescription>
              {selected.size} {language === 'pt-BR' ? 'selecionado(s)' : 'selected'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            {selected.size === leads.length ? t.common.deselectAll : t.common.selectAll}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Save Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 p-4 bg-muted/50 rounded-lg">
          <Select value={targetFolder} onValueChange={setTargetFolder}>
            <SelectTrigger className="sm:w-[200px]">
              <SelectValue placeholder={t.prospecting.saveTo} />
            </SelectTrigger>
            <SelectContent>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name} ({folder.leadCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.prospecting.createFolder}</DialogTitle>
                <DialogDescription>{t.crm.folderName}</DialogDescription>
              </DialogHeader>
              <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Ex: Revestimento Industrial" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>{t.common.cancel}</Button>
                <Button onClick={handleCreateFolder}>{t.common.save}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="gradient" onClick={onSave} disabled={!targetFolder || selected.size === 0} className="sm:ml-auto">
            <Save className="w-4 h-4 mr-2" />
            {t.prospecting.saveSelected} ({selected.size})
          </Button>
        </div>

        {/* Leads */}
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`p-4 rounded-lg border transition-all ${
                lead.isCompetitor
                  ? 'bg-destructive/5 border-destructive/20 opacity-60'
                  : selected.has(lead.id)
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card hover:bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-3">
                {!lead.isCompetitor && (
                  <Checkbox checked={selected.has(lead.id)} onCheckedChange={() => onSelect(lead.id)} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{lead.name}</span>
                    {lead.position && <Badge variant="secondary" className="text-xs">{lead.position}</Badge>}
                    {lead.isCompetitor && <Badge variant="destructive" className="text-xs">{t.prospecting.competitor}</Badge>}
                    <Badge variant={urgencyVariant[lead.urgency]} className="text-xs">{t.common[lead.urgency]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />{lead.intentSignal}
                  </p>
                  {lead.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{lead.location}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="text-xs flex items-center gap-1 text-primary hover:underline" onClick={e => e.stopPropagation()}>
                        <Mail className="w-3 h-3" />{lead.email}
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="text-xs flex items-center gap-1 text-muted-foreground hover:underline" onClick={e => e.stopPropagation()}>
                        <Phone className="w-3 h-3" />{lead.phone}
                      </a>
                    )}
                    {lead.whatsapp && (
                      <a href={`https://wa.me/${lead.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-success hover:underline" onClick={e => e.stopPropagation()}>
                        <MessageCircle className="w-3 h-3" />WhatsApp
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {lead.sources.map((source, i) => (
                      <a key={i} href={source.startsWith('http') ? source : `https://${source}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border text-primary hover:bg-primary/10 hover:underline transition-colors"
                        onClick={e => e.stopPropagation()}>
                        <LinkIcon className="w-3 h-3" />{source.length > 40 ? source.substring(0, 40) + '...' : source}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            {t.prospecting.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.prospecting.subtitle}</p>
        </div>
        {user?.plan === 'free' && (
          <Badge variant="warning" className="self-start">
            {remainingSearches} busca(s) restante(s)
          </Badge>
        )}
      </div>

      {/* Unsaved leads warning */}
      {unsavedCount > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {language === 'pt-BR'
                ? `Você tem ${unsavedCount} lead(s) ainda não salvos`
                : `You have ${unsavedCount} unsaved lead(s)`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'pt-BR'
                ? 'Selecione uma pasta abaixo e clique em "Salvar" para não perder esses resultados. Resultados não salvos podem ser perdidos ao limpar o navegador.'
                : 'Pick a folder below and click "Save" so you do not lose these results. Unsaved results may be lost if the browser is cleared.'}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold">{tt2.discoverTitle}</h2>
              <p className="text-sm text-muted-foreground">{tt2.discoverDesc}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tt2.savedSearch}
              </Badge>
              <Badge variant="success" className="font-bold">
                9999 {tt2.leadsCount}
              </Badge>
            </div>
          </div>

          {/* Lead Type Select */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-1.5 block">{tt2.leadTypeLabel}</label>
            <div className="flex flex-wrap gap-2">
              {(['b2b', 'person', 'interest', 'web', 'b2c', 'both'] as const).map(type => (
                <Button
                  key={type}
                  variant={leadType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLeadType(type)}
                  className="gap-2"
                >
                  {type === 'b2b' && <Building2 className="w-4 h-4" />}
                  {type === 'person' && <UserCircle className="w-4 h-4" />}
                  {type === 'interest' && <Target className="w-4 h-4" />}
                  {type === 'web' && <Globe className="w-4 h-4" />}
                  {type === 'b2c' && <UserCircle className="w-4 h-4" />}
                  {type === 'both' && <Sparkles className="w-4 h-4" />}
                  {type === 'b2b' ? tt2.b2bLabel : type === 'person' ? tt2.personLabel : type === 'interest' ? tt2.interest : type === 'web' ? tt2.web : type === 'b2c' ? tt2.b2c : tt2.both}
                  {(type === 'web' || type === 'person') && <Badge variant="warning" className="text-xs ml-1">{tt2.webPremium}</Badge>}
                </Button>
              ))}
            </div>
          </div>

          {/* Google API Key Notice for Premium */}
          {user?.plan === 'paid' && (leadType === 'b2b' || leadType === 'interest' || leadType === 'both') && (
            <div className="mb-4 p-3 rounded-lg border border-success/30 bg-success/5 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-success">
                  {language === 'pt-BR' ? '✅ Google Places API ativa' : '✅ Google Places API active'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'pt-BR' 
                    ? 'Seus resultados utilizam dados reais e verificados do Google Maps — telefone, WhatsApp, endereço e site.'
                    : 'Your results use real, verified data from Google Maps — phone, WhatsApp, address and website.'}
                </p>
              </div>
            </div>
          )}
          {user?.plan === 'free' && (leadType === 'b2b' || leadType === 'interest' || leadType === 'both') && (
            <div className="mb-4 p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">
                  {language === 'pt-BR' ? 'Leads de demonstração (IA)' : 'Demo leads (AI)'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'pt-BR' 
                    ? 'No plano gratuito, os leads são gerados por IA para demonstração. Faça upgrade para acessar dados reais do Google Maps.'
                    : 'On the free plan, leads are AI-generated for demo purposes. Upgrade to access real Google Maps data.'}
                </p>
              </div>
            </div>
          )}

          {/* B2B Search Form */}
          {(leadType === 'b2b' || leadType === 'both') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={tt2.searchPlaceholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()} className="pl-10 h-12 text-base" disabled={!canSearch} />
                </div>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="pl-10 h-12">
                      <SelectValue>{selectedCountry && <span className="flex items-center gap-2"><span>{selectedCountry.flag}</span>{selectedCountry.name}</span>}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => <SelectItem key={c.code} value={c.code}><span className="flex items-center gap-2"><span>{c.flag}</span>{c.name}</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={tt2.cityPlaceholder} value={city} onChange={e => setCity(e.target.value)} className="pl-10 h-12" />
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={tt2.postalPlaceholder} value={postalCode} onChange={e => setPostalCode(e.target.value)} className="pl-10 h-12" />
                  </div>
                  <Button variant="gradient" size="lg" onClick={handleSearch} disabled={isSearching || !searchQuery.trim() || !canSearch} className="h-12 px-6 whitespace-nowrap">
                    {isSearching ? <><Loader2 className="w-5 h-5 animate-spin" />{t.prospecting.searching}</> : tt2.searchButton}
                  </Button>
                  {(searchResults.length > 0 || searchQuery.trim()) && (
                    <Button variant="outline" size="lg" onClick={handleClearSearch} className="h-12 px-4" title={language === 'pt-BR' ? 'Limpar busca' : 'Clear search'}>
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* B2B Filters */}
              <div className="flex flex-wrap items-center gap-6 mt-4 p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <Switch checked={excludePublicSector} onCheckedChange={setExcludePublicSector} />
                  <label className="text-sm">{tt2.excludePublic}</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={contactOnly} onCheckedChange={setContactOnly} />
                  <label className="text-sm">{tt2.contactOnlyLabel}</label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={hideCompetitors} onCheckedChange={setHideCompetitors} />
                  <label className="text-sm">{tt2.hideCompetitorsLabel}</label>
                </div>
              </div>
            </>
          )}

          {/* Interest-Based Search Form */}
          {leadType === 'interest' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{tt2.interestTitle}</h3>
                  <p className="text-sm text-muted-foreground">{tt2.interestDesc}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative md:col-span-2">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={tt2.interestPlaceholder} value={interestQuery} onChange={e => setInterestQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInterestSearch()} className="pl-10 h-12 text-base" disabled={!canSearch} />
                </div>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Select value={interestCountry} onValueChange={setInterestCountry}>
                    <SelectTrigger className="pl-10 h-12">
                      <SelectValue>{countries.find(c => c.code === interestCountry) && <span className="flex items-center gap-2"><span>{countries.find(c => c.code === interestCountry)!.flag}</span>{countries.find(c => c.code === interestCountry)!.name}</span>}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => <SelectItem key={c.code} value={c.code}><span className="flex items-center gap-2"><span>{c.flag}</span>{c.name}</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={`${tt2.cityPlaceholder} (${language === 'pt-BR' ? 'opcional' : 'optional'})`} value={interestCity} onChange={e => setInterestCity(e.target.value)} className="pl-10 h-12" />
                  </div>
                  <Button variant="gradient" size="lg" onClick={handleInterestSearch} disabled={isSearchingInterest || !interestQuery.trim() || !canSearch} className="h-12 px-6 whitespace-nowrap">
                    {isSearchingInterest ? <><Loader2 className="w-5 h-5 animate-spin" />{t.prospecting.searching}</> : tt2.interestSearchButton}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Web Search Form */}
          {leadType === 'web' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-warning" />
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {tt2.webTitle}
                    <Badge variant="warning" className="text-xs">{tt2.webPremium}</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">{tt2.webDesc}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative md:col-span-2">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={tt2.webPlaceholder} value={webQuery} onChange={e => setWebQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleWebSearch()} className="pl-10 h-12 text-base" disabled={!canSearch} />
                </div>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Select value={webCountry} onValueChange={setWebCountry}>
                    <SelectTrigger className="pl-10 h-12">
                      <SelectValue>{countries.find(c => c.code === webCountry) && <span className="flex items-center gap-2"><span>{countries.find(c => c.code === webCountry)!.flag}</span>{countries.find(c => c.code === webCountry)!.name}</span>}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => <SelectItem key={c.code} value={c.code}><span className="flex items-center gap-2"><span>{c.flag}</span>{c.name}</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={`${tt2.cityPlaceholder} (${language === 'pt-BR' ? 'opcional' : 'optional'})`} value={webCity} onChange={e => setWebCity(e.target.value)} className="pl-10 h-12" />
                  </div>
                  <Button variant="gradient" size="lg" onClick={handleWebSearch} disabled={isSearchingWeb || !webQuery.trim() || !canSearch} className="h-12 px-6 whitespace-nowrap">
                    {isSearchingWeb ? <><Loader2 className="w-5 h-5 animate-spin" />{t.prospecting.searching}</> : tt2.webSearchButton}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Person Search Form (B2C Pessoa Física via Perplexity) */}
          {leadType === 'person' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <UserCircle className="w-5 h-5 text-warning" />
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {tt2.personTitle}
                    <Badge variant="warning" className="text-xs">{tt2.personPremium}</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">{tt2.personDesc}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative md:col-span-2">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={tt2.personPlaceholder} value={personQuery} onChange={e => setPersonQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePersonSearch()} className="pl-10 h-12 text-base" disabled={!canSearch} />
                </div>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Select value={personCountry} onValueChange={setPersonCountry}>
                    <SelectTrigger className="pl-10 h-12">
                      <SelectValue>{countries.find(c => c.code === personCountry) && <span className="flex items-center gap-2"><span>{countries.find(c => c.code === personCountry)!.flag}</span>{countries.find(c => c.code === personCountry)!.name}</span>}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => <SelectItem key={c.code} value={c.code}><span className="flex items-center gap-2"><span>{c.flag}</span>{c.name}</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={`${tt2.cityPlaceholder} (${language === 'pt-BR' ? 'opcional' : 'optional'})`} value={personCity} onChange={e => setPersonCity(e.target.value)} className="pl-10 h-12" />
                  </div>
                  <Button variant="gradient" size="lg" onClick={handlePersonSearch} disabled={isSearchingPerson || !personQuery.trim() || !canSearch} className="h-12 px-6 whitespace-nowrap">
                    {isSearchingPerson ? <><Loader2 className="w-5 h-5 animate-spin" />{t.prospecting.searching}</> : tt2.personSearchButton}
                  </Button>
                </div>
              </div>
            </>
          )}


          {/* B2C Section */}
          {(leadType === 'b2c' || leadType === 'both') && (
            <div className={`${leadType === 'both' ? 'mt-6 pt-6 border-t' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <UserCircle className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{tt2.b2cTitle}</h3>
                  <p className="text-sm text-muted-foreground">{tt2.b2cDesc}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="lg" onClick={() => setShowCSVImport(true)} className="gap-2">
                  <Upload className="w-4 h-4" />
                  {tt2.importCSV}
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/settings')} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  {tt2.metaAds}
                </Button>
                <Button variant="outline" size="lg" disabled className="gap-2 opacity-50">
                  <Sparkles className="w-4 h-4" />
                  {tt2.googleForms}
                  <Badge variant="secondary" className="text-xs ml-1">{tt2.comingSoon}</Badge>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Limit Reached Alert */}
      {!canSearch && (
        <Card variant="highlight" className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-destructive" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold">{t.limits.searchLimit}</h3>
                <p className="text-muted-foreground">{t.limits.upgradeNow}</p>
              </div>
              <Link to="/plans">
                <Button variant="gradientCTA" size="lg">{t.plans.upgrade}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {leadType === 'both' ? (
        // Both mode: tabs
        ((searchResults.length > 0 || b2cLeads.length > 0 || insights) && (
          <Tabs defaultValue="b2b" className="w-full">
            <TabsList>
              <TabsTrigger value="b2b" className="gap-1"><Building2 className="w-4 h-4" />{tt2.b2bTab} ({getDisplayLeads().length})</TabsTrigger>
              <TabsTrigger value="b2c" className="gap-1"><UserCircle className="w-4 h-4" />{tt2.b2cTab} ({b2cLeads.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="b2b">
              <div className="grid lg:grid-cols-3 gap-6">
                {insights && renderInsightsPanel()}
                <div className={insights ? 'lg:col-span-2' : 'lg:col-span-3'}>
                  {renderLeadsList(getDisplayLeads(), selectedLeads, handleSelectLead, handleSelectAll, () => handleSaveLeads(searchResults, selectedLeads))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="b2c">
              {b2cLeads.length > 0 ? renderLeadsList(
                b2cLeads, selectedB2cLeads,
                (id) => { const s = new Set(selectedB2cLeads); s.has(id) ? s.delete(id) : s.add(id); setSelectedB2cLeads(s); },
                () => { setSelectedB2cLeads(selectedB2cLeads.size === b2cLeads.length ? new Set() : new Set(b2cLeads.map(l => l.id))); },
                () => handleSaveLeads(b2cLeads, selectedB2cLeads)
              ) : (
                <Card className="py-12"><CardContent className="text-center text-muted-foreground">
                  {language === 'pt-BR' ? 'Importe leads via CSV para visualizá-los aqui.' : 'Import leads via CSV to view them here.'}
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        ))
      ) : leadType === 'b2b' ? (
        // B2B mode
        (searchResults.length > 0 || insights) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {insights && renderInsightsPanel()}
            <div className={insights ? 'lg:col-span-2' : 'lg:col-span-3'}>
              {renderLeadsList(getDisplayLeads(), selectedLeads, handleSelectLead, handleSelectAll, () => handleSaveLeads(searchResults, selectedLeads))}
            </div>
          </div>
        )
      ) : leadType === 'interest' ? (
        // Interest mode
        (interestResults.length > 0 || interestInsights) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {interestInsights && renderInsightsPanel(interestInsights)}
            <div className={interestInsights ? 'lg:col-span-2' : 'lg:col-span-3'}>
              {renderLeadsList(
                interestResults, selectedInterestLeads,
                (id) => { const s = new Set(selectedInterestLeads); s.has(id) ? s.delete(id) : s.add(id); setSelectedInterestLeads(s); },
                () => { setSelectedInterestLeads(selectedInterestLeads.size === interestResults.length ? new Set() : new Set(interestResults.map(l => l.id))); },
                () => handleSaveLeads(interestResults, selectedInterestLeads),
                true
              )}
            </div>
          </div>
        )
      ) : leadType === 'web' ? (
        // Web mode
        (webResults.length > 0 || webInsights) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {webInsights && renderInsightsPanel(webInsights)}
            <div className={webInsights ? 'lg:col-span-2' : 'lg:col-span-3'}>
              {renderLeadsList(
                webResults, selectedWebLeads,
                (id) => { const s = new Set(selectedWebLeads); s.has(id) ? s.delete(id) : s.add(id); setSelectedWebLeads(s); },
                () => { setSelectedWebLeads(selectedWebLeads.size === webResults.length ? new Set() : new Set(webResults.map(l => l.id))); },
                () => handleSaveLeads(webResults, selectedWebLeads)
              )}
            </div>
          </div>
        )
      ) : (
        // B2C mode
        b2cLeads.length > 0 && renderLeadsList(
          b2cLeads, selectedB2cLeads,
          (id) => { const s = new Set(selectedB2cLeads); s.has(id) ? s.delete(id) : s.add(id); setSelectedB2cLeads(s); },
          () => { setSelectedB2cLeads(selectedB2cLeads.size === b2cLeads.length ? new Set() : new Set(b2cLeads.map(l => l.id))); },
          () => handleSaveLeads(b2cLeads, selectedB2cLeads)
        )
      )}

      {/* Empty State */}
      {!isSearching && !isSearchingInterest && !isSearchingWeb && searchResults.length === 0 && interestResults.length === 0 && webResults.length === 0 && b2cLeads.length === 0 && canSearch && (
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{tt2.discoverTitle}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{tt2.discoverDesc}</p>
          </CardContent>
        </Card>
      )}

      <CSVImportDialog open={showCSVImport} onOpenChange={setShowCSVImport} onImport={handleCSVImport} language={language} />
    </div>
  );

  function renderInsightsPanel(insightsData?: NicheInsights | null) {
    const data = insightsData || insights;
    if (!data) return null;
    return (
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {t.campaigns.insights}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium text-sm">{t.campaigns.urgency}</span>
                <Badge variant={urgencyVariant[data.urgency]}>{t.common[data.urgency]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{data.urgencyReason}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />{t.campaigns.pains}
              </h4>
              <ul className="space-y-1">
                {data.pains.slice(0, 3).map((pain, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-warning">•</span>{pain}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-info" />{t.campaigns.questions}
              </h4>
              <ul className="space-y-1">
                {data.questions.slice(0, 3).map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-info">•</span>{q}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default Prospecting;
