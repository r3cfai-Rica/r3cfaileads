

# Correcao Definitiva - Meta OAuth Error Handling

## Diagnostico

Os logs da edge function mostram que a autenticacao funciona perfeitamente ("authenticated user 2972f3cf..."), mas NENHUM log aparece depois disso. Isso indica que:

1. A chamada ao Facebook API provavelmente retorna um erro (codigo ja usado, expirado, ou redirect_uri inconsistente)
2. Os `console.error` existentes nao estao aparecendo nos logs (possivelmente por limitacao do viewer)
3. O frontend mostra apenas "Edge Function returned a non-2xx status code" - uma mensagem generica do cliente Supabase - sem extrair o erro real retornado pela funcao

## Solucao (2 alteracoes)

### 1. Edge Function - Logging completo em CADA etapa

Adicionar `console.log` (nao `console.error`) em TODAS as etapas para garantir visibilidade nos logs:

- Log do code e redirect_uri recebidos
- Log antes e depois de cada chamada ao Facebook API
- Log do status HTTP e body de cada resposta do Facebook
- Log de cada etapa de salvamento no banco

Isso vai permitir diagnosticar exatamente onde o fluxo falha.

### 2. Frontend - Extrair erro real da resposta

O `supabase.functions.invoke` retorna um `FunctionsHttpError` generico quando a funcao retorna non-2xx. O erro real esta no `error.context` (um objeto Response). O frontend precisa extrair esse erro:

```typescript
const { data, error: fnError } = await supabase.functions.invoke('meta-oauth', {
  body: { code, redirect_uri: redirectUri },
});

if (fnError) {
  let errorMessage = fnError.message;
  try {
    if (fnError.context) {
      const errorBody = await fnError.context.json();
      errorMessage = errorBody?.error || errorMessage;
    }
  } catch {}
  throw new Error(errorMessage);
}
```

Isso fara com que o usuario veja a mensagem real do erro (ex: "This authorization code has been used" ou "Invalid redirect_uri") em vez da mensagem generica.

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/meta-oauth/index.ts` | Adicionar console.log detalhado em cada etapa do fluxo |
| `src/pages/MetaOAuthCallback.tsx` | Extrair mensagem de erro real do FunctionsHttpError |

## Resultado esperado

Apos essas alteracoes:
- O usuario vera a mensagem de erro REAL do Facebook (nao mais "Edge Function returned a non-2xx status code")
- Os logs mostrarao exatamente em qual etapa o fluxo falha
- Sera possivel diagnosticar e corrigir o problema raiz (provavelmente codigo expirado ou redirect_uri inconsistente no portal da Meta)

