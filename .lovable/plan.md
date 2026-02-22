

# Busca de Leads por Interesses/Comportamento

## O que sera implementado

Uma nova aba de busca **"Por Interesses"** na pagina de prospecao que permite encontrar leads com base em interesses e comportamento, nao apenas localizacao no Google Maps.

**Exemplo de uso:** "pessoas interessadas em fitness em Sao Paulo" encontra academias, lojas de suplementos, estúdios de yoga, lojas de roupas esportivas -- ou seja, negocios cujos clientes tem esse interesse.

## Como funciona (dados reais para Premium)

A busca por interesses usa o **mesmo Google Places API** como fonte de dados reais, mas com uma camada de IA diferente:

```text
Busca B2B atual (Maps):
  Input: "O que voce vende" + cidade
  IA: Identifica compradores do servico
  Google Places: Busca esses compradores

Busca por Interesses (NOVO):
  Input: "Interesse/comportamento do publico-alvo" + regiao (opcional)
  IA: Traduz interesse em tipos de negocios relacionados
  Google Places: Busca esses negocios (dados reais)
  IA: Classifica e qualifica por relevancia ao interesse
```

Premium = dados reais do Google Places (regra mantida).
Free = dados de demonstracao via IA (igual ao B2B free).

## Alteracoes

### 1. Nova Edge Function: `supabase/functions/generate-leads-interest/index.ts`

- Recebe: `interest` (descricao do interesse), `country`, `city` (opcional), `language`
- Passo 1: IA converte interesse em 3-5 termos de busca Google Places
  - Ex: "fitness" -> "academias", "lojas de suplementos", "studios de pilates", "crossfit box"
- Passo 2: Busca no Google Places API (dados reais)
- Passo 3: IA classifica cada resultado por relevancia ao interesse (alta/media/baixa)
- Passo 4: Gera insights de mercado focados no interesse
- Autenticacao e rate limiting iguais ao `generate-leads-google`

### 2. Nova Edge Function Free: `supabase/functions/generate-leads-interest-demo/index.ts`

- Versao demo para usuarios Free (gera leads ficticios via IA)
- Mesmo formato de resposta, mas sem Google Places

### 3. Frontend: `src/lib/ai-api.ts`

- Nova funcao `generateLeadsByInterest()` que chama a edge function correta (demo para free, real para premium)

### 4. Frontend: `src/pages/Prospecting.tsx`

- Novo tipo de lead: `'b2b' | 'b2c' | 'interest' | 'both'`
- Novo botao no seletor: **"Por Interesses"** com icone `Target`
- Formulario diferente quando selecionado:
  - Campo principal: "Descreva o interesse do seu publico-alvo" (ex: "pessoas que praticam yoga")
  - Pais (obrigatorio)
  - Cidade (opcional - interesses podem ser mais amplos)
  - Sem CEP (nao faz sentido para interesses)
- Resultados mostram badge **"Interesse"** roxo para diferenciar
- Coluna de relevancia ao interesse (alta/media/baixa)

### 5. Atualizacao do estado persistido

- Adicionar `'interest'` ao tipo `leadType` no `ProspectingState`
- Persistir resultados de busca por interesse separadamente

## Detalhes Tecnicos

### Edge Function `generate-leads-interest` (Premium)

```text
Entrada:
  interest: "pessoas interessadas em fitness"
  country: "Brasil"
  city: "Sao Paulo" (opcional)
  language: "pt-BR"

Passo 1 - IA traduz interesse em termos de busca:
  Prompt: "O publico-alvo tem interesse em 'fitness'.
   Que tipos de negocios atendem esse publico?
   Retorne termos de busca para Google Maps."
  Resultado: ["academias Sao Paulo", "lojas suplementos Sao Paulo", ...]

Passo 2 - Google Places API:
  Busca cada termo, coleta ate 15 negocios reais

Passo 3 - IA classifica relevancia:
  Para cada negocio, avalia se atende diretamente o interesse
  Adiciona intentSignal especifico ao interesse

Passo 4 - Insights:
  Gera insights focados no interesse (dores, tendencias)

Saida: { leads: [...], insights: {...} }
```

### Diferenciacao visual na UI

| Tipo | Badge | Icone | Cor |
|------|-------|-------|-----|
| B2B (Maps) | Maps | Building2 | Azul |
| Por Interesses | Interesse | Target | Roxo |
| B2C (Opt-in) | Opt-in | UserCircle | Verde |

## Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/generate-leads-interest/index.ts` | CRIAR - busca real por interesses (Premium) |
| `supabase/functions/generate-leads-interest-demo/index.ts` | CRIAR - busca demo por interesses (Free) |
| `src/lib/ai-api.ts` | MODIFICAR - adicionar `generateLeadsByInterest()` |
| `src/pages/Prospecting.tsx` | MODIFICAR - nova aba "Por Interesses" com formulario e resultados |

## Resultado esperado

O usuario tera 3 modos de busca:
1. **B2B (Maps)** - busca por nicho + localizacao (ja existe)
2. **Por Interesses** - busca por comportamento/interesse do publico-alvo (NOVO)
3. **B2C (Opt-in)** - CSV, Meta Lead Ads (ja existe)

Todos com dados reais para Premium, demonstracao para Free.

