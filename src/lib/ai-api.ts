import { supabase } from '@/integrations/supabase/client';
import { Lead, NicheInsights, CTA } from '@/contexts/AppContext';

interface GenerateLeadsParams {
  niche: string;
  country: string;
  city: string;
  postalCode: string;
  language: 'pt-BR' | 'en-US';
}

interface GenerateLeadsResponse {
  leads: Lead[];
  insights: NicheInsights;
}

interface GenerateCTAsParams {
  niche: string;
  insights?: NicheInsights;
  companyName?: string;
  messageTone: string;
  imageFormat: string;
  language: 'pt-BR' | 'en-US';
}

interface GeneratedCTA {
  title: string;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
}

interface GenerateCTAsResponse {
  ctas: GeneratedCTA[];
}

export async function generateLeadsWithAI(params: GenerateLeadsParams): Promise<GenerateLeadsResponse> {
  const { data, error } = await supabase.functions.invoke('generate-leads', {
    body: params
  });

  if (error) {
    console.error('Error calling generate-leads:', error);
    throw new Error(error.message || 'Failed to generate leads');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    leads: data.leads.map((lead: any) => ({
      ...lead,
      createdAt: new Date(lead.createdAt),
    })),
    insights: data.insights,
  };
}

export async function generateCTAsWithAI(params: GenerateCTAsParams): Promise<GeneratedCTA[]> {
  const { data, error } = await supabase.functions.invoke('generate-ctas', {
    body: params
  });

  if (error) {
    console.error('Error calling generate-ctas:', error);
    throw new Error(error.message || 'Failed to generate CTAs');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.ctas;
}

export async function generateImageWithAI(prompt: string, format: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-images', {
    body: { prompt, format }
  });

  if (error) {
    console.error('Error calling generate-images:', error);
    throw new Error(error.message || 'Failed to generate image');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.imageUrl;
}
