# Auditoria do CRM de Seguros

Data da auditoria: 14/05/2026

## Resumo executivo

O projeto compila e abre no navegador, mas a auditoria encontrou inconsistencias importantes em leads, SLA, persistencia no Supabase e autenticacao. Isso explica comportamentos como salvar uma acao/data e ela sumir depois do refresh, dashboard e tabela discordarem, ou um lead ficar protegido por uma data antiga.

## Validacoes executadas

- `npm run build`: passou.
- `npx tsc --noEmit`: passou.
- `npm audit --omit=dev --json`: sem vulnerabilidades de producao.
- Aplicacao aberta em `http://localhost:5173`: carregou leads reais e dashboard.

## Achados criticos

1. `dataAcao` e `data_acao` estavam desencontradas.
   O app salva a data da acao como `data_acao`, mas o carregamento nao lia esse campo. Impacto: datas agendadas podem sumir apos recarregar.

2. Reset de SLA e acoes rapidas dependem do historico.
   A tabela real nao possui `data_ultimo_status`. Portanto, o contador precisa persistir pelas entradas de `historico`, especialmente a tag `[SLA ...]`. Impacto: se a tag nao for gravada corretamente, botoes como Contactado, Adiar, Alinhado e Reset SLA funcionam visualmente, mas podem voltar ao estado antigo.

3. SLA era calculado de formas diferentes.
   A tabela protegia qualquer lead com `dataAcao`, mesmo vencida. O helper `checkSLA` so protege datas futuras e trata `No Show` corretamente.

4. Autenticacao esta desativada.
   `isAuthenticated` esta fixo como `true`. A tela de senha existe, mas nao e seguranca real porque roda no frontend e tem fallback fixo.

5. Risco LGPD alto.
   O CRM guarda contato, renda, patrimonio, filhos e historico medico. O acesso precisa ser protegido por RLS/politicas no Supabase, nao apenas senha visual.

## Achados altos

6. Salvamento de lead esta duplicado entre `SideSheet`, `leadService` e hooks.

7. O schema de leads esta duplicado/inconsistente em alguns pontos.
   A tabela possui, por exemplo, `dataAcao` e `data_acao`, alem de `nome` e `nomecliente`. Isso aumenta o risco de uma tela salvar em uma coluna e outra tela ler outra.

8. `JSON.parse` sem protecao em `historico` e `reunioes` pode quebrar a carga inteira se um registro vier corrompido.

9. Existem divergencias de status, como referencias a `Aguardando Informacoes` fora da lista principal `STAGES`.

## Achados medios

10. Dashboard ainda deve ser acompanhado apos cada mudanca estrutural para garantir que os indicadores principais batem com a operacao real.

11. `forceRefresh` existe em `loadLeads`, mas nao muda comportamento.

12. A stack possui dependencias defasadas, mas sem vulnerabilidade de producao detectada. Recomendo estabilizar regra de negocio antes de atualizar React/Vite.

## Proxima ordem recomendada

1. Corrigir persistencia e leitura de datas/SLA.
2. Centralizar mapeamento de campos do lead.
3. Unificar calculo de SLA em todas as telas.
4. Revisar schema do Supabase e criar mapa campo da tela -> coluna do banco.
5. Reativar acesso somente com seguranca real no Supabase/RLS.
6. Adicionar testes unitarios para `getDaysInStage`, `checkSLA`, mapeamento de leads e acoes rapidas.
