# Deploy & Setup Guide

Resumo rápido: Frontend/API (Next.js) → Vercel (serverless functions). Worker (BullMQ) → Render (service) ou localmente com `npm run worker`.

1) Instalação local

Abra PowerShell na pasta do projeto e execute:

```powershell
# instalar dependências
npm install

# rodar em modo dev (Next.js)
npm run dev

# em outro terminal, rodar worker (opcional)
npm run worker
```

2) Variáveis de ambiente

Crie um arquivo `.env.local` com as variáveis listadas em `.env.example`. No Vercel/Render, configure as mesmas variáveis nos Secrets/Environment.

Notas importantes:
- `FIREBASE_ADMIN_PRIVATE_KEY` deve ser inserida com `\n` em lugar das quebras de linha (algumas UIs requerem isso).
- `NEXT_PUBLIC_` prefixa variáveis que também são expostas ao client.

3) Deploy na Vercel (Frontend + API routes)

- Conectar repositório GitHub no Vercel.
- Em Project Settings → Environment Variables, adicione as variáveis do `.env.example` (todas as `NEXT_PUBLIC_...` e as chaves server-only também).
- Build Command: `npm run build`
- Output Directory: (Next.js App Router padrão) deixe vazio.

4) Deploy do Worker (Render)

- Criar um novo service em Render (Private Service ou Web Service).
- Escolher o repositório e a branch `main`.
- Build command: `npm run build` (opcional)
- Start command: `npm run worker`
- Em Environment, adicione `REDIS_URL` (ex.: Upstash) e `BREVO_API_KEY`, `FIREBASE_*` (server keys) e `CLOUDINARY_*`.

Alternativa rápida para worker sem infra: usar um cron GitHub Action ou uma instância pequena no Render/Heroku.

5) Cloudinary upload

- Para uploads diretos do client: gerar `signature` do server (rota `/api/cloudinary-sign`) e usar o `signature` no upload.

6) Stripe

- Criar produtos and prices no Dashboard do Stripe e usar o `priceId` no frontend para iniciar o Checkout (rota `/api/stripe-checkout`).

7) Brevo (envio de email)

- Coloque `BREVO_API_KEY` nas envs do Vercel/Render.
- Use a rota server `/api/brevo-send` ou o worker para enviar em massa via BullMQ.

8) Webhooks

- No Stripe: configure Webhook URL para uma API route (ex.: `/api/webhooks/stripe`) e adicione o Signing Secret nas envs.
- No Brevo: configure webhooks para um endpoint server (ex.: `/api/webhooks/brevo`) para receber bounces/opens.

9) Observabilidade e alertas

- Adicione Sentry (DSN) nas envs para captura de erros. Monitorar uso do Firestore e custos.

10) Notas finais

- Teste todos os fluxos localmente antes de promover para produção.
- Proteja endpoints sensíveis, verifique tokens Firebase no server com o Admin SDK.
