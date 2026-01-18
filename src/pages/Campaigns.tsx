import React, { useState } from 'react';
import { useApp, CTA } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Upload,
  Building2,
  Wand2,
  Square,
  Smartphone,
  Monitor,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateCTAsWithAI, generateImageWithAI } from '@/lib/ai-api';
import { useToast } from '@/hooks/use-toast';

interface GeneratedCTA {
  title: string;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  isLoadingImage?: boolean;
  isSaved?: boolean;
  isDuplicated?: boolean;
}

type ImageFormat = '1:1' | '9:16' | '16:9';

export const Campaigns: React.FC = () => {
  const { t, folders, ctas, setCTAs, searchHistory, user, language } = useApp();
  
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState('professional');
  const [selectedSearch, setSelectedSearch] = useState<string>('');
  const [imageFormat, setImageFormat] = useState<ImageFormat>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCTAs, setGeneratedCTAs] = useState<GeneratedCTA[]>([]);

  const translations = {
    'pt-BR': {
      brandIdentityTitle: 'Identidade Visual da Campanha',
      brandIdentityDesc: 'Configure como sua marca aparece nas artes geradas.',
      logoLabel: 'LOGO DA EMPRESA',
      companyNameLabel: 'NOME DA EMPRESA',
      companyNamePlaceholder: 'Ex: Ferrari Digital',
      messageToneLabel: 'TOM DE VOZ DAS MENSAGENS',
      prospectingConfigTitle: 'CONFIGURAÇÃO DA PROSPECÇÃO',
      imageFormatTitle: 'FORMATO DA ARTE',
      generateButton: 'Gerar Estratégias',
      emptyTitle: 'Crie Campanhas de Alto Impacto',
      emptyDesc: 'Escolha um nicho e o formato da imagem para que a IA crie materiais prontos para uso.',
      tones: {
        professional: 'Profissional / Sério',
        friendly: 'Amigável / Casual',
        urgent: 'Urgente / Direto',
        inspirational: 'Inspiracional / Motivador',
      },
    },
    'en-US': {
      brandIdentityTitle: 'Campaign Brand Identity',
      brandIdentityDesc: 'Configure how your brand appears in generated assets.',
      logoLabel: 'COMPANY LOGO',
      companyNameLabel: 'COMPANY NAME',
      companyNamePlaceholder: 'Ex: Ferrari Digital',
      messageToneLabel: 'MESSAGE TONE',
      prospectingConfigTitle: 'PROSPECTING CONFIGURATION',
      imageFormatTitle: 'IMAGE FORMAT',
      generateButton: 'Generate Strategies',
      emptyTitle: 'Create High-Impact Campaigns',
      emptyDesc: 'Choose a niche and image format so AI creates ready-to-use materials.',
      tones: {
        professional: 'Professional / Serious',
        friendly: 'Friendly / Casual',
        urgent: 'Urgent / Direct',
        inspirational: 'Inspirational / Motivational',
      },
    },
  };

  const tt = translations[language];

  // Get unique searches with leads
  const uniqueSearches = searchHistory.filter(s => s.leadsSaved > 0);

  const selectedSearchData = searchHistory.find(s => s.id === selectedSearch);
  const latestInsights = selectedSearchData?.insights;

  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!selectedSearch) return;
    
    setIsGenerating(true);
    setGeneratedCTAs([]);
    
    try {
      const searchData = searchHistory.find(s => s.id === selectedSearch);
      if (!searchData) return;

      const ctas = await generateCTAsWithAI({
        niche: searchData.niche,
        insights: searchData.insights,
        companyName: companyName || undefined,
        messageTone: messageTone,
        imageFormat: imageFormat,
        language: language,
      });

      // Set CTAs with loading state for images
      const ctasWithLoadingState: GeneratedCTA[] = ctas.map(cta => ({
        ...cta,
        isLoadingImage: true,
      }));
      setGeneratedCTAs(ctasWithLoadingState);

      toast({
        title: language === 'pt-BR' ? 'CTAs gerados com sucesso!' : 'CTAs generated successfully!',
        description: language === 'pt-BR' 
          ? 'Gerando imagens para os CTAs...'
          : 'Generating images for CTAs...',
      });

      // Generate images for each CTA
      for (let i = 0; i < ctas.length; i++) {
        try {
          const imageUrl = await generateImageWithAI(ctas[i].imagePrompt, imageFormat);
          setGeneratedCTAs(prev => 
            prev.map((cta, index) => 
              index === i ? { ...cta, imageUrl, isLoadingImage: false } : cta
            )
          );
        } catch (imgError) {
          console.error(`Error generating image ${i}:`, imgError);
          setGeneratedCTAs(prev => 
            prev.map((cta, index) => 
              index === i ? { ...cta, isLoadingImage: false } : cta
            )
          );
        }
      }
    } catch (error) {
      console.error('Error generating CTAs:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao gerar CTAs' : 'Error generating CTAs',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImage = async (index: number) => {
    const cta = generatedCTAs[index];
    if (!cta?.imagePrompt) return;

    setGeneratedCTAs(prev => 
      prev.map((c, i) => i === index ? { ...c, isLoadingImage: true } : c)
    );

    try {
      const imageUrl = await generateImageWithAI(cta.imagePrompt, imageFormat);
      setGeneratedCTAs(prev => 
        prev.map((c, i) => i === index ? { ...c, imageUrl, isLoadingImage: false } : c)
      );
    } catch (error) {
      console.error('Error regenerating image:', error);
      setGeneratedCTAs(prev => 
        prev.map((c, i) => i === index ? { ...c, isLoadingImage: false } : c)
      );
      toast({
        title: language === 'pt-BR' ? 'Erro ao gerar imagem' : 'Error generating image',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCTA = (cta: GeneratedCTA, index: number) => {
    if (!selectedSearchData?.folderId) return;
    
    const newCTA: CTA = {
      title: cta.title,
      text: cta.text,
      imageUrl: cta.imageUrl,
      id: `cta-${Date.now()}-${index}`,
      folderId: selectedSearchData.folderId,
      createdAt: new Date(),
    };
    
    setCTAs([...ctas, newCTA]);
    
    // Mark as saved
    setGeneratedCTAs(prev => 
      prev.map((c, i) => i === index ? { ...c, isSaved: true } : c)
    );
    
    toast({
      title: language === 'pt-BR' ? 'CTA salvo!' : 'CTA saved!',
      description: language === 'pt-BR' ? 'O CTA foi salvo com sucesso.' : 'The CTA was saved successfully.',
    });
  };

  const handleDuplicate = (cta: GeneratedCTA, index: number) => {
    setGeneratedCTAs([...generatedCTAs, { ...cta, isSaved: false, isDuplicated: false }]);
    
    // Show feedback animation
    setGeneratedCTAs(prev => 
      prev.map((c, i) => i === index ? { ...c, isDuplicated: true } : c)
    );
    
    // Reset duplicated state after animation
    setTimeout(() => {
      setGeneratedCTAs(prev => 
        prev.map((c, i) => i === index ? { ...c, isDuplicated: false } : c)
      );
    }, 1500);
    
    toast({
      title: language === 'pt-BR' ? 'CTA duplicado!' : 'CTA duplicated!',
      description: language === 'pt-BR' ? 'Uma cópia foi adicionada abaixo.' : 'A copy was added below.',
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const urgencyVariant = {
    low: 'urgencyLow' as const,
    medium: 'urgencyMedium' as const,
    high: 'urgencyHigh' as const,
  };

  const formatIcons = {
    '1:1': Square,
    '9:16': Smartphone,
    '16:9': Monitor,
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

      {/* Brand Identity Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{tt.brandIdentityTitle}</h2>
              <p className="text-sm text-muted-foreground">{tt.brandIdentityDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-6 items-start">
            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 text-center">
                {tt.logoLabel}
              </label>
              <label className="w-28 h-28 border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">{tt.logoLabel}</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                {tt.companyNameLabel}
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={tt.companyNamePlaceholder}
                className="h-12"
              />
            </div>

            {/* Message Tone */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                {tt.messageToneLabel}
              </label>
              <Select value={messageTone} onValueChange={setMessageTone}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">{tt.tones.professional}</SelectItem>
                  <SelectItem value="friendly">{tt.tones.friendly}</SelectItem>
                  <SelectItem value="urgent">{tt.tones.urgent}</SelectItem>
                  <SelectItem value="inspirational">{tt.tones.inspirational}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prospecting Config Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-3 flex-1">
              <Wand2 className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {tt.prospectingConfigTitle}
              </span>
              <Select value={selectedSearch} onValueChange={setSelectedSearch}>
                <SelectTrigger className="flex-1 h-12">
                  <SelectValue placeholder="Selecione uma prospecção" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSearches.map(search => (
                    <SelectItem key={search.id} value={search.id}>
                      {new Date(search.date).toLocaleDateString()} - {search.niche} ({search.leadsSaved} leads)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {tt.imageFormatTitle}
                </span>
              </div>
              <div className="flex rounded-lg border overflow-hidden">
                {(['1:1', '9:16', '16:9'] as ImageFormat[]).map((format) => {
                  const Icon = formatIcons[format];
                  return (
                    <button
                      key={format}
                      onClick={() => setImageFormat(format)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                        imageFormat === format
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {format}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="gradient"
                size="lg"
                onClick={handleGenerate}
                disabled={!selectedSearch || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.campaigns.generating}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {tt.generateButton}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Searches Warning */}
      {uniqueSearches.length === 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-warning" />
            <h3 className="font-semibold mb-2">Nenhuma prospecção disponível</h3>
            <p className="text-muted-foreground mb-4">
              Faça uma busca na Prospecção AI e salve leads primeiro
            </p>
            <Link to="/prospecting">
              <Button variant="warning">Ir para Prospecção</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Insights Preview */}
      {selectedSearch && latestInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {t.campaigns.insights} - {selectedSearchData?.niche}
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
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            CTAs Gerados com IA
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {generatedCTAs.map((cta, index) => (
              <Card key={index} variant="elevated" className="overflow-hidden">
                <div className={`bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative ${
                  imageFormat === '1:1' ? 'aspect-square' :
                  imageFormat === '9:16' ? 'aspect-[9/16] max-h-80' :
                  'aspect-video'
                }`}>
                  {cta.isLoadingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Gerando imagem...</span>
                    </div>
                  ) : cta.imageUrl ? (
                    <>
                      <img 
                        src={cta.imageUrl} 
                        alt={cta.title} 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2 opacity-80 hover:opacity-100"
                        onClick={() => handleRegenerateImage(index)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Nova imagem
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateImage(index)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Gerar imagem
                      </Button>
                    </div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-lg mb-2">{cta.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{cta.text}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={cta.isSaved ? "success" : "gradient"}
                      size="sm"
                      onClick={() => handleSaveCTA(cta, index)}
                      disabled={cta.isSaved}
                      className={`transition-all duration-300 ${
                        cta.isSaved 
                          ? 'scale-105' 
                          : 'hover:scale-105 hover:shadow-lg active:scale-95'
                      }`}
                    >
                      {cta.isSaved ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          {language === 'pt-BR' ? 'Salvo!' : 'Saved!'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          {t.campaigns.saveCTA}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(cta, index)}
                      className={`transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95 ${
                        cta.isDuplicated ? 'bg-primary/10 border-primary text-primary' : ''
                      }`}
                    >
                      {cta.isDuplicated ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          {language === 'pt-BR' ? 'Duplicado!' : 'Duplicated!'}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          {t.campaigns.duplicate}
                        </>
                      )}
                    </Button>
                    <Link to="/messaging">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
                      >
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
      {selectedSearch && generatedCTAs.length === 0 && !isGenerating && (
        <Card className="border-2 border-dashed border-muted">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                <Wand2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">{tt.emptyTitle}</h3>
              <p className="text-muted-foreground">{tt.emptyDesc}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Campaigns;
