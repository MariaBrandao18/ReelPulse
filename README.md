# ReelPulse

> **Analytics de Instagram Reels para agências e criadores de conteúdo.**

Você gerencia contas no Instagram e precisa provar resultado para o seu cliente — mas fica abrindo o app, copiando número por número, montando planilha na mão?

O **ReelPulse** resolve isso. É uma plataforma que centraliza todas as métricas dos seus Reels em um único painel: visualizações, curtidas, comentários e plays, atualizados automaticamente todo dia, com histórico de crescimento e gráficos prontos para apresentar.

**Para quem é:**
- Agências de social media que gerenciam múltiplos clientes
- Gestores de tráfego que precisam reportar resultado de conteúdo orgânico
- Criadores de conteúdo que querem entender o que performa melhor

**O que você ganha:**
- Chega de planilha manual — os dados chegam sozinhos todo dia
- Visão clara de quais reels estão crescendo e quais estagnaram
- Um painel por conta de Instagram, tudo separado e organizado
- Histórico diário para mostrar evolução ao longo do tempo

---

## Índice

1. [Como o sistema funciona](#como-o-sistema-funciona)
2. [Pré-requisitos](#pré-requisitos)
3. [Rodando localmente](#rodando-localmente)
4. [Configurando o Supabase](#configurando-o-supabase)
5. [Configurando as automações com n8n](#configurando-as-automações-com-n8n)
6. [Variáveis de ambiente](#variáveis-de-ambiente)
7. [Deploy em produção](#deploy-em-produção)

---

## Como o sistema funciona

O ReelPulse é dividido em três partes que trabalham juntas:

```
Você (interface web)
    ↓  adiciona URL de um reel
Supabase (banco de dados + funções)
    ↓  envia para o n8n processar
n8n (automação)
    ↓  busca dados do Instagram e devolve as métricas
Supabase (salva tudo no banco)
    ↑  exibe no dashboard
```

- **Frontend** — aplicação React que você usa no navegador
- **Supabase** — banco de dados, autenticação de usuários e funções que recebem/enviam dados
- **n8n** — ferramenta de automação que faz a coleta de métricas do Instagram e roda uma vez por dia para atualizar os números

---

## Pré-requisitos

Antes de começar, você vai precisar ter instalado na sua máquina:

| Ferramenta | Para que serve | Link |
|------------|---------------|------|
| **Node.js 20+** | Rodar o projeto | [nodejs.org](https://nodejs.org) |
| **npm** | Gerenciar pacotes (já vem com o Node) | — |
| **Git** | Baixar e versionar o código | [git-scm.com](https://git-scm.com) |

Você também vai precisar de contas gratuitas em:

- [Supabase](https://supabase.com) — banco de dados e backend
- [n8n](https://n8n.io) — automação (pode ser self-hosted ou cloud)

---

## Rodando localmente

### 1. Clone o repositório

```bash
git clone https://github.com/MariaBrandao18/ReelPulse.git
cd ReelPulse
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas chaves:

```bash
cp .env.example .env
```

Abra o `.env` e preencha os dois campos obrigatórios para rodar localmente:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
```

> Veja como obter esses valores na seção [Configurando o Supabase](#configurando-o-supabase) abaixo.

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse **http://localhost:8080** no navegador. Qualquer alteração no código aparece automaticamente na tela.

---

## Configurando o Supabase

O Supabase é onde ficam o banco de dados, a autenticação dos usuários, as imagens dos reels e as funções que recebem dados do n8n.

### Passo 1 — Crie um projeto

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **New project**
3. Escolha um nome (ex: `reelpulse`) e uma senha forte para o banco
4. Aguarde o projeto ser criado (leva cerca de 1 minuto)

### Passo 2 — Rode as migrations (cria as tabelas)

As migrations são os arquivos SQL que criam toda a estrutura do banco automaticamente.

1. No menu lateral do Supabase, clique em **SQL Editor**
2. Clique em **New query**
3. Abra cada arquivo da pasta `supabase/migrations/` na ordem (pelo nome, que começa com a data) e cole o conteúdo no editor
4. Clique em **Run** em cada um

Os arquivos criam as seguintes tabelas:

| Tabela | O que guarda |
|--------|-------------|
| `profiles` | Dados do usuário (nome, avatar) |
| `instagram_accounts` | Contas de Instagram vinculadas |
| `video_reel` | Cada reel adicionado (URL, thumbnail, data) |
| `reels_daily_stats` | Métricas diárias de cada reel (views, likes, etc.) |

### Passo 3 — Crie o bucket de storage (para thumbnails)

1. No menu lateral, clique em **Storage**
2. Clique em **New bucket**
3. Nome: `dowload-image` *(atenção: escreva exatamente assim)*
4. Marque a opção **Public bucket**
5. Clique em **Save**

### Passo 4 — Copie as chaves do projeto

1. No menu lateral, clique em **Project Settings** → **API**
2. Copie os valores:
   - **Project URL** → cole em `VITE_SUPABASE_URL` no seu `.env`
   - **anon / public key** → cole em `VITE_SUPABASE_PUBLISHABLE_KEY` no seu `.env`

### Passo 5 — Faça deploy das Edge Functions

As Edge Functions são as funções que recebem dados do n8n e processam os reels. Para fazer o deploy, você vai precisar do [Supabase CLI](https://supabase.com/docs/guides/cli).

**Instalando o Supabase CLI:**

```bash
npm install -g supabase
```

**Fazendo login e linkando ao seu projeto:**

```bash
supabase login
supabase link --project-ref SEU_PROJECT_ID
```

> O `SEU_PROJECT_ID` está na URL do seu projeto no Supabase: `https://supabase.com/dashboard/project/SEU_PROJECT_ID`

**Fazendo deploy de todas as funções:**

```bash
supabase functions deploy add-reel-webhook
supabase functions deploy reels-sync-webhook
supabase functions deploy cache_image_to_storage
supabase functions deploy verify-instagram-account
```

### Passo 6 — Configure os Secrets das funções

Os secrets são variáveis de ambiente que só as Edge Functions conseguem ler (não ficam expostos no frontend).

1. No Supabase, vá em **Edge Functions** → clique em qualquer função → **Secrets**
2. Adicione as seguintes variáveis:

| Nome | Valor | Obrigatório |
|------|-------|-------------|
| `N8N_WEBHOOK_URL` | URL de produção do webhook n8n (veja seção abaixo) | ✅ Sim |
| `CRON_SECRET` | Uma senha aleatória e segura (ex: `openssl rand -base64 32`) | ✅ Sim |
| `ALLOWED_ORIGIN` | URL do seu frontend em produção (ex: `https://reelpulse.com.br`) | ✅ Em produção |

> **Dica:** o `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são preenchidos automaticamente pelo Supabase em todas as Edge Functions — você não precisa configurar.

---

## Configurando as automações com n8n

O n8n é responsável por duas coisas:
1. **Processar novos reels** — quando você adiciona uma URL, o n8n busca os dados do Instagram
2. **Atualizar métricas diariamente** — um cron job que roda todo dia e atualiza views, likes, etc.

### Opção A — n8n Cloud (mais fácil)

1. Crie uma conta em [n8n.io](https://n8n.io)
2. Crie um novo **Workflow**

### Opção B — n8n Self-Hosted

Se você já tem um servidor, pode instalar o n8n com Docker:

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

Acesse em `http://seu-servidor:5678`

---

### Workflow 1 — Processar novo reel

Este workflow é acionado sempre que alguém adiciona uma URL de reel no painel.

**Como configurar:**

1. Crie um novo workflow no n8n
2. Adicione um nó **Webhook** como trigger
   - Method: `POST`
   - Mude para o modo **Production** (não teste)
   - Copie a URL gerada — ela vai no Secret `N8N_WEBHOOK_URL` do Supabase
3. Adicione os nós para buscar dados do Instagram (via HTTP Request ou scraping)
4. O n8n deve retornar um JSON com esta estrutura:

```json
{
  "instagram_external_id": "ID_DO_REEL",
  "thumbnail_url": "https://url-da-imagem.jpg",
  "posted_at": "25/12/2024",
  "views_count": 1500,
  "plays_count": 2000,
  "likes_count": 300,
  "comments_count": 45
}
```

> **Importante:** use sempre o modo **Production** do webhook no n8n, nunca o modo Test. No modo Test, o n8n não retorna o JSON e o reel não será processado.

---

### Workflow 2 — Atualizar métricas diariamente (Cron)

Este workflow roda automaticamente todo dia e atualiza as estatísticas de todos os reels.

**Como configurar:**

1. Crie um novo workflow no n8n
2. Adicione um nó **Schedule Trigger** (ex: todo dia às 08:00)
3. Faça uma requisição `GET` para a Edge Function do Supabase para buscar todos os reels:
   ```
   GET https://SEU_PROJECT_ID.supabase.co/functions/v1/reels-sync-webhook
   Header: x-cron-secret: SUA_CRON_SECRET
   ```
4. Para cada reel retornado, busque os dados atualizados do Instagram
5. Envie as métricas de volta via `POST` para a mesma URL:
   ```
   POST https://SEU_PROJECT_ID.supabase.co/functions/v1/reels-sync-webhook
   Header: x-cron-secret: SUA_CRON_SECRET
   Body: [
     {
       "video_reel_id": "uuid-do-reel",
       "views": 1600,
       "likes": 320,
       "comments": 50,
       "plays": 2100
     }
   ]
   ```

---

## Variáveis de ambiente

### Frontend (arquivo `.env`)

| Variável | Onde encontrar |
|----------|---------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → anon/public key |
| `VITE_DEMO_EMAIL` *(opcional)* | E-mail de uma conta demo para testes locais |
| `VITE_DEMO_PASSWORD` *(opcional)* | Senha da conta demo para testes locais |

> O botão "Entrar com demo" na tela de login só aparece se `VITE_DEMO_EMAIL` e `VITE_DEMO_PASSWORD` estiverem definidos. Em produção, deixe esses campos em branco.

### Edge Functions (Supabase Secrets)

| Variável | Descrição |
|----------|-----------|
| `N8N_WEBHOOK_URL` | URL de produção do webhook n8n (Workflow 1) |
| `CRON_SECRET` | Senha para autenticar chamadas do cron (Workflow 2) |
| `ALLOWED_ORIGIN` | Domínio do frontend em produção (restringe CORS) |

---

## Deploy em produção

### Frontend

O projeto é compatível com qualquer serviço de hospedagem de sites estáticos:

**Vercel (recomendado):**
1. Conecte o repositório GitHub na [Vercel](https://vercel.com)
2. Adicione as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`) nas configurações do projeto
3. Cada push na branch `main` faz deploy automático

**Outros:** Netlify, Cloudflare Pages ou qualquer CDN que suporte sites estáticos.

---

### Checklist antes de ir ao ar

- [ ] Migrations rodadas no Supabase
- [ ] Bucket `dowload-image` criado como público
- [ ] Edge Functions deployadas (4 funções)
- [ ] Secrets configurados no Supabase (`N8N_WEBHOOK_URL`, `CRON_SECRET`, `ALLOWED_ORIGIN`)
- [ ] Workflow 1 do n8n em modo **Production** (não teste)
- [ ] Workflow 2 do n8n com cron agendado
- [ ] Variáveis de ambiente configuradas no serviço de hospedagem do frontend
- [ ] `.env` **não** commitado no repositório (já está no `.gitignore`)

---

## Tecnologias utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Interface | React 18 + TypeScript + Vite |
| Componentes | shadcn/ui + Tailwind CSS |
| Animações | Framer Motion |
| Gráficos | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Funções serverless | Supabase Edge Functions (Deno) |
| Automações | n8n |
| CI/CD | GitHub Actions |
