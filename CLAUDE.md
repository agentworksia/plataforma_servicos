---
projectType: SaaS
framework: Next.js
stack: Next.js App Router + TypeScript + Tailwind + Prisma + Auth.js + PostgreSQL
host: Vercel
---

# Perfil e forma de trabalho

Eu crio plataformas, sites, SaaS e apps sob demanda (freelance/agência) e trabalho pelo VS Code, publicando os projetos no GitHub e fazendo deploy em serviços como Vercel/HostGator. Quero um parceiro de engenharia que entenda a demanda antes de sair codando, proponha a stack certa pro tamanho do projeto e entregue código pronto para produção — não protótipos descartáveis.

# Stack padrão (a menos que o projeto exija outra coisa)

- **Sites simples / landing pages / redesigns de clientes**: HTML + CSS + JS puro (ou Astro se precisar de componentização leve). Hospedagem tipo HostGator/cPanel via FTP.
- **SaaS / apps com backend, autenticação, banco de dados**: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui no front; Prisma + PostgreSQL (Neon ou Supabase) no banco; Auth.js ou Clerk para autenticação; deploy na Vercel.
- **Apps mobile**: só entrar em React Native/Expo se o cliente pedir mobile nativo de verdade — não usar de forma default.

Se a demanda não se encaixar claramente em nenhum desses, pergunte antes de escolher a stack — não assuma.

# Como abordar uma demanda nova

1. **Entenda antes de codar.** Pergunte: quem é o usuário final, o que precisa funcionar no MVP, tem prazo ou orçamento de hospedagem que limite a escolha técnica, o cliente vai continuar editando o conteúdo sozinho (nesse caso considere CMS simples / painel de edição).
2. **Proponha a stack e a estrutura de pastas antes de gerar muito código**, principalmente se for SaaS — alinhar isso primeiro evita retrabalho.
3. **Construa incrementalmente**: primeiro o esqueleto que roda (ainda que vazio), depois as features uma a uma, testando cada uma no navegador antes de avançar.
4. **Sempre valide no navegador antes de dizer que terminou** — não bastam type-check/testes passarem quando a mudança é visual ou de fluxo de usuário.

# Padrões de código

- TypeScript com tipos explícitos em fronteiras (props, retornos de API, schemas de banco); pode inferir no resto.
- Sem comentários óbvios — só quando explica um "porquê" não óbvio (uma decisão estranha, uma limitação de API, um workaround).
- Sem abstração prematura: se a tela/feature só existe uma vez, não crie camada genérica "para o futuro".
- Variáveis de ambiente e segredos sempre em `.env` (nunca hardcoded), e sempre adicionar `.env` ao `.gitignore` antes do primeiro commit.
- Validação de dados de entrada (formulários, API routes) sempre no backend, mesmo que já valide no frontend.

# Publicação / deploy

- Repositórios vão para o GitHub. Antes do primeiro `git push`, confirme comigo se o repo é público ou privado.
- Nunca commitar `.env`, chaves de API ou credenciais de banco.
- Para SaaS na Vercel: sempre configurar as env vars no painel da Vercel antes do primeiro deploy de produção, e avisar quais variáveis faltam configurar lá.
- Para sites simples na HostGator: seguir o fluxo do meu plugin `prospector-de-sites` (skill `publicar`) quando o projeto for um redesign de cliente daquele fluxo.

# O que NÃO fazer

- Não sugerir microserviços, filas, Kubernetes ou infra complexa para um MVP de cliente pequeno — resolver com o mais simples que atende.
- Não gerar telas de admin, dashboards ou features que o cliente não pediu "para ficar completo".
- Não trocar de stack no meio de um projeto sem avisar e justificar o porquê.
