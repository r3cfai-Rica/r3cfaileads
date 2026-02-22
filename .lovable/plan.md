

# Correcao Definitiva - Meta Lead Ads OAuth

## Problema Raiz

Existem dois problemas impedindo a conexao:

1. **Facebook bloqueia iframes**: Quando o usuario testa pelo preview do Lovable, o `window.location.href` tenta navegar o iframe para o Facebook, que recusa a conexao (X-Frame-Options). O fluxo OAuth nunca chega a acontecer.

2. **Redirect URI inconsistente**: O codigo usa `window.location.origin` para montar a redirect_uri. No preview, isso gera uma URL diferente da registrada no Meta Developer Portal (`https://r3cfaileads.lovable.app`). O Facebook rejeita a redirect_uri por nao estar na whitelist.

## Solucao

### 1. Corrigir `src/components/settings/MetaLeadAdsConnection.tsx`

- **Fixar a redirect_uri** para sempre usar a URL publicada (`https://r3cfaileads.lovable.app/meta-oauth-callback`), garantindo consistencia com o Meta Developer Portal
- **Abrir o fluxo OAuth em uma nova aba** usando `window.open(authUrl, '_blank')` em vez de `window.location.href`, resolvendo o problema de iframe

### 2. Corrigir `src/pages/MetaOAuthCallback.tsx`

- **Fixar a redirect_uri** enviada para a edge function para sempre usar a URL publicada, garantindo que corresponda exatamente ao que foi enviado ao Facebook na etapa anterior

## Detalhes Tecnicos

### MetaLeadAdsConnection.tsx - handleConnect

```typescript
const handleConnect = () => {
  const redirectUri = 'https://r3cfaileads.lovable.app/meta-oauth-callback';
  const scope = 'pages_show_list,leads_retrieval,pages_manage_ads,pages_read_engagement';
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  window.open(authUrl, '_blank');
};
```

### MetaOAuthCallback.tsx - exchangeCode

```typescript
const redirectUri = 'https://r3cfaileads.lovable.app/meta-oauth-callback';
// em vez de: const redirectUri = `${window.location.origin}/meta-oauth-callback`;
```

Isso garante que a `redirect_uri` seja identica em ambas as etapas do fluxo OAuth (autorizacao e troca de codigo), e que corresponda exatamente a URL registrada no Meta Developer Portal.

