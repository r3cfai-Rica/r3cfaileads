
# Correcao Definitiva - Escopos Invalidos e Dominio

## Problema Identificado

Dois erros distintos estao ocorrendo:

1. **Escopo invalido**: O escopo `pages_manage_metadata` NAO EXISTE na API do Facebook. Ele foi adicionado por engano e causa o erro "Invalid Scopes". Este escopo deve ser REMOVIDO.

2. **Dominio nao configurado**: O Meta Developer Portal exige que o dominio `r3cfaileads.lovable.app` esteja no campo "Dominios da App" nas configuracoes do aplicativo. Isso e uma configuracao manual no portal (nao no codigo).

## Alteracao no Codigo

### Arquivo: `src/components/settings/MetaLeadAdsConnection.tsx` (linha 51)

Remover `pages_manage_metadata` dos escopos. Os escopos validos e necessarios sao:

- `pages_show_list` - listar paginas
- `leads_retrieval` - recuperar leads
- `pages_manage_ads` - gerenciar anuncios
- `pages_read_engagement` - ler engajamento
- `business_management` - acesso a paginas do Business Manager

**De:**
```
pages_show_list,leads_retrieval,pages_manage_ads,pages_read_engagement,business_management,pages_manage_metadata
```

**Para:**
```
pages_show_list,leads_retrieval,pages_manage_ads,pages_read_engagement,business_management
```

## Configuracao Manual no Meta Developer Portal

Voce precisa fazer o seguinte no portal https://developers.facebook.com:

1. Acesse seu app "R3CF Leads Flow"
2. Va em **Configuracoes > Basico**
3. No campo **"Dominios da App"**, adicione: `r3cfaileads.lovable.app`
4. Clique em **Salvar Alteracoes**

Isso resolve o erro "Nao e possivel carregar o URL".

## Resumo

| Item | Acao |
|------|------|
| Escopo `pages_manage_metadata` | Remover do codigo (escopo invalido) |
| Dominio da App | Adicionar `r3cfaileads.lovable.app` no Meta Developer Portal manualmente |
