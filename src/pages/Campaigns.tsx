import React, { useState } from 'react';
import { useApp, CTA } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  Sparkles,
  Loader2,
  Save,
  Copy,
  Send,
  Target,
  TrendingUp,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock CTA generation
const generateMockCTAs = (niche: string): Omit<CTA, 'id' | 'folderId' | 'createdAt'>[] => {
  return [
    {
      title: `🚀 Transforme seu ${niche} Hoje!`,
      text: `Você está cansado de perder tempo com soluções que não funcionam? Descubra como centenas de empresas já revolucionaram seu ${niche} e aumentaram seus resultados em até 300%. Clique agora e garanta sua consultoria GRATUITA!`,
      imageUrl: '/placeholder.svg',
    },
    {
      title: `⚡ ${niche}: O Segredo dos Líderes`,
      text: `As maiores empresas do mercado já descobriram o poder de um ${niche} bem estruturado. Você vai ficar para trás? Acesse nosso método exclusivo e saia na frente da concorrência. Vagas limitadas!`,
      imageUrl: '/placeholder.svg',
    },
    {
      title: `💡 Solução Definitiva em ${niche}`,
      text: `Chega de dor de cabeça com ${niche}! Nossa solução foi desenvolvida por especialistas e já transformou mais de 500 negócios. Resultado garantido ou seu dinheiro de volta. Fale conosco agora!`,
      imageUrl: '/placeholder.svg',
    },
  ];
};

export const Campaigns: React.FC = () => {
  const { t, folders, ctas, setCTAs, searchHistory, user } = useApp();
  
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCTAs, setGeneratedCTAs] = useState<Omit<CTA, 'id' | 'folderId' | 'createdAt'>[]>([]);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const folderHistory = searchHistory.filter(s => s.folderId === selectedFolderId);
  const latestInsights = folderHistory[folderHistory.length - 1]?.insights;

  const handleGenerate = async () => {
    if (!selectedFolder) return;
    
    setIsGenerating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const mockCTAs = generateMockCTAs(selectedFolder.name);
    setGeneratedCTAs(mockCTAs);
    setIsGenerating(false);
  };

  const handleSaveCTA = (cta: Omit<CTA, 'id' | 'folderId' | 'createdAt'>, index: number) => {
    if (!selectedFolderId) return;
    
    const newCTA: CTA = {
      ...cta,
      id: `cta-${Date.now()}-${index}`,
      folderId: selectedFolderId,
      createdAt: new Date(),
    };
    
    setCTAs([...ctas, newCTA]);
  };

  const handleDuplicate = (cta: Omit<CTA, 'id' | 'folderId' | 'createdAt'>) => {
    setGeneratedCTAs([...generatedCTAs, { ...cta }]);
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
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-accent-foreground" />
            </div>
            {t.campaigns.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.campaigns.subtitle}</p>
        </div>
      </div>

      {/* Folder Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t.campaigns.selectNiche}</label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha um nicho do CRM" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name} ({folder.leadCount} leads)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="gradientAccent"
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedFolderId || isGenerating}
              className="sm:mt-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.campaigns.generating}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t.campaigns.generateStrategies}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No Folders Warning */}
      {folders.length === 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-warning" />
            <h3 className="font-semibold mb-2">Nenhum nicho disponível</h3>
            <p className="text-muted-foreground mb-4">
              Crie pastas no CRM primeiro para gerar campanhas
            </p>
            <Link to="/crm">
              <Button variant="warning">Ir para CRM</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Insights Preview */}
      {selectedFolderId && latestInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {t.campaigns.insights} - {selectedFolder?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-warning/10">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  {t.campaigns.pains}
                </h4>
                <ul className="space-y-1">
                  {latestInsights.pains.slice(0, 2).map((pain, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {pain}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-info/10">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-info" />
                  {t.campaigns.trends}
                </h4>
                <ul className="space-y-1">
                  {latestInsights.trends.slice(0, 2).map((trend, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {trend}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-primary/10">
                <h4 className="font-medium text-sm mb-2">{t.campaigns.urgency}</h4>
                <Badge variant={urgencyVariant[latestInsights.urgency]} className="mb-2">
                  {t.common[latestInsights.urgency]}
                </Badge>
                <p className="text-sm text-muted-foreground">{latestInsights.urgencyReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated CTAs */}
      {generatedCTAs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">CTAs Gerados</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {generatedCTAs.map((cta, index) => (
              <Card key={index} variant="elevated" className="overflow-hidden">
                {/* Image Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-lg mb-2">{cta.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{cta.text}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => handleSaveCTA(cta, index)}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {t.campaigns.saveCTA}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(cta)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {t.campaigns.duplicate}
                    </Button>
                    <Link to="/messaging">
                      <Button variant="secondary" size="sm">
                        <Send className="w-4 h-4 mr-1" />
                        {t.campaigns.useCTA}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedFolderId && generatedCTAs.length === 0 && !isGenerating && (
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pronto para criar campanhas?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Clique em "Gerar Estratégias" para criar 3 CTAs persuasivos com IA para o nicho selecionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Campaigns;
