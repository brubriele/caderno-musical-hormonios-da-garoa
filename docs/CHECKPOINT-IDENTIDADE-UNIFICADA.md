# CHECKPOINT — Identidade unificada / Caderno Musical + Ensaios

Atualizado em 24/11/2026.

## Estado atual

- Repositório: https://github.com/brubriele/caderno-musical-hormonios-da-garoa
- Branch de trabalho: `feat/identidade-unificada-preview`
- Branch-base: `feat/integracao-infra-bea`
- Preview Vercel: https://hormonios-caderno-musical-7ey6ov6sj-brubrieletools-3860.vercel.app
- Deployment verificado como READY: `dpl_DdbL3sGg2QqioeLdVpJ7LPD83ZJR`
- Commit do deployment READY: `48c90bec22a82e4607735792387306e2edf4a71b`
- Projeto Vercel: `hormonios-caderno-musical`

## Objetivo desta entrega

Validar a experiência de navegação entre Caderno Musical e Ensaios & instrumentos e manter a infraestrutura BFF/API já proposta como base para avaliação, sem modificar a implementação operacional da Bea.

## O que foi feito

1. Criada a branch `feat/identidade-unificada-preview` a partir de `feat/integracao-infra-bea`.
2. Mantida a estrutura BFF/API da branch-base e seus arquivos de configuração/documentação.
3. Reincorporada a interface demonstrativa de Ensaios da branch `feat/ensaios-presenca-instrumentos`.
4. Caderno Musical: título atual em destaque e link de navegação para “Ensaios & instrumentos”.
5. Ensaios: título atual em destaque e breadcrumb “Caderno Musical” para retorno.
6. Removido o fluxo OAuth Google legado do front nesta prévia. O CTA de produção informa “Acesso da produção em validação” e fica desabilitado.
7. Ensaios continuam em `DEMO_MODE = true`; presença, escolha de instrumentos, acessórios, Minha reserva, atualização e cancelamento são simulados no navegador.
8. Criado `README.md` com requisitos, instalação, execução local e cenários de teste.
9. Criado `docs/IDENTIDADE-UNIFICADA.md` com arquitetura, contrato futuro, critérios de aceite e débitos.
10. Preview Vercel da branch compilou e ficou READY. O build Vite concluiu; o log apresentou avisos de configuração npm e install-scripts do esbuild, sem falha de build.

## Arquitetura proposta

- Autenticação central futura na infraestrutura Bea.
- Google pode permanecer como provedor de login, mediado pela identidade central da Bea.
- Supabase Bea permanece responsável por ensaios, presença, reservas e estoque.
- Supabase Caderno permanece responsável por músicas, contribuições, repertório e memória musical.
- Identidade compartilhada deverá usar identificador estável (ex.: `sub` OIDC), nunca e-mail como chave primária.
- A autenticação central ainda não existe e não está implementada nesta branch.

## Limites e segurança

- Nenhuma alteração feita no repositório operacional da Bea.
- Nenhuma migration executada.
- Nenhuma tabela, RLS ou dado Supabase alterado.
- Formulário demonstrativo não chama endpoints de escrita da Bea.
- A BFF/API está presente, mas não foi conectada ao fluxo demonstrativo de Ensaios.
- O cookie administrativo HMAC/ADMIN_KEY da Bea não é identidade individual OIDC/JWT.
- A infraestrutura BFF usa projeto Supabase operacional diferente do Supabase Caderno. Não misturar chaves, schemas ou credenciais.
- Não colocar `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_KEY`, `COOKIE_KEY` ou credenciais Transicionais no front-end ou no Git.
- Não fazer merge em `main` até revisão com Bea e Rafa.

## Como rodar localmente

Requisitos: Node.js 20+ e npm.

Terminal:
```bash
git clone --branch feat/identidade-unificada-preview --single-branch https://github.com/brubriele/caderno-musical-hormonios-da-garoa.git
cd caderno-musical-hormonios-da-garoa
npm install
npm run dev
```

Abrir a URL indicada pelo Vite (normalmente `http://localhost:5173`).

- `/`: Caderno Musical.
- `/ensaios.html`: Ensaios & instrumentos.

Build:
```bash
npm run build
npm run preview
```

Parar o servidor: Ctrl+C.

GitHub Desktop:
1. Abrir o repositório no GitHub.
2. Code → Open with GitHub Desktop.
3. Clonar o repositório.
4. No seletor de branches, selecionar `feat/identidade-unificada-preview`.
5. Abrir a pasta no VS Code.
6. No terminal integrado, executar `npm install` e `npm run dev`.

Não usar Live Server nesta versão: o projeto usa Vite e inclui estrutura de API serverless. A API/BFF não está ligada aos fluxos demonstrativos; para os cenários desta entrega, Vite é suficiente.

## Cenários de teste

### Navegação e header
- Abrir Caderno: título ativo correto e link para Ensaios.
- Ir para Ensaios: título ativo correto e breadcrumb de volta.
- Voltar ao Caderno pelo breadcrumb.
- Repetir em desktop e mobile.

### Caderno
- Buscar músicas e navegar por naipe.
- Abrir Produção.
- Confirmar CTA de acesso desabilitado e ausência de redirecionamento Google/OAuth.
- Confirmar mensagem de autenticação central em validação.

### Ensaios (simulado)
- Registrar presença com nome, pronome e e-mail.
- Escolher instrumento e acessórios.
- Conferir Minha reserva.
- Atualizar resposta.
- Desfazer instrumento.
- Cancelar presença.
- Atualizar a página e confirmar que estado demonstrativo não persiste.
- Confirmar aviso de prévia e ausência de escrita real.

### Infraestrutura
- Verificar build Preview.
- Não enviar credenciais nem ativar BFF com secrets de produção.
- Não executar migrations.
- Não tratar o status READY como prova de autenticação ou integração funcional.

## Próximas etapas recomendadas

1. Você explorar localmente e no Preview os cenários acima.
2. Compartilhar Preview e documentação com Bea e Rafa.
3. Validar com elas o contrato de identidade: issuer, subject estável, claims, perfis, permissões, sessão, renovação e logout.
4. Definir OIDC/integração Supabase Third-Party Auth ou BFF seguro.
5. Só após aprovação, planejar a conexão gradual de cada módulo com seu banco responsável.
6. Manter a implementação Bea intacta até autorização explícita.

## Arquivos importantes

- `README.md`
- `docs/IDENTIDADE-UNIFICADA.md`
- `docs/INTEGRACAO-INFRA-BEA.md`
- `index.html`
- `ensaios.html`
- `ensaios.css`
- `ensaios.js`
