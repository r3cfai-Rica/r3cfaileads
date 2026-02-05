import React, { useState, useEffect, useCallback } from 'react';
import { useApp, Lead, NicheInsights } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { generateLeadsWithAI } from '@/lib/ai-api';
import { useToast } from '@/hooks/use-toast';
import { useFolders } from '@/hooks/useFolders';
import { useLeads } from '@/hooks/useLeads';
import { useSearchHistory } from '@/hooks/useSearchHistory';

const STORAGE_KEY = 'prospecting_search_state';

interface ProspectingState {
  searchQuery: string;
  country: string;
  city: string;
  postalCode: string;
  searchResults: Lead[];
  insights: NicheInsights | null;
  selectedLeads: string[];
}

const countries = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
];


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

  // Load persisted state from sessionStorage
  const loadPersistedState = useCallback((): ProspectingState | null => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore Date objects for leads
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

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave: ProspectingState = {
      searchQuery,
      country,
      city,
      postalCode,
      searchResults,
      insights,
      selectedLeads: Array.from(selectedLeads),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [searchQuery, country, city, postalCode, searchResults, insights, selectedLeads]);

  // Clear all search state
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCity('');
    setPostalCode('');
    setSearchResults([]);
    setInsights(null);
    setSelectedLeads(new Set());
    setTargetFolder('');
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const translations = {
    'pt-BR': {
      discoverTitle: 'Descobrir Clientes Potenciais',
      discoverDesc: 'Busque por indivíduos ou decisores interessados no seu nicho.',
      savedSearch: 'BUSCA SALVA',
      leadsCount: 'LEADS',
      searchPlaceholder: 'Ex: Pisos Urutanos',
      cityPlaceholder: 'Cidade',
      postalPlaceholder: 'CEP / Código Postal',
      searchButton: 'Buscar Clientes',
    },
    'en-US': {
      discoverTitle: 'Discover Potential Clients',
      discoverDesc: 'Search for individuals or decision makers interested in your niche.',
      savedSearch: 'SAVED SEARCH',
      leadsCount: 'LEADS',
      searchPlaceholder: 'Ex: Industrial Flooring',
      cityPlaceholder: 'City',
      postalPlaceholder: 'ZIP / Postal Code',
      searchButton: 'Search Clients',
    },
  };

  const tt = translations[language];
  const selectedCountry = countries.find(c => c.code === country);

  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (!canSearch) {
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setInsights(null);
    setSelectedLeads(new Set());

    try {
      const selectedCountryData = countries.find(c => c.code === country);
      const result = await generateLeadsWithAI({
        niche: searchQuery,
        country: selectedCountryData?.name || 'Brazil',
        city: city,
        postalCode: postalCode,
        language: language,
      });

      const limitedLeads = user?.plan === 'free' ? result.leads.slice(0, 10) : result.leads;
      
      setSearchResults(limitedLeads);
      setInsights(result.insights);

      if (user) {
        setUser({ ...user, searchesUsed: user.searchesUsed + 1 });
      }

      toast({
        title: language === 'pt-BR' ? 'Leads gerados com sucesso!' : 'Leads generated successfully!',
        description: language === 'pt-BR' 
          ? `${limitedLeads.length} leads encontrados para "${searchQuery}"`
          : `${limitedLeads.length} leads found for "${searchQuery}"`,
      });
    } catch (error) {
      console.error('Error generating leads:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao gerar leads' : 'Error generating leads',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    const validLeads = searchResults.filter(l => !l.isCompetitor);
    if (selectedLeads.size === validLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(validLeads.map(l => l.id)));
    }
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

  const handleSaveLeads = async () => {
    if (!targetFolder || selectedLeads.size === 0) return;
    
    if (!canSaveLeads(selectedLeads.size)) {
      return;
    }

    const leadsToSave = searchResults
      .filter(l => selectedLeads.has(l.id) && !l.isCompetitor);

    // Save leads to database with real UUIDs
    const savedLeads = await saveLeads(leadsToSave, targetFolder);
    
    if (savedLeads.length > 0) {
      // Update folder lead count in database
      await updateFolderLeadCount(targetFolder, savedLeads.length);

      // Create search history record in database
      if (insights) {
        await createSearchHistory({
          name: searchQuery,
          niche: searchQuery,
          category: 'Prospecção',
          leadsFound: searchResults.length,
          leadsSaved: savedLeads.length,
          insights,
          folderId: targetFolder,
        });
      }

      if (user) {
        setUser({ ...user, leadsUsed: user.leadsUsed + savedLeads.length });
      }

      setSelectedLeads(new Set());
      setSearchResults([]);
      setInsights(null);
      setSearchQuery('');
    }
  };

  const urgencyVariant = {
    low: 'urgencyLow' as const,
    medium: 'urgencyMedium' as const,
    high: 'urgencyHigh' as const,
  };

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

      {/* Enhanced Search Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold">{tt.discoverTitle}</h2>
              <p className="text-sm text-muted-foreground">{tt.discoverDesc}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tt.savedSearch}
              </Badge>
              <Badge variant="success" className="font-bold">
                9999 {tt.leadsCount}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Niche Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={tt.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 text-base"
                disabled={!canSearch}
              />
            </div>

            {/* Country Select */}
            <div className="relative">
              <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="pl-10 h-12">
                  <SelectValue>
                    {selectedCountry && (
                      <span className="flex items-center gap-2">
                        <span>{selectedCountry.flag}</span>
                        {selectedCountry.name}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={tt.cityPlaceholder}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Postal Code + Search + Clear Buttons */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={tt.postalPlaceholder}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button
                variant="gradient"
                size="lg"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim() || !canSearch}
                className="h-12 px-6 whitespace-nowrap"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.prospecting.searching}
                  </>
                ) : (
                  tt.searchButton
                )}
              </Button>
              {(searchResults.length > 0 || searchQuery.trim()) && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleClearSearch}
                  className="h-12 px-4"
                  title={language === 'pt-BR' ? 'Limpar busca' : 'Clear search'}
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
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
                <Button variant="gradientCTA" size="lg">
                  {t.plans.upgrade}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {(searchResults.length > 0 || insights) && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Insights Panel */}
          {insights && (
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
                      <Badge variant={urgencyVariant[insights.urgency]}>
                        {t.common[insights.urgency]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insights.urgencyReason}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      {t.campaigns.pains}
                    </h4>
                    <ul className="space-y-1">
                      {insights.pains.slice(0, 3).map((pain, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-warning">•</span>
                          {pain}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-info" />
                      {t.campaigns.questions}
                    </h4>
                    <ul className="space-y-1">
                      {insights.questions.slice(0, 3).map((q, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-info">•</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Leads List */}
          <div className={insights ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      {t.prospecting.results} ({searchResults.filter(l => !l.isCompetitor).length})
                    </CardTitle>
                    <CardDescription>
                      {selectedLeads.size} selecionado(s)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedLeads.size === searchResults.filter(l => !l.isCompetitor).length
                        ? t.common.deselectAll
                        : t.common.selectAll}
                    </Button>
                  </div>
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
                      <Button variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.prospecting.createFolder}</DialogTitle>
                        <DialogDescription>{t.crm.folderName}</DialogDescription>
                      </DialogHeader>
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Ex: Revestimento Industrial"
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                          {t.common.cancel}
                        </Button>
                        <Button onClick={handleCreateFolder}>
                          {t.common.save}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="gradient"
                    onClick={handleSaveLeads}
                    disabled={!targetFolder || selectedLeads.size === 0}
                    className="sm:ml-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t.prospecting.saveSelected} ({selectedLeads.size})
                  </Button>
                </div>

                {/* Leads Grid */}
                <div className="space-y-3">
                  {searchResults.map((lead) => (
                    <div
                      key={lead.id}
                      className={`p-4 rounded-lg border transition-all ${
                        lead.isCompetitor
                          ? 'bg-destructive/5 border-destructive/20 opacity-60'
                          : selectedLeads.has(lead.id)
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!lead.isCompetitor && (
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={() => handleSelectLead(lead.id)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{lead.name}</span>
                            {lead.position && (
                              <Badge variant="secondary" className="text-xs">
                                {lead.position}
                              </Badge>
                            )}
                            {lead.isCompetitor && (
                              <Badge variant="destructive" className="text-xs">
                                {t.prospecting.competitor}
                              </Badge>
                            )}
                            <Badge variant={urgencyVariant[lead.urgency]} className="text-xs">
                              {t.common[lead.urgency]}
                            </Badge>
                          </div>

                          {/* Intent Signal */}
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-primary" />
                            {lead.intentSignal}
                          </p>

                          {/* Location */}
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {lead.location}
                          </p>

                          {/* Contacts */}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {lead.email && (
                              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phone && (
                              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.whatsapp && (
                              <span className="text-xs flex items-center gap-1 text-success">
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </span>
                            )}
                          </div>

                          {/* Sources */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {lead.sources.map((source, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <LinkIcon className="w-3 h-3 mr-1" />
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && searchResults.length === 0 && canSearch && (
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{tt.discoverTitle}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {tt.discoverDesc}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Prospecting;
