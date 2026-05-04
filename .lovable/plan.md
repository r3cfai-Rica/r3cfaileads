## Diagnóstico

Verifiquei a página `/automations`, a edge function `run-automation`, o agendador `automation-scheduler` (rodando a cada 5min via cron — OK) e o banco. Encontrei estes problemas:

### 1. Nenhum robô foi criado de fato no banco
A tabela `automations` está vazia para você. Provável causa: o formulário "Criar Novo Robô" exige obrigatoriamente uma **Pasta** (`folderId`) — se você não tem pasta criada, o botão "Criar Robô" fica desabilitado e o usuário não percebe o porquê. Além disso a validação não dá feedback (nenhum aviso explicando o que falta).

### 2. CreateBotDialog só oferece B2B / B2C / Both
Não existem opções para os novos tipos que adicionamos na Prospecção (Tendências / Busca Web). E a edge function `run-automation` só implementa B2B real — para `b2c` ela retorna erro "B2C automation requires CSV import…", o que confunde o usuário.

### 3. Erro silencioso quando faltam credenciais
Se `GOOGLE_API_KEY` não está configurada (free users ou cliente sem API key), o run dá throw genérico. Hoje você (admin) tem a chave, mas precisa de mensagem amigável + bloquear criação para quem não tem Premium.

### 4. Warning de React (ref em function component)
Console mostra: `Function components cannot be given refs` em `CreateBotDialog`. O `<Dialog>` Radix tenta passar ref para o wrapper. Não quebra mas polui o log. Resolvido envolvendo o componente em `React.forwardRef` ou removendo o ref desnecessário.

### 5. Falta do bloco em `supabase/config.toml`
Não existem entradas `[functions.run-automation]` nem `[functions.automation-scheduler]`. Como `verify_jwt` default é `true`, o `automation-scheduler` (chamado pelo pg_cron com service_role) ainda funciona, mas é mais seguro/explícito declarar `verify_jwt = false` para `automation-scheduler` (chamado por sistema) e manter `true` para `run-automation` (chamado por usuário).

### 6. Histórico de execuções vazio
Como nenhuma execução rodou, a aba "Histórico" sempre aparece vazia — esperado, mas vamos validar após o fluxo voltar a funcionar.

---

## Plano de correção

**A. Corrigir UX do formulário de criação (`CreateBotDialog.tsx`)**
- Tornar a seleção de Pasta opcional: se o usuário não tiver pasta, criar automaticamente uma pasta "Robôs IA" no primeiro envio (ou mostrar botão "Criar pasta agora").
- Mostrar mensagens de validação visíveis (ex.: "Selecione uma pasta" em vermelho) em vez de só desabilitar o botão.
- Adicionar tipos de busca alinhados à Prospecção: **B2B (Google Maps)**, **Tendências (Google Trends + Maps)**, **B2C – em breve**. Marcar B2C como desabilitado com badge "Em breve" para não frustrar.

**B. Suportar busca por Tendências em `run-automation`**
- Quando `lead_type === 'trends'` (novo valor), chamar a mesma lógica da função `generate-leads-interest` (analisar tendências com Gemini + buscar via Google Places).
- Manter B2B existente.
- Trocar a mensagem genérica de B2C por algo informativo no UI antes de salvar.

**C. Aviso de pré-requisito Google API Key**
- Na página `/automations`, mostrar um banner quando o usuário Free abrir a página: "Robôs requerem plano Premium (usam Google Places para leads reais)" com botão para upgrade.
- Para Premium/Admin: mostrar selo verde "✅ Google Places ativa".

**D. Limpar warning de ref**
- Em `CreateBotDialog.tsx` (e `RobotRunsDialog.tsx` se necessário), remover prop `ref` implícita ou usar `React.forwardRef` no wrapper que vai dentro do `<Dialog>`.

**E. Declarar `verify_jwt` no `supabase/config.toml`**
```toml
[functions.run-automation]
verify_jwt = true

[functions.automation-scheduler]
verify_jwt = false
```

**F. Teste end-to-end**
- Após deploy, criar um robô de teste B2B (nicho "marketing digital", São Paulo), clicar **Executar agora**, validar que `robot_runs` recebe registro com `status=success` e `leads_saved > 0`.
- Validar que a aba "Histórico" mostra a execução.

---

## Arquivos a alterar

- `src/components/automations/CreateBotDialog.tsx` — validação visual, novo tipo "Tendências", auto-criar pasta, fix de ref.
- `src/pages/Automations.tsx` — banner de pré-requisitos por plano.
- `supabase/functions/run-automation/index.ts` — suportar `lead_type='trends'`, mensagens de erro mais claras.
- `supabase/config.toml` — adicionar blocos das duas funções.

Sem mudanças no schema do banco (a coluna `lead_type` é `text` e aceita o novo valor).
