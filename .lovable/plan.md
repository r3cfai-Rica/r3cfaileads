

# Solucao para Usuarios Comuns Conectarem Meta Lead Ads

## Situacao Atual

A arquitetura ja e multi-tenant. O fluxo para um usuario comum seria:

1. Entrar no app R3CF
2. Ir em Settings
3. Clicar em "Conectar com Facebook"
4. Autorizar as permissoes no Facebook
5. Pronto -- os leads da pagina dele comecam a chegar automaticamente

O webhook e registrado UMA VEZ (pelo admin, ja feito). Cada usuario conecta suas proprias paginas via OAuth, e o sistema identifica automaticamente a quem pertence cada lead pelo `page_id`.

## Problema: Meta App em Modo Development

Enquanto o app Meta estiver em modo **Development**, apenas usuarios cadastrados como **Testers** ou **Admins** no Meta Developer Portal podem usar o OAuth. Usuarios comuns receberao erro de permissao.

## Acoes Necessarias

### 1. Verificacao de Negocio no Meta (Manual - fora do codigo)

Voce precisa completar a **Business Verification** no Meta Business Suite para que o app seja aprovado para modo Live. Passos:

- Acesse [Meta Developer Portal](https://developers.facebook.com/apps/1183775287299903/settings/basic/)
- Va em **App Review** no menu lateral
- Solicite as permissoes: `pages_show_list`, `leads_retrieval`, `pages_manage_ads`, `pages_read_engagement`
- Complete a verificacao de negocio com documentos da empresa
- Apos aprovacao, mude o app para modo **Live**

### 2. Atualizar Redirect URI para producao

No componente `MetaLeadAdsConnection`, o `redirect_uri` usa `window.location.origin`, o que ja funciona dinamicamente tanto em preview quanto em producao. Porem, e necessario registrar a URL de producao no Meta Developer Portal:

- Va em **Facebook Login** > **Settings** no Meta Developer Portal
- Em **Valid OAuth Redirect URIs**, adicione:
  - `https://r3cfaileads.lovable.app/meta-oauth-callback`

### 3. Melhorias opcionais no codigo

Nenhuma alteracao de codigo e estritamente necessaria -- o fluxo ja funciona para multi-tenant. Porem, melhorias opcionais incluem:

- **Feedback ao usuario**: Adicionar uma mensagem explicando que o app Meta precisa estar em modo Live para usuarios externos
- **Tratamento de erro de permissao**: Quando o Meta retornar erro de permissao (app em Development), mostrar uma mensagem amigavel ao usuario
- **Polling de leads**: Adicionar um botao de "Sincronizar agora" para buscar leads manualmente (fallback caso o webhook falhe)

## Resumo

| Item | Status |
|------|--------|
| Arquitetura multi-tenant | Ja implementada |
| OAuth para usuarios comuns | Ja implementado |
| Webhook compartilhado | Ja configurado |
| Salvamento por user_id | Ja funciona |
| Business Verification do Meta | Pendente (manual) |
| Redirect URI em producao | Precisa registrar no Meta |
| Alteracoes de codigo | Nenhuma obrigatoria |

## Conclusao

O sistema ja esta preparado para multiplos usuarios. A unica barreira e a **verificacao de negocio no Meta**, que e um processo manual feito no Meta Developer Portal. Apos aprovacao, qualquer usuario podera conectar suas paginas clicando em "Conectar com Facebook" no app.

