# Integração da infraestrutura da Bea no Caderno Musical

## Direção do produto
O Caderno Musical permanece como aplicação principal e como raiz deste repositório. Ensaios, instrumentos, reservas e acervo serão incorporados progressivamente como módulos, preservando a interface e identidade visual editorial existentes.

## O que esta branch incorpora
- BFF/API, módulos de domínio, use cases e adaptadores da branch `integracao-api` do repositório `hormonios-garoa`.
- Rotas serverless da Vercel.
- Vite como ferramenta de build e desenvolvimento, mantendo `index.html` como entrada principal.
- Documentação de integração.

## Separação de bancos — bloqueio de segurança
O Caderno usa o Supabase `zktyaimschssofjlwill`. A infraestrutura BFF original foi configurada para o Supabase `nrbvobwoghcyxqyrhtvw`, com modelo de dados distinto (`event`, `user`, `attendance`, `integration_status`).

**Não configurar chaves secretas do Caderno no BFF sem adaptar o repositório e o modelo de dados. Não executar migrations importadas. Não usar service_role no navegador.** Nenhuma chave secreta foi adicionada ao repositório. A configuração de produção do BFF ainda não está pronta.

## Pendências antes de uso real
1. Validar o Preview e o build das Functions.
2. Revisar autenticação e autorização: o login administrativo da Bea usa `ADMIN_KEY`/cookie e não é equivalente ao OAuth Google do Caderno.
3. Definir contrato BFF para `songs` e `contributions`, mantendo RLS e permissões de produção.
4. Separar ou adaptar os repositórios Supabase para não misturar tabelas dos dois projetos.
5. Só depois conectar operações de leitura/escrita e testar em ambiente isolado.

## Escopo futuro
Instrumentos, reservas, ensaios e acervo serão features incrementais. Esta etapa não altera tabelas, dados, autenticação atual, nem implementa essas features.
