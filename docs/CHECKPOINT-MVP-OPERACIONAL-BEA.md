# CHECKPOINT — MVP operacional de Ensaios / autenticação administrativa Bea

Atualizado em 24/11/2026.

## Pedido e objetivo

O usuário confirmou que o fluxo de presença → instrumentos → Minha reserva foi corrigido e validado localmente/Preview. Próximo objetivo: transformar a área de Ensaios & instrumentos em um piloto operacional para um grupo controlado do Hormônios da Garoa:
- participante registra presença e reserva instrumento/acessórios;
- participante consulta/atualiza/desfaz sua própria presença/reserva;
- produção entra com a chave administrativa já proposta pela Bea;
- produção consulta presenças e reservas, administra ensaio e estoque, abre/fecha reservas;
- cadastros operacionais permanecem no Supabase da infraestrutura Bea, separados do Supabase do Caderno Musical.

## Estado confirmado da branch do Caderno

- Repositório: https://github.com/brubriele/caderno-musical-hormonios-da-garoa
- Branch: `feat/identidade-unificada-preview`
- Área atual de ensaios: `ensaios.html`, `ensaios.css`, `ensaios.js`.
- `ensaios.js` ainda declara `DEMO_MODE = true`, mantém dados ilustrativos em memória e NÃO chama a API. Não há formulário conectado aos endpoints.
- Header e navegação Caderno/Ensaios foram validados.
- Correção do fluxo de presença publicada anteriormente: quem responde “Vou ao ensaio” vai para Instrumentos; “Não vou conseguir ir” vai para Minha reserva.
- Último deployment informado no contexto anterior: READY. Houve commits de documentação depois dele.
- Não há painel admin funcional dentro de `ensaios.html`. Uma tentativa parcial de inserção do painel foi revertida; não deixar markup órfão.
- Não foi configurada nenhuma variável secreta nem executada migration nesta tarefa.
- Nenhuma alteração foi feita na infraestrutura operacional da Bea nem em bancos de dados.

## Auditoria da implementação Bea disponível

Repositório de origem: https://github.com/brubriele/hormonios-garoa

### PRs relevantes

- PR #11 — https://github.com/brubriele/hormonios-garoa/pull/11 — BFF, Supabase e Transicionais. Foi a base antiga da infraestrutura importada para o Caderno. Descrição prevê fluxo público sem login com e-mail/nome/pronome, cookie de aparelho, minhas reservas e produção por chave.
- PR #23 — https://github.com/brubriele/hormonios-garoa/pull/23 — stack de integração, fechado sem merge (merged_at null na resposta consultada). Não assumir que isso foi integrado em main.
- PR #22 — https://github.com/brubriele/hormonios-garoa/pull/22 — T8/T9, permanece aberto e depende da branch de documentação da T8/T9. Contém melhorias de atual/próximo ensaio, identificação da pessoa por aparelho/e-mail e rotas novas. Não está incorporado à branch do Caderno. Exige migration v3 em banco de dev antes de testar. Não copiar somente a migration ou ativar parcialmente.

### O que está implementado na branch atual (código derivado da base antiga)

- `POST /api/admin/entrar`: recebe `{key}`, compara com `ADMIN_KEY`, emite cookie `hg_admin` assinado por HMAC usando `COOKIE_KEY`, validade de 12h.
- `requireAdmin`: protege `GET/PUT /api/admin/ensaio` e `POST /api/admin/novo-ensaio`.
- `GET /api/ensaio`: leitura pública do ensaio atual.
- `POST /api/reserva`: presença/reserva com nome, pronome, e-mail, instrumento/acessórios, cookie `hg_device` e `hg_user`.
- `GET /api/minhas-reservas`: consulta baseada no cookie `hg_user`.
- `POST /api/reserva/desfazer`: fluxo de desfazer associado ao aparelho.
- Admin antigo consegue consultar participantes/reservas através de `GET /api/admin/ensaio`, editar ensaio/estoque via `PUT /api/admin/ensaio`, criar ensaio via `POST /api/admin/novo-ensaio`.
- A chave administrativa não é login de participante nem identidade unificada. É credencial compartilhada da produção, adequada apenas a um piloto pequeno, temporário e controlado, se configurada como secret no servidor.

### Limitações identificadas

- O BFF usa `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` no servidor e o Supabase original da Bea `nrbvobwoghcyxqyrhtvw`, com tabelas/modelo próprios (`event`, `user`, `attendance`, `integration_status`). Não usar as credenciais do Supabase Caderno `zktyaimschssofjlwill`.
- `api/admin/entrar.ts` existe, mas a interface Ensaios atual não tem formulário de login/admin nem chamadas de API.
- `ensaios.js` é totalmente demonstrativo.
- A versão antiga não contém todas as rotas da T8/T9. Em particular, não contém `PUT /api/admin/reservas`, `GET /api/membros`, `POST/PATCH /api/membros/reservas`, `POST /api/admin/ensaio/proximo` nem o conjunto novo de T8/T9. A versão T8/T9 tem estes contratos em PR #22.
- A versão antiga tem `POST /api/reserva` e `POST /api/reserva/desfazer`, diferentes das rotas novas de PR #22.
- Não há endpoint de admin para cancelar arbitrariamente a presença de outra pessoa no PR #11; a pessoa desfaz pelo cookie do próprio aparelho. Não prometer esse recurso sem desenhar e implementar rota/usecase de autorização.
- `hg_user` e `hg_device` são cookies de identificação/posse de aparelho, não autenticação forte. O fluxo reduz atrito para participantes, mas não prova identidade. O texto público deve explicar essa limitação sem sugerir que o e-mail foi verificado.
- O cookie de admin é HttpOnly, Secure, SameSite=Lax e tem expiração de 12h. A chave nunca pode ser enviada ao front fora do POST HTTPS de login, logada ou armazenada em JS/localStorage.
- `TRANSICIONAIS_ENABLED` deve ficar false no piloto se não houver aprovação/configuração da integração externa; primeiro validar persistência no Supabase Bea de homologação.
- O arquivo `.env.example` inclui nomes das variáveis, não seus valores. Não adicionar secrets ao Git.

## Conclusão técnica

É factível usar a chave administrativa da Bea para o acesso temporário da produção e manter participantes sem Google/login, identificados pelo fluxo atual de aparelho/e-mail. Isto não é SSO nem identidade unificada; é um modo piloto com dois mecanismos diferentes.

Porém, a branch atual não está pronta para piloto operacional: o front Ensaios continua em demo e não está conectado à API. Também é necessário decidir qual versão dos contratos Bea usar:
1. integrar a base atual do PR #11, que tem rotas básicas e menor escopo; ou
2. incorporar de forma consistente a stack T8/T9 do PR #22, incluindo todas as dependências e migration v3, depois que Bea/Rafa confirmarem o estado do PR e o banco de homologação.

Recomendação: seguir com PR #22/T8/T9 como base mais recente, após revisão de dependências e aprovação de Bea/Rafa, sem mexer na branch principal nem na operação atual. Não misturar rotas antigas e novas.

## Plano de implementação proposto (ainda não executado)

### Fase 1 — Base e contratos
1. Confirmar com Bea/Rafa se PR #22 é a versão aprovada para integração; verificar o estado do PR e branches ancestrais.
2. Definir Supabase Bea de homologação e confirmar se migrations v1/v2 já foram aplicadas; planejar v3. Nunca executar em produção sem autorização.
3. Incorporar o conjunto T8/T9 completo (rotas, usecases, repository, domínio, respostas, migrations e UI administrativa de referência), não cherry-pick isolado.
4. Confirmar que as rotas de admin estão todas protegidas por `requireAdmin`.

### Fase 2 — Conectar front participante
1. GET `/api/ensaio` para dados reais do ensaio e catálogo.
2. POST `/api/membros/reservas` (ou rota antiga se deliberadamente escolhida) para presença sem instrumento.
3. POST/PATCH `/api/membros/reservas` com groupId/supportIds para reserva, conforme contrato T8/T9.
4. GET `/api/membros` para Minha reserva.
5. Atualizar/cancelar usando os métodos e regras exatos da T8/T9.
6. Manter feedback para conflitos de vaga/estoque, reservas fechadas, erro de rede e sessão/aparelho não reconhecido.

### Fase 3 — Produção/admin
1. Formulário “Produção” → POST `/api/admin/entrar` com a chave digitada, sem persistir a chave no browser.
2. Consultar sessão via GET admin protegido (401 = sessão ausente/expirada).
3. Painel atual/próximo, presença e reservas; abrir/fechar reservas; ajustar estoque; criar/editar próximo ensaio; encerrar e avançar ensaio, conforme PR #22.
4. Logout deve apagar cookie no servidor; confirmar se a rota existe na versão escolhida. Se não, criar endpoint de saída seguro.
5. Não adicionar cancelamento administrativo de participante sem rota/usecase explícito, auditável e autorizado.

### Fase 4 — Validação controlada
- Ambiente de Preview + Supabase Bea de homologação.
- Transicionais desligado inicialmente.
- Testar presença, reserva de instrumento/acessório, consulta, alteração, cancelamento próprio, admin login/logout, 401/expiração, abrir/fechar reservas, estoque, concorrência e duplicidade.
- Verificar que dados não entram no Supabase Caderno.
- Só liberar grupo piloto após teste de segurança, aceite de Bea/Rafa e confirmação de backup/rollback.

## Execução local

O Vite `npm run dev` serve o front, mas não executa automaticamente as serverless functions em `api/`. Para testar chamadas BFF localmente, usar `vercel dev` com variáveis de homologação em `.env.local` (arquivo ignorado pelo Git), depois de instalar a Vercel CLI. Não usar service role no browser. Nunca usar Live Server para testar endpoints serverless.

## Próxima ação para novo chat

Retomar por este checkpoint. Primeiro revisar PR #22 completo e dependências/ancestrais; então propor integração em branch dedicada e mapear migrations e variáveis de homologação. Não alterar a implementação Bea, não executar migrations e não publicar operação real sem autorização explícita.
