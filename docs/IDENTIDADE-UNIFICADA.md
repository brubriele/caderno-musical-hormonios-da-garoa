# Proposta de identidade unificada — validação de interface e integração

## Objetivo

Validar a navegação entre Caderno Musical e Ensaios & instrumentos como áreas de uma mesma experiência, sem modificar a implementação operacional da Bea e sem ativar autenticação ou persistência real nesta etapa.

## Decisões

1. A autenticação deverá ser centralizada futuramente na infraestrutura Bea.
2. O provedor Google poderá continuar sendo uma opção de login, mas será configurado e mediado pela identidade central da Bea — não por uma autenticação independente do Supabase Caderno.
3. Os dados funcionais continuam em bancos separados:
   - Bea: participantes/ensaios/presenças/reservas/estoque.
   - Caderno: músicas/contribuições/repertório e memória musical.
4. A pessoa será reconhecida entre os módulos por um identificador estável emitido pela identidade central (ex.: claim `sub` de OIDC), não pelo e-mail como chave primária.
5. Nenhuma alteração na implementação Bea faz parte desta entrega.

## Navegação e UX

- Na área Caderno Musical, o nome da área atual é o título principal do header; “Ensaios & instrumentos” é o link de navegação.
- Na área Ensaios & instrumentos, o título principal passa a ser o nome dessa área; “Caderno Musical” é o breadcrumb de retorno.
- O CTA que antes informava “Entrar com Google” foi substituído por “Acesso da produção em validação” e fica desabilitado nesta prévia. Isso evita induzir a pessoa a iniciar o fluxo OAuth antigo enquanto a estratégia de identidade é revista.
- A navegação não representa, por si só, sessão compartilhada.

## Escopo técnico desta branch

- Reintroduz a infraestrutura BFF/API já proposta na branch `feat/integracao-infra-bea`, como base técnica para validação.
- Reúne a interface atual de Ensaios em modo demonstrativo.
- Mantém os dois projetos Supabase distintos.
- Não conecta o formulário demonstrativo aos endpoints BFF.
- Não executa autenticação central, OIDC, SSO, migrações ou escrita operacional.
- O código administrativo existente na infraestrutura Bea (ADMIN_KEY + cookie HMAC) não é uma identidade individual compartilhável e não deve ser tratado como OIDC/JWT.
- A configuração da BFF deve continuar isolada do Supabase musical. A documentação da branch-base alerta que o modelo e o projeto Supabase operacionais são distintos.

## Contrato futuro a discutir com Bea e Rafa

A identidade central deverá disponibilizar, no mínimo:
- identificador imutável da pessoa (`sub`);
- nome de exibição e e-mail verificado, quando disponíveis;
- estado da conta;
- papéis e permissões, com escopo definido;
- issuer (`iss`), audience (`aud`), expiração (`exp`) e assinatura verificável do token;
- mecanismo seguro de renovação e encerramento de sessão.

Permissões candidatas:
- `manage_events`
- `manage_inventory`
- `manage_attendance`
- `review_contributions`
- `publish_songs`

Perfis sugeridos (a validar): participante, colaborador, produção e administração. Perfil e permissão não devem ser inferidos apenas do endereço de e-mail.

## Cenários de aceite

### Navegação
1. Abrir `/`: Caderno Musical aparece como área ativa.
2. Acionar “Ensaios & instrumentos”: abrir `/ensaios.html`.
3. Verificar que Ensaios & instrumentos aparece como título ativo.
4. Acionar breadcrumb “Caderno Musical”: retornar à raiz.
5. Repetir em viewport mobile e desktop.

### Caderno Musical
1. Consultar biblioteca e buscar uma canção.
2. Filtrar por naipe.
3. Abrir Produção e verificar que o CTA de autenticação está desabilitado e não menciona login Google.
4. Confirmar que nenhum redirecionamento OAuth é iniciado nesta prévia.

### Ensaios (demonstração)
1. Preencher nome, pronome e e-mail.
2. Registrar presença e conferir Minha reserva.
3. Escolher instrumento e acessórios.
4. Atualizar resposta.
5. Desfazer instrumento.
6. Cancelar presença.
7. Atualizar a página e confirmar que o estado demonstrativo não persiste.
8. Confirmar o aviso de prévia e que nenhuma chamada de escrita é feita para a Bea.

### Integração e segurança
1. Confirmar que a BFF compila no build de Preview.
2. Confirmar que as rotas demonstrativas não chamam endpoints de escrita.
3. Confirmar que não existem segredos no bundle do navegador.
4. Não executar migrations nem configurar credenciais de produção.
5. Validar com Bea e Rafa o contrato de identidade antes de qualquer integração de sessão.

## Débitos técnicos

- Definir emissor de identidade central e provedor de login.
- Escolher OIDC/integração de terceiro com Supabase ou BFF com validação server-side.
- Definir política de provisionamento e vínculo de contas existentes.
- Definir contrato de autorização e mapeamento de perfis/permissões.
- Adaptar a BFF para manter explicitamente separados os projetos Supabase.
- Integrar sessão na navegação dos módulos.
- Substituir dados demonstrativos de ensaios por endpoints reais somente após autorização.
- Definir estratégia de logout global, expiração e revogação de sessão.

## Fora do escopo

- Alterar código ou infraestrutura operacional Bea.
- Alterar tabelas, RLS, migrations ou dados Supabase existentes.
- Remover ou migrar contas Google já cadastradas no Supabase Caderno.
- Ativar gravação de presenças, reservas ou estoque.
- Fazer deploy de produção ou merge em main.
