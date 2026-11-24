# Hormônios da Garoa — Caderno Musical

Aplicação principal do Caderno Musical, com uma prévia da área de Ensaios & instrumentos e da proposta de navegação entre módulos.

## Estado desta branch

Preview Vercel (READY): https://hormonios-caderno-musical-git-feat-i-52219f-brubrieletools-3860.vercel.app


- Branch: `feat/identidade-unificada-preview`
- Objetivo: validar a experiência de duas áreas sob uma navegação comum e preparar a arquitetura de identidade unificada.
- A autenticação central ainda **não está implementada**. O CTA de acesso da produção está desabilitado nesta prévia.
- Ensaios, presença e reservas permanecem em modo demonstrativo: nenhum dado é enviado à infraestrutura Bea.
- A infraestrutura BFF/API proposta anteriormente está presente nesta branch, mas não foi conectada ao fluxo demonstrativo de ensaios.
- Os dois projetos Supabase permanecem separados. Não execute migrations importadas nem configure segredos do projeto musical no BFF.

## Executar localmente

Requisitos: Node.js 20 ou superior (preferencialmente a versão LTS) e npm.

1. Clone o repositório e selecione esta branch:

```bash
git clone --branch feat/identidade-unificada-preview --single-branch https://github.com/brubriele/caderno-musical-hormonios-da-garoa.git
cd caderno-musical-hormonios-da-garoa
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

4. Abra a URL local exibida pelo Vite (normalmente http://localhost:5173).

Rotas para explorar:
- `/` — Caderno Musical.
- `/ensaios.html` — Ensaios & instrumentos.

Para validar a compilação:

```bash
npm run build
npm run preview
```

Para interromper o servidor: Ctrl+C.

## Cenários de teste

1. No Caderno Musical, verificar o título ativo no cabeçalho e o link para Ensaios & instrumentos.
2. Abrir Ensaios & instrumentos e verificar que o título ativo muda e Caderno Musical aparece como breadcrumb de retorno.
3. Alternar entre as áreas e confirmar que o cabeçalho deixa claro onde a pessoa está.
4. No Caderno, consultar a biblioteca, buscar canções e navegar por naipe.
5. Abrir a área de Produção e confirmar que o CTA informa que o acesso está em validação, sem iniciar OAuth Google.
6. Em Ensaios, preencher e enviar presença com nome, pronome e e-mail.
7. Escolher um instrumento, selecionar acessórios e conferir Minha reserva.
8. Atualizar a resposta, desfazer a escolha de instrumento e cancelar a presença.
9. Atualizar a página e confirmar que os dados demonstrativos não persistem.
10. Conferir que a faixa de prévia informa que os dados são ilustrativos.

## Arquitetura proposta

A autenticação deverá ser centralizada futuramente na infraestrutura Bea, com um identificador estável da pessoa. Os cadastros funcionais permanecem em bases distintas:
- Infra Bea: ensaios, presença, reservas e estoque.
- Supabase Caderno: músicas, contribuições, acordes, levadas e materiais musicais.

Esta branch não implementa a autenticação unificada nem ativa gravações operacionais. A integração real depende de um contrato de identidade e autorização acordado com Bea e Rafa.

## Segurança

- Não adicionar `service_role`, `ADMIN_KEY`, `COOKIE_KEY` ou outros segredos ao front-end ou ao Git.
- Não usar credenciais do Supabase Caderno para configurar o BFF da Bea.
- Não executar migrations importadas no ambiente de produção.
- Não fazer merge em `main` antes da validação dos cenários e revisão técnica.
