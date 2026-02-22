

# Correcao Definitiva - Meta OAuth Session Issue

## Problema Raiz

O fluxo OAuth abre uma nova aba (`window.open`). Quando o Facebook redireciona de volta, o cliente Supabase na nova aba precisa recuperar a sessao do `localStorage` de forma assincrona. Porem, o `MetaOAuthCallback` chama `supabase.functions.invoke` imediatamente no `useEffect`, ANTES da sessao ser inicializada. Isso faz com que nenhum token de autenticacao seja enviado, e a edge function retorna 401 silenciosamente (sem logs).

## Solucao (3 alteracoes)

### 1. MetaOAuthCallback - Aguardar sessao antes de chamar a funcao

Modificar `src/pages/MetaOAuthCallback.tsx` para esperar a sessao do Supabase ser recuperada antes de invocar a edge function. Usar `supabase.auth.onAuthStateChange` para detectar quando a sessao esta pronta, com um timeout de seguranca.

```typescript
useEffect(() => {
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) { /* ... mesmo tratamento ... */ return; }
  if (!code) { /* ... mesmo tratamento ... */ return; }

  const exchangeCode = async () => {
    try {
      // Aguardar a sessao ser recuperada do localStorage
      let session = (await supabase.auth.getSession()).data.session;
      
      if (!session) {
        // Esperar até 5 segundos pela recuperação da sessão
        session = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, sess) => {
              if (sess) {
                clearTimeout(timeout);
                subscription.unsubscribe();
                resolve(sess);
              }
            }
          );
        });
      }

      if (!session) {
        throw new Error(
          pt ? 'Sessão expirada. Faça login novamente.' 
             : 'Session expired. Please log in again.'
        );
      }

      const redirectUri = 'https://r3cfaileads.lovable.app/meta-oauth-callback';
      const { data, error: fnError } = await supabase.functions.invoke('meta-oauth', {
        body: { code, redirect_uri: redirectUri },
      });
      // ... resto do tratamento igual ...
    } catch (err) { /* ... */ }
  };

  exchangeCode();
}, [searchParams, navigate, pt]);
```

### 2. Edge Function - Adicionar logs de debug

Modificar `supabase/functions/meta-oauth/index.ts` para adicionar `console.log` nos pontos criticos, permitindo diagnosticar problemas futuros:

- Log quando recebe requisicao (metodo, tem auth header ou nao)
- Log quando getUser falha (com o erro especifico)
- Log quando troca de token com Facebook falha/sucede

### 3. MetaLeadAdsConnection - Usar window.location.href

Modificar `src/components/settings/MetaLeadAdsConnection.tsx` para usar `window.location.href` em vez de `window.open`. Isso navega a mesma aba, preservando a sessao no localStorage quando o Facebook redireciona de volta para o mesmo dominio.

```typescript
const handleConnect = () => {
  const redirectUri = 'https://r3cfaileads.lovable.app/meta-oauth-callback';
  const scope = 'pages_show_list,leads_retrieval,pages_manage_ads,pages_read_engagement';
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  window.location.href = authUrl;
};
```

Nota: `window.location.href` funciona corretamente na URL publicada (`r3cfaileads.lovable.app`). No preview do Lovable, o Facebook pode bloquear o iframe, mas o teste deve ser feito pela URL publicada.

## Resumo das alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/MetaOAuthCallback.tsx` | Aguardar sessao com `onAuthStateChange` + timeout |
| `supabase/functions/meta-oauth/index.ts` | Adicionar console.log nos pontos criticos |
| `src/components/settings/MetaLeadAdsConnection.tsx` | Trocar `window.open` por `window.location.href` |

