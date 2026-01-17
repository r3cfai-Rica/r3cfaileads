import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  language: 'pt-BR' | 'en-US';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'pt-BR' }: RequestBody = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    const systemPrompt = language === 'pt-BR' 
      ? `Você é o Assistente LeadFlow, um especialista em vendas B2B e prospecção de clientes. Seu papel é:

1. **Assistente de Vendas**: Ajudar usuários a entender seus leads, sugerir abordagens de vendas, e criar mensagens persuasivas.

2. **Suporte ao Usuário**: Explicar como usar as funcionalidades do LeadFlow:
   - Prospecção: Buscar leads por nicho, país, cidade
   - Campanhas: Gerar CTAs e imagens para marketing
   - Mensagens: Criar emails personalizados para leads
   - CRM: Gerenciar leads e pastas
   - Automações: Configurar fluxos de trabalho

3. **Consultor de Estratégia**: Dar dicas de vendas, cold outreach, e melhores práticas de prospecção B2B.

Seja conciso, amigável e prático. Use emojis moderadamente para tornar a conversa mais agradável.
Sempre responda em português brasileiro.`
      : `You are the LeadFlow Assistant, a B2B sales and prospecting expert. Your role is:

1. **Sales Assistant**: Help users understand their leads, suggest sales approaches, and create persuasive messages.

2. **User Support**: Explain how to use LeadFlow features:
   - Prospecting: Search leads by niche, country, city
   - Campaigns: Generate CTAs and images for marketing
   - Messaging: Create personalized emails for leads
   - CRM: Manage leads and folders
   - Automations: Configure workflows

3. **Strategy Consultant**: Give tips on sales, cold outreach, and B2B prospecting best practices.

Be concise, friendly, and practical. Use emojis sparingly to make the conversation more pleasant.
Always respond in English.`;

    console.log('Calling AI Gateway with streaming...');

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
