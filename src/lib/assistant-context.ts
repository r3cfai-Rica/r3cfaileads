// Contexto específico por página para o assistente AI

export interface PageContext {
  page: string;
  title: string;
  description: string;
  suggestions: string[];
  helpTopics: string[];
}

export const getPageContext = (pathname: string, language: 'pt-BR' | 'en-US'): PageContext => {
  const isPtBR = language === 'pt-BR';

  const contexts: Record<string, PageContext> = {
    '/dashboard': {
      page: 'dashboard',
      title: isPtBR ? 'Dashboard' : 'Dashboard',
      description: isPtBR 
        ? 'Visão geral das suas métricas de vendas, leads e campanhas.'
        : 'Overview of your sales metrics, leads and campaigns.',
      suggestions: isPtBR
        ? ['O que significam essas métricas?', 'Como aumentar minhas conversões?', 'Qual o próximo passo?']
        : ['What do these metrics mean?', 'How to increase conversions?', 'What\'s the next step?'],
      helpTopics: isPtBR
        ? ['taxa de conversão', 'leads ativos', 'métricas de vendas', 'KPIs']
        : ['conversion rate', 'active leads', 'sales metrics', 'KPIs'],
    },
    '/prospecting': {
      page: 'prospecting',
      title: isPtBR ? 'Prospecção' : 'Prospecting',
      description: isPtBR
        ? 'Busque novos leads por nicho, localização e sinais de intenção.'
        : 'Search for new leads by niche, location and intent signals.',
      suggestions: isPtBR
        ? ['Como buscar leads?', 'Qual nicho devo prospectar?', 'Dicas de filtros']
        : ['How to search leads?', 'Which niche to prospect?', 'Filter tips'],
      helpTopics: isPtBR
        ? ['buscar leads', 'filtros de prospecção', 'sinais de intenção', 'nichos rentáveis']
        : ['search leads', 'prospecting filters', 'intent signals', 'profitable niches'],
    },
    '/crm': {
      page: 'crm',
      title: 'CRM',
      description: isPtBR
        ? 'Gerencie seus leads, organize em pastas e acompanhe o status de cada um.'
        : 'Manage your leads, organize in folders and track each status.',
      suggestions: isPtBR
        ? ['Como organizar meus leads?', 'Qual lead priorizar?', 'Criar pastas por segmento']
        : ['How to organize leads?', 'Which lead to prioritize?', 'Create segment folders'],
      helpTopics: isPtBR
        ? ['gerenciar leads', 'organizar pastas', 'status de leads', 'priorização']
        : ['manage leads', 'organize folders', 'lead status', 'prioritization'],
    },
    '/campaigns': {
      page: 'campaigns',
      title: isPtBR ? 'Campanhas' : 'Campaigns',
      description: isPtBR
        ? 'Crie CTAs e materiais de marketing para suas campanhas.'
        : 'Create CTAs and marketing materials for your campaigns.',
      suggestions: isPtBR
        ? ['Como criar um CTA eficaz?', 'Gerar imagens para campanha', 'Dicas de copywriting']
        : ['How to create effective CTA?', 'Generate campaign images', 'Copywriting tips'],
      helpTopics: isPtBR
        ? ['criar CTAs', 'copywriting', 'imagens de marketing', 'campanhas de vendas']
        : ['create CTAs', 'copywriting', 'marketing images', 'sales campaigns'],
    },
    '/messaging': {
      page: 'messaging',
      title: isPtBR ? 'Mensagens' : 'Messaging',
      description: isPtBR
        ? 'Envie mensagens personalizadas por Email, SMS ou WhatsApp.'
        : 'Send personalized messages via Email, SMS or WhatsApp.',
      suggestions: isPtBR
        ? ['Criar email de prospecção', 'Template de mensagem fria', 'Qual canal usar?']
        : ['Create prospecting email', 'Cold message template', 'Which channel to use?'],
      helpTopics: isPtBR
        ? ['cold email', 'template de mensagem', 'WhatsApp Business', 'SMS marketing']
        : ['cold email', 'message template', 'WhatsApp Business', 'SMS marketing'],
    },
    '/inbox': {
      page: 'inbox',
      title: isPtBR ? 'Caixa de Entrada' : 'Inbox',
      description: isPtBR
        ? 'Veja e responda todas as conversas com leads em um único lugar.'
        : 'View and reply to all conversations with leads in one place.',
      suggestions: isPtBR
        ? ['Como responder leads?', 'Organizar conversas', 'Templates de resposta']
        : ['How to reply to leads?', 'Organize conversations', 'Reply templates'],
      helpTopics: isPtBR
        ? ['responder mensagens', 'gerenciar conversas', 'follow-up', 'templates']
        : ['reply messages', 'manage conversations', 'follow-up', 'templates'],
    },
    '/automations': {
      page: 'automations',
      title: isPtBR ? 'Automações' : 'Automations',
      description: isPtBR
        ? 'Configure fluxos automáticos de envio e follow-up.'
        : 'Configure automatic sending and follow-up flows.',
      suggestions: isPtBR
        ? ['Criar sequência de emails', 'Automação de follow-up', 'Quando automatizar?']
        : ['Create email sequence', 'Follow-up automation', 'When to automate?'],
      helpTopics: isPtBR
        ? ['sequências automáticas', 'follow-up', 'gatilhos', 'workflow']
        : ['automatic sequences', 'follow-up', 'triggers', 'workflow'],
    },
    '/settings': {
      page: 'settings',
      title: isPtBR ? 'Configurações' : 'Settings',
      description: isPtBR
        ? 'Configure suas credenciais de envio (Email, SMS, WhatsApp).'
        : 'Configure your sending credentials (Email, SMS, WhatsApp).',
      suggestions: isPtBR
        ? ['Como configurar Email?', 'Configurar WhatsApp API', 'Setup do Twilio SMS']
        : ['How to configure Email?', 'Configure WhatsApp API', 'Twilio SMS setup'],
      helpTopics: isPtBR
        ? ['Resend API', 'Twilio', 'WhatsApp Business API', 'webhooks', 'credenciais']
        : ['Resend API', 'Twilio', 'WhatsApp Business API', 'webhooks', 'credentials'],
    },
    '/help': {
      page: 'help',
      title: isPtBR ? 'Ajuda' : 'Help',
      description: isPtBR
        ? 'Guias detalhados de configuração de WhatsApp, SMS e Email.'
        : 'Detailed configuration guides for WhatsApp, SMS and Email.',
      suggestions: isPtBR
        ? ['Configurar WhatsApp passo a passo', 'Verificar domínio Resend', 'Comprar número Twilio']
        : ['Configure WhatsApp step by step', 'Verify Resend domain', 'Buy Twilio number'],
      helpTopics: isPtBR
        ? ['webhook WhatsApp', 'DNS Resend', 'Twilio console', 'troubleshooting']
        : ['WhatsApp webhook', 'DNS Resend', 'Twilio console', 'troubleshooting'],
    },
    '/admin': {
      page: 'admin',
      title: 'Admin',
      description: isPtBR
        ? 'Painel administrativo para gerenciar usuários e monitorar uso.'
        : 'Admin panel to manage users and monitor usage.',
      suggestions: isPtBR
        ? ['Ver usuários ativos', 'Monitorar uso de créditos', 'Analisar métricas']
        : ['View active users', 'Monitor credit usage', 'Analyze metrics'],
      helpTopics: isPtBR
        ? ['gerenciar usuários', 'planos', 'créditos', 'métricas admin']
        : ['manage users', 'plans', 'credits', 'admin metrics'],
    },
    '/admin/tools': {
      page: 'admin-tools',
      title: isPtBR ? 'Ferramentas Admin' : 'Admin Tools',
      description: isPtBR
        ? 'Calculadora de custos e ferramentas de precificação Premium.'
        : 'Cost calculator and Premium pricing tools.',
      suggestions: isPtBR
        ? ['Calcular custo por cliente', 'Margem de lucro ideal', 'Precificar plano Premium']
        : ['Calculate cost per client', 'Ideal profit margin', 'Price Premium plan'],
      helpTopics: isPtBR
        ? ['calculadora custos', 'precificação', 'margem de lucro', 'Resend', 'Twilio']
        : ['cost calculator', 'pricing', 'profit margin', 'Resend', 'Twilio'],
    },
  };

  // Default context for unknown pages
  const defaultContext: PageContext = {
    page: 'general',
    title: 'LeadFlow',
    description: isPtBR
      ? 'Plataforma completa de prospecção e vendas B2B.'
      : 'Complete B2B prospecting and sales platform.',
    suggestions: isPtBR
      ? ['Como começar?', 'O que é o LeadFlow?', 'Funcionalidades disponíveis']
      : ['How to get started?', 'What is LeadFlow?', 'Available features'],
    helpTopics: isPtBR
      ? ['prospecção', 'vendas B2B', 'CRM', 'automação']
      : ['prospecting', 'B2B sales', 'CRM', 'automation'],
  };

  return contexts[pathname] || defaultContext;
};

export const buildContextualPrompt = (context: PageContext, language: 'pt-BR' | 'en-US'): string => {
  const isPtBR = language === 'pt-BR';

  if (isPtBR) {
    return `
📍 **CONTEXTO ATUAL**
O usuário está na página: **${context.title}**
Descrição: ${context.description}

🎯 **SEU PAPEL NESTA PÁGINA**
Você é um guia de configuração passo-a-passo. Seu objetivo é:
1. Entender o que o usuário quer fazer nesta página
2. Explicar as funcionalidades disponíveis
3. Guiar com passos claros e numerados
4. Oferecer dicas práticas e atalhos

📚 **TÓPICOS RELEVANTES**
${context.helpTopics.join(', ')}

💡 **ESTILO DE RESPOSTA**
- Use passos numerados (1. 2. 3.)
- Seja específico ao contexto da página "${context.title}"
- Ofereça exemplos práticos
- Termine com uma pergunta ou próximo passo sugerido`;
  }

  return `
📍 **CURRENT CONTEXT**
The user is on the page: **${context.title}**
Description: ${context.description}

🎯 **YOUR ROLE ON THIS PAGE**
You are a step-by-step configuration guide. Your goal is:
1. Understand what the user wants to do on this page
2. Explain available features
3. Guide with clear numbered steps
4. Offer practical tips and shortcuts

📚 **RELEVANT TOPICS**
${context.helpTopics.join(', ')}

💡 **RESPONSE STYLE**
- Use numbered steps (1. 2. 3.)
- Be specific to the "${context.title}" page context
- Offer practical examples
- End with a question or suggested next step`;
};
