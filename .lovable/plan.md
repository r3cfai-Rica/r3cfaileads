

# Correcao do Erro na Conexao Meta Lead Ads

## Problema Identificado

A edge function `meta-oauth` usa o metodo `supabaseUser.auth.getClaims(token)`, que nao existe na versao 2 do supabase-js. Isso faz a funcao falhar silenciosamente (sem logs), retornando um erro generico para o frontend.

## Solucao

Substituir `getClaims(token)` por `getUser()` na edge function `meta-oauth`. O metodo `getUser()` valida o token JWT e retorna os dados do usuario autenticado, incluindo o `id` (equivalente ao `sub` do JWT).

## Alteracoes

### 1. Corrigir `supabase/functions/meta-oauth/index.ts`

Substituir o bloco de autenticacao (linhas 31-39):

**De:**
```typescript
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { ... });
}
const userId = claimsData.claims.sub;
```

**Para:**
```typescript
const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
if (userError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { ... });
}
const userId = user.id;
```

Nenhuma outra alteracao e necessaria. O restante do fluxo (troca de token, busca de paginas, salvamento) permanece igual.

