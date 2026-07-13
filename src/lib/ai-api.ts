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

export async function generateLeadsWithAI(params: GenerateLeadsParams & { useRealData?: boolean }): Promise<GenerateLeadsResponse> {
  const functionName = params.useRealData ? 'generate-leads-google' : 'generate-leads';
  
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: params
  });

  if (error) {
    console.error(`Error calling ${functionName}:`, error);
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

interface GenerateEmailParams {
  niche: string;
  leadName: string;
  leadPosition?: string;
  leadCompany?: string;
  cta?: {
    title: string;
    text: string;
  };
  senderName: string;
  senderCompany: string;
  tone: 'formal' | 'casual' | 'persuasive' | 'friendly';
  language: 'pt-BR' | 'en-US';
}

export interface GeneratedEmail {
  subject: string;
  greeting: string;
  body: string;
  signature: string;
  previewText: string;
}

interface GenerateLeadsByInterestParams {
  interest: string;
  country: string;
  city: string;
  language: 'pt-BR' | 'en-US';
  useRealData?: boolean;
}

export async function generateLeadsByInterest(params: GenerateLeadsByInterestParams): Promise<GenerateLeadsResponse> {
  const functionName = params.useRealData ? 'generate-leads-interest' : 'generate-leads-interest-demo';

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: params
  });

  if (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw new Error(error.message || 'Failed to generate leads by interest');
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
interface GenerateLeadsPersonParams {
  query: string;
  country?: string;
  city?: string;
  language: 'pt-BR' | 'en-US';
  profileType?: string;
}

export async function generateLeadsPerson(params: GenerateLeadsPersonParams): Promise<GenerateLeadsResponse> {
  const { data, error } = await supabase.functions.invoke('generate-leads-person', {
    body: params
  });

  if (error) {
    console.error('Error calling generate-leads-person:', error);
    throw new Error(error.message || 'Failed to generate person leads');
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


interface GenerateLeadsFromWebParams {
  query: string;
  country?: string;
  city?: string;
  language: 'pt-BR' | 'en-US';
}

export async function generateLeadsFromWeb(params: GenerateLeadsFromWebParams): Promise<GenerateLeadsResponse> {
  const { data, error } = await supabase.functions.invoke('generate-leads-web', {
    body: params
  });

  if (error) {
    console.error('Error calling generate-leads-web:', error);
    throw new Error(error.message || 'Failed to generate leads from web');
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

export async function generateEmailWithAI(params: GenerateEmailParams): Promise<GeneratedEmail> {
  const { data, error } = await supabase.functions.invoke('generate-email', {
    body: params
  });

  if (error) {
    console.error('Error calling generate-email:', error);
    throw new Error(error.message || 'Failed to generate email');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.email;
}
