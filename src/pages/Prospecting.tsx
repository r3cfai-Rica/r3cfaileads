import React, { useState } from 'react';
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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Mock lead generation
const generateMockLeads = (niche: string): Lead[] => {
  const names = [
    'Carlos Oliveira', 'Ana Santos', 'Ricardo Mendes', 'Patricia Lima',
    'Fernando Costa', 'Juliana Almeida', 'Bruno Ferreira', 'Camila Rodrigues',
    'Lucas Silva', 'Mariana Souza'
  ];
  
  const positions = [
    'Diretor de Marketing', 'CEO', 'Gerente de Vendas', 'Proprietário',
    'Coordenador', 'Head de Growth', 'Founder', 'Diretor Comercial'
  ];
  
  const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
  
  const intentSignals = [
    `Comentou em post sobre ${niche}`,
    `Pesquisando soluções de ${niche}`,
    `Mencionou dificuldades com ${niche}`,
    `Buscando fornecedores de ${niche}`,
    `Interesse recente em ${niche}`,
  ];

  return names.map((name, i) => ({
    id: `lead-${Date.now()}-${i}`,
    name,
    position: positions[i % positions.length],
    location: cities[i % cities.length],
    intentSignal: intentSignals[i % intentSignals.length],
    urgency: (['low', 'medium', 'high'] as const)[i % 3],
    email: i % 2 === 0 ? `${name.toLowerCase().replace(' ', '.')}@empresa.com` : undefined,
    phone: i % 3 === 0 ? `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    whatsapp: i % 2 === 0 ? `5511${Math.floor(100000000 + Math.random() * 900000000)}` : undefined,
    sources: [`linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`, 'google.com'],
    isCompetitor: i === 2, // One competitor for demo
    status: 'new',
    createdAt: new Date(),
  }));
};

const generateMockInsights = (niche: string): NicheInsights => ({
  pains: [
    `Dificuldade em encontrar fornecedores confiáveis de ${niche}`,
    `Alto custo de implementação de soluções de ${niche}`,
    `Falta de conhecimento técnico sobre ${niche}`,
    `Processos manuais e ineficientes em ${niche}`,
  ],
  questions: [
    `Como escolher o melhor serviço de ${niche}?`,
    `Qual o ROI esperado com ${niche}?`,
    `Quanto tempo leva para implementar ${niche}?`,
    `Quais são as tendências em ${niche} para 2024?`,
  ],
  trends: [
    `Automação crescente no setor de ${niche}`,
    `Integração com IA em soluções de ${niche}`,
    `Aumento da demanda por ${niche} sustentável`,
  ],
  urgency: 'high',
  urgencyReason: `Mercado de ${niche} em rápida expansão com muitas empresas buscando soluções imediatas.`,
});

export const Prospecting: React.FC = () => {
  const {
    t,
    user,
    leads,
    setLeads,
    folders,
    setFolders,
    setSearchHistory,
    canSearch,
    canSaveLeads,
    remainingSearches,
    remainingLeads,
    setUser,
  } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [insights, setInsights] = useState<NicheInsights | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [targetFolder, setTargetFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (!canSearch) {
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setInsights(null);
    setSelectedLeads(new Set());

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockLeads = generateMockLeads(searchQuery);
    const limitedLeads = user?.plan === 'free' ? mockLeads.slice(0, 10) : mockLeads;
    const mockInsights = generateMockInsights(searchQuery);

    setSearchResults(limitedLeads);
    setInsights(mockInsights);
    setIsSearching(false);

    // Update user search count
    if (user) {
      setUser({ ...user, searchesUsed: user.searchesUsed + 1 });
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

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      leadCount: 0,
      createdAt: new Date(),
    };
    
    setFolders([...folders, newFolder]);
    setTargetFolder(newFolder.id);
    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const handleSaveLeads = () => {
    if (!targetFolder || selectedLeads.size === 0) return;
    
    if (!canSaveLeads(selectedLeads.size)) {
      return;
    }

    const leadsToSave = searchResults
      .filter(l => selectedLeads.has(l.id) && !l.isCompetitor)
      .map(l => ({ ...l, folderId: targetFolder }));

    setLeads([...leads, ...leadsToSave]);

    // Update folder count
    setFolders(folders.map(f => 
      f.id === targetFolder 
        ? { ...f, leadCount: f.leadCount + leadsToSave.length }
        : f
    ));

    // Save search history
    if (insights) {
      setSearchHistory(prev => [...prev, {
        id: `search-${Date.now()}`,
        name: searchQuery,
        category: 'Prospecção',
        niche: searchQuery,
        date: new Date(),
        leadsFound: searchResults.length,
        leadsSaved: leadsToSave.length,
        insights,
        folderId: targetFolder,
      }]);
    }

    // Update user leads count
    if (user) {
      setUser({ ...user, leadsUsed: user.leadsUsed + leadsToSave.length });
    }

    // Reset
    setSelectedLeads(new Set());
    setSearchResults([]);
    setInsights(null);
    setSearchQuery('');
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

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={t.prospecting.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 text-lg h-12"
                disabled={!canSearch}
              />
            </div>
            <Button
              variant="gradient"
              size="lg"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim() || !canSearch}
              className="min-w-[150px]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.prospecting.searching}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  {t.prospecting.search}
                </>
              )}
            </Button>
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
                  {/* Urgency */}
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

                  {/* Pains */}
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

                  {/* Questions */}
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
                            <h4 className="font-medium">{lead.name}</h4>
                            {lead.isCompetitor && (
                              <Badge variant="destructive">{t.prospecting.competitor}</Badge>
                            )}
                            <Badge variant={urgencyVariant[lead.urgency]}>{t.common[lead.urgency]}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {lead.position && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {lead.position}
                              </span>
                            )}
                            {lead.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {lead.location}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            <Target className="w-3 h-3 text-primary" />
                            {lead.intentSignal}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            {lead.email && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                Email
                              </Badge>
                            )}
                            {lead.phone && (
                              <Badge variant="outline" className="text-xs">
                                <Phone className="w-3 h-3 mr-1" />
                                Telefone
                              </Badge>
                            )}
                            {lead.whatsapp && (
                              <Badge variant="outline" className="text-xs">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                WhatsApp
                              </Badge>
                            )}
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
      {!isSearching && searchResults.length === 0 && !insights && canSearch && (
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pronto para prospectar?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Digite um nicho ou interesse no campo acima para descobrir leads qualificados com IA.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Prospecting;
