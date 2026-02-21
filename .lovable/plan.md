
# Diagnostico da Integracao Meta Lead Ads

## Status Atual

### O que esta funcionando
- As Edge Functions `webhook-meta-leads` e `meta-oauth` estao deployadas e respondendo
- O endpoint POST do webhook funciona corretamente (testado com sucesso, retornou `{"success": true}`)
- Os logs confirmam que o webhook processa eventos corretamente
- Os secrets `META_APP_ID` e `META_APP_SECRET` estao configurados
- A tabela `meta_connections` existe no banco com RLS configurado
- O componente `MetaLeadAdsConnection` e a rota `/meta-oauth-callback` estao implementados
- Nenhuma pagina esta conectada ainda (tabela `meta_connections` vazia)

### Problema Identificado
O **GET request** para verificacao do webhook retorna **404**. Isso e critico porque o Meta envia um GET para validar o webhook antes de ativa-lo. O POST funciona normalmente, mas o GET falha no gateway.

Isso acontece porque o gateway das Edge Functions pode rejeitar requests GET sem headers de autorizacao, mesmo com `verify_jwt = false`.

## Plano de Solucao

### 1. Corrigir o Webhook para aceitar GET (verificacao do Meta)
Reescrever a funcao `webhook-meta-leads` para garantir compatibilidade com o gateway, adicionando headers CORS tambem na resposta GET e garantindo que o challenge seja retornado corretamente com content-type `text/plain`.

### 2. Teste completo do fluxo
Apos o fix, testar:
- GET de verificacao (simular o que o Meta envia)
- POST de evento de lead (simular um evento leadgen)

### 3. Instrucoes para o Meta Developer Portal
Apos confirmar que o webhook responde ao GET:
- **Callback URL**: `https://gylxzoogrqqeqihqknkm.supabase.co/functions/v1/webhook-meta-leads`
- **Verify Token**: `r3cf_meta_verify_2024`
- Inscrever no campo `leadgen`

## Detalhes Tecnicos

O problema do GET 404 pode ser resolvido de duas formas:
1. Testar se o gateway aceita GET com query params na URL publicada (as vezes e um problema temporario de cache/propagacao)
2. Se persistir, adicionar um fallback no POST handler que tambem aceita verificacao do webhook via POST (o Meta suporta isso em algumas configuracoes)

A correcao principal sera garantir que os CORS headers estejam presentes em TODAS as respostas, incluindo as de verificacao GET, e que o content-type esteja correto para o challenge response.
