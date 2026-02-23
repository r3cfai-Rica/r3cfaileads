

# Busca de Leads na Web/Internet (Perplexity AI Search)

## Objetivo

Criar um **4o modo de busca** na prospecao que pesquisa leads reais em toda a internet (sites, redes sociais, diretorios, blogs, noticias) usando o Perplexity AI Search -- nao limitado ao Google Maps.

## Diferenca dos modos existentes

```text
Modo 1 - B2B (Maps):     Google Places API -> negocios locais
Modo 2 - Por Interesses: Google Places API -> negocios por interesse
Modo 3 - B2C (Opt-in):   CSV, Meta Lead Ads -> leads passivos

Modo 4 - Busca Web (NOVO):
  Input: "clinicas de estetica que postam no Instagram em Sao Paulo"
  Perplexity: busca na web inteira (sites, redes sociais, diretorios)
  IA: extrai e estrutura leads reais dos resultados
  Output: leads com nome, site, telefone, fonte verificavel
```

## Como funciona

1. Usuario digita uma busca livre (ex: "estúdios de tatuagem em Curitiba com Instagram ativo")
2. Edge function usa Perplexity API para buscar na web real
3. IA (Gemini) processa os resultados e extrai leads estruturados (nome, contato, site, fonte)
4. Cada lead vem com link da fonte original (verificavel)

Premium = busca real via Perplexity (dados verificaveis da web).
Free = nao disponivel (ou versao demo limitada).

## Pre-requisito

Conectar o **Perplexity** ao projeto via conector. Isso disponibiliza a `PERPLEXITY_API_KEY` nas edge functions.

## Alteracoes

### 1. Nova Edge Function: `supabase/functions/generate-leads-web/index.ts`

- Recebe: `query` (busca livre), `country`, `city` (opcional), `language`
- Passo 1: Perplexity busca na web com o query do usuario
  - Usa modelo `sonar-pro` para resultados com citacoes
  - Filtra por regiao se informada
- Passo 2: IA (Gemini) extrai leads estruturados dos resultados
  - Nome do negocio/pessoa
  - Site, telefone, email (se encontrados nos resultados)
  - Fonte original (URL da citacao do Perplexity)
  - Sinal de intencao baseado no contexto encontrado
- Passo 3: Gera insights de mercado
- Autenticacao JWT igual as outras functions

### 2. Frontend: `src/lib/ai-api.ts`

- Nova funcao `generateLeadsFromWeb()` que chama `generate-leads-web`

### 3. Frontend: `src/pages/Prospecting.tsx`

- Novo tipo de lead: adicionar `'web'` ao tipo existente
- Novo botao no seletor: **"Busca Web"** com icone `Globe`
- Formulario:
  - Campo de busca livre: "Descreva o que procura" (ex: "restaurantes veganos com delivery em Porto Alegre")
  - Pais (opcional)
  - Cidade (opcional)
  - Badge **Premium** no botao (somente Premium)
- Resultados mostram badge **"Web"** laranja
- Cada lead mostra a fonte/URL de onde foi encontrado

### 4. Estado persistido

- Adicionar campos `webQuery`, `webResults`, `webInsights`, `selectedWebLeads` ao `ProspectingState`

## Detalhes Tecnicos

### Edge Function `generate-leads-web`

```text
Entrada:
  query: "academias de crossfit com Instagram ativo em BH"
  country: "Brasil" (opcional)
  city: "Belo Horizonte" (opcional)
  language: "pt-BR"

Passo 1 - Perplexity Search:
  Modelo: sonar-pro (multi-step com citacoes)
  Query formatada com contexto de prospeccao
  Retorna: texto com citacoes [1], [2], etc. + array de URLs

Passo 2 - Gemini extrai leads:
  Prompt: "Extraia negocios/leads dos resultados abaixo.
   Para cada um retorne: nome, site, telefone, email, descricao, fonte."
  Resultado: array de leads estruturados

Passo 3 - Insights de mercado

Saida: { leads: [...], insights: {...} }
```

### Diferenciacao visual atualizada

| Tipo | Badge | Icone | Cor |
|------|-------|-------|-----|
| B2B (Maps) | Maps | Building2 | Azul |
| Por Interesses | Interesse | Target | Roxo |
| Busca Web | Web | Globe | Laranja |
| B2C (Opt-in) | Opt-in | UserCircle | Verde |

### Vantagens sobre Google Maps

- Encontra negocios que NAO estao no Google Maps
- Pega informacoes de redes sociais (Instagram, LinkedIn, Facebook)
- Encontra negocios menores, freelancers, profissionais autonomos
- Busca por contexto especifico (ex: "que fazem delivery", "com avaliacao positiva")
- Fontes verificaveis com links

## Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/generate-leads-web/index.ts` | CRIAR - busca real na web via Perplexity + Gemini |
| `src/lib/ai-api.ts` | MODIFICAR - adicionar `generateLeadsFromWeb()` |
| `src/pages/Prospecting.tsx` | MODIFICAR - nova aba "Busca Web" com formulario e resultados |

## Passo inicial obrigatorio

Antes de implementar, sera necessario **conectar o Perplexity** ao projeto para disponibilizar a API key nas edge functions.

