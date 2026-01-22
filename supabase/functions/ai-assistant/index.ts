import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PageContext {
  page: string;
  title: string;
  description: string;
  helpTopics: string[];
}

interface RequestBody {
  messages: Message[];
  language: 'pt-BR' | 'en-US';
  pageContext?: PageContext;
}

// Build contextual system prompt based on current page
const buildSystemPrompt = (language: 'pt-BR' | 'en-US', pageContext?: PageContext): string => {
  const isPtBR = language === 'pt-BR';

  // Base prompt
  const basePrompt = isPtBR
    ? `Você é o **Guia de Configuração LeadFlow**, um assistente especializado em ajudar usuários a configurar e usar a plataforma de vendas B2B.

## Seu Estilo
- Responda SEMPRE em português brasileiro
- Use passos numerados (1. 2. 3.) para instruções
- Seja conciso e direto ao ponto
- Use emojis moderadamente (✅ 📍 💡 ⚠️)
- Termine com uma pergunta ou próximo passo sugerido

## Funcionalidades do LeadFlow
- **Prospecção**: Buscar leads por nicho, país, cidade
- **CRM**: Gerenciar leads em pastas organizadas
- **Campanhas**: Criar CTAs e materiais de marketing
- **Mensagens**: Enviar emails, SMS e WhatsApp personalizados
- **Inbox**: Receber e responder conversas de todos os canais
- **Automações**: Configurar sequências de follow-up`
    : `You are the **LeadFlow Setup Guide**, an assistant specialized in helping users configure and use the B2B sales platform.

## Your Style
- Always respond in English
- Use numbered steps (1. 2. 3.) for instructions
- Be concise and to the point
- Use emojis sparingly (✅ 📍 💡 ⚠️)
- End with a question or suggested next step

## LeadFlow Features
- **Prospecting**: Search leads by niche, country, city
- **CRM**: Manage leads in organized folders
- **Campaigns**: Create CTAs and marketing materials
- **Messaging**: Send personalized emails, SMS and WhatsApp
- **Inbox**: Receive and reply to conversations from all channels
- **Automations**: Configure follow-up sequences`;

  // If no page context, return base prompt
  if (!pageContext) {
    return basePrompt;
  }

  // Build contextual addition based on page
  const contextualHelp = getContextualHelp(pageContext.page, isPtBR);

  const contextSection = isPtBR
    ? `

## 📍 CONTEXTO ATUAL
O usuário está na página: **${pageContext.title}**
${pageContext.description}

## 🎯 Sua Missão Nesta Página
${contextualHelp}

## Tópicos Relevantes
${pageContext.helpTopics.join(', ')}`
    : `

## 📍 CURRENT CONTEXT
The user is on page: **${pageContext.title}**
${pageContext.description}

## 🎯 Your Mission on This Page
${contextualHelp}

## Relevant Topics
${pageContext.helpTopics.join(', ')}`;

  return basePrompt + contextSection;
};

// Get specific help based on page
const getContextualHelp = (page: string, isPtBR: boolean): string => {
  const helpMap: Record<string, { ptBR: string; enUS: string }> = {
    'dashboard': {
      ptBR: `- Explique o significado de cada métrica (taxa de conversão, leads ativos, etc.)
- Sugira ações baseadas nos números apresentados
- Indique qual próximo passo tomar para melhorar resultados`,
      enUS: `- Explain the meaning of each metric (conversion rate, active leads, etc.)
- Suggest actions based on the numbers shown
- Indicate next steps to improve results`,
    },
    'prospecting': {
      ptBR: `- Guie na busca de leads por nicho, localização
- Explique os sinais de intenção e urgência
- Dê dicas de nichos rentáveis e filtros eficientes`,
      enUS: `- Guide lead search by niche, location
- Explain intent and urgency signals
- Give tips on profitable niches and efficient filters`,
    },
    'crm': {
      ptBR: `- Ensine a organizar leads em pastas por segmento
- Explique os status de leads e como priorizá-los
- Ajude a identificar leads quentes vs frios`,
      enUS: `- Teach how to organize leads in folders by segment
- Explain lead statuses and how to prioritize them
- Help identify hot vs cold leads`,
    },
    'campaigns': {
      ptBR: `- Ajude a criar CTAs persuasivos e eficazes
- Dê dicas de copywriting para vendas
- Explique como gerar imagens de marketing`,
      enUS: `- Help create persuasive and effective CTAs
- Give copywriting tips for sales
- Explain how to generate marketing images`,
    },
    'messaging': {
      ptBR: `- Ajude a criar templates de mensagens personalizadas
- Explique qual canal usar (email vs SMS vs WhatsApp)
- Dê exemplos de cold emails eficazes`,
      enUS: `- Help create personalized message templates
- Explain which channel to use (email vs SMS vs WhatsApp)
- Give examples of effective cold emails`,
    },
    'inbox': {
      ptBR: `- Ensine a gerenciar conversas de múltiplos canais
- Sugira templates de resposta rápida
- Explique estratégias de follow-up`,
      enUS: `- Teach how to manage conversations from multiple channels
- Suggest quick reply templates
- Explain follow-up strategies`,
    },
    'automations': {
      ptBR: `- Ajude a configurar sequências de emails
- Explique quando e como automatizar follow-ups
- Dê exemplos de fluxos eficientes`,
      enUS: `- Help configure email sequences
- Explain when and how to automate follow-ups
- Give examples of efficient flows`,
    },
    'settings': {
      ptBR: `- **PRIORIDADE**: Guie passo a passo na configuração de credenciais
- Explique como configurar Resend (Email), Twilio (SMS) e WhatsApp API
- Ajude com verificação de domínio, DNS, webhooks
- Direcione para a página /help para tutoriais detalhados`,
      enUS: `- **PRIORITY**: Guide step by step in configuring credentials
- Explain how to configure Resend (Email), Twilio (SMS) and WhatsApp API
- Help with domain verification, DNS, webhooks
- Direct to /help page for detailed tutorials`,
    },
    'help': {
      ptBR: `- Você está na Central de Ajuda com guias detalhados
- Responda dúvidas específicas sobre WhatsApp API, Twilio SMS, Resend Email
- Explique configuração de webhooks, DNS, verificação de domínio
- Forneça troubleshooting para problemas comuns`,
      enUS: `- You are in the Help Center with detailed guides
- Answer specific questions about WhatsApp API, Twilio SMS, Resend Email
- Explain webhook configuration, DNS, domain verification
- Provide troubleshooting for common issues`,
    },
    'admin': {
      ptBR: `- Explique as métricas de administração
- Ajude a gerenciar usuários e planos
- Mostre como monitorar uso de créditos`,
      enUS: `- Explain administration metrics
- Help manage users and plans
- Show how to monitor credit usage`,
    },
    'admin-tools': {
      ptBR: `- Explique como usar a calculadora de custos Premium
- Ajude a calcular margem de lucro adequada
- Sugira estratégias de precificação para clientes`,
      enUS: `- Explain how to use the Premium cost calculator
- Help calculate appropriate profit margin
- Suggest pricing strategies for clients`,
    },
  };

  const help = helpMap[page];
  if (help) {
    return isPtBR ? help.ptBR : help.enUS;
  }

  // Default help
  return isPtBR
    ? `- Ajude o usuário a entender as funcionalidades disponíveis
- Guie para as páginas relevantes conforme a necessidade
- Responda dúvidas gerais sobre a plataforma`
    : `- Help the user understand available features
- Guide to relevant pages as needed
- Answer general questions about the platform`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'pt-BR', pageContext }: RequestBody = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    // Build contextual system prompt
    const systemPrompt = buildSystemPrompt(language, pageContext);

    console.log(`AI Assistant - Page: ${pageContext?.page || 'unknown'}, Language: ${language}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Entre em contato com o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in ai-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
