

# Correcao - Facebook retornando 0 paginas

## Problema

A API `me/accounts` do Facebook retorna `{"data":[]}` mesmo com a conta tendo a pagina "R3CF.ai". Isso acontece porque:

1. Durante o dialogo OAuth do Facebook, ha uma etapa onde o usuario seleciona quais paginas compartilhar. Se as paginas nao foram marcadas, a API retorna vazio.
2. A pagina e gerenciada pelo Business Manager, e pode precisar do escopo `business_management` para ser listada.
3. O parametro `auth_type=rerequest` pode ser necessario para forcar o Facebook a reapresentar a tela de selecao de paginas.

## Solucao (2 alteracoes)

### 1. Frontend - Adicionar escopos e forcar re-autorizacao

**Arquivo:** `src/components/settings/MetaLeadAdsConnection.tsx`

- Adicionar `business_management` e `pages_manage_metadata` aos escopos solicitados
- Adicionar `auth_type=rerequest` na URL do OAuth para forcar a reapresentacao da tela de selecao de paginas (caso o usuario ja tenha autorizado antes sem selecionar paginas)

```typescript
const handleConnect = () => {
  const redirectUri = 'https://r3cfaileads.lovable.app/meta-oauth-callback';
  const scope = 'pages_show_list,leads_retrieval,pages_manage_ads,pages_read_engagement,business_management,pages_manage_metadata';
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&auth_type=rerequest`;
  window.location.href = authUrl;
};
```

### 2. Edge Function - Melhorar mensagem de erro e tentar endpoint alternativo

**Arquivo:** `supabase/functions/meta-oauth/index.ts`

Quando `me/accounts` retorna 0 paginas, tentar tambem o endpoint `me/accounts` com o campo `tasks` para verificar se ha paginas com permissoes limitadas. Tambem melhorar a mensagem de erro para orientar o usuario:

- Se 0 paginas forem encontradas, retornar uma mensagem clara explicando que o usuario precisa selecionar as paginas durante o dialogo de autorizacao
- Adicionar log do token (primeiros 10 caracteres) para debug
- Sugerir ao usuario tentar novamente e selecionar todas as paginas na tela do Facebook

## Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/settings/MetaLeadAdsConnection.tsx` | Adicionar escopos `business_management` e `pages_manage_metadata` + parametro `auth_type=rerequest` |
| `supabase/functions/meta-oauth/index.ts` | Melhorar mensagem de erro quando 0 paginas sao encontradas, orientando o usuario a selecionar as paginas |

## Resultado esperado

Ao clicar em "Conectar com Facebook" novamente, o Facebook vai reapresentar a tela de autorizacao com a opcao de selecionar paginas. Com os escopos adicionais (`business_management`), paginas gerenciadas pelo Business Manager tambem serao listadas. Se ainda assim retornar 0 paginas, a mensagem de erro vai orientar o usuario sobre o que fazer.

