# Configuração Supabase — NOBORU_POKE (via Vercel)

Projeto Supabase: **eqlhhcnrsbyniacrqrvs** (criado pela integração Vercel)  
URL: `https://eqlhhcnrsbyniacrqrvs.supabase.co`

A Vercel sincroniza automaticamente `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, etc.

---

## Passo 1 — Rodar o SQL (só uma vez)

1. Abra: [SQL Editor](https://supabase.com/dashboard/project/eqlhhcnrsbyniacrqrvs/sql/new)
2. Cole **todo** o conteúdo de [`RUN_IN_SQL_EDITOR.sql`](RUN_IN_SQL_EDITOR.sql)
3. Clique **Run** → deve mostrar **20** itens e **1** admin

Login admin:

| Campo | Valor |
|-------|--------|
| Telefone | `(48) 9807-8186` |
| Data de nascimento | `1990-01-01` |

---

## Passo 2 — Edge Function `noboru`

Link direto: [Edge Functions](https://supabase.com/dashboard/project/eqlhhcnrsbyniacrqrvs/functions)

- Nome: **`noboru`**
- Código: [`functions/noboru/index.ts`](functions/noboru/index.ts)

**Importante:** desligar **Verify JWT** (ou deploy via CLI):

```powershell
npx supabase login
npx supabase link --project-ref eqlhhcnrsbyniacrqrvs
npx supabase functions deploy noboru --no-verify-jwt --use-api
```

Abrir a URL no navegador sem header dá `UNAUTHORIZED_NO_AUTH_HEADER` — isso é **normal**. O site envia a chave publishable no header.

Teste com chave (copie da Vercel → Environment Variables → `SUPABASE_PUBLISHABLE_KEY`):

```powershell
curl "https://eqlhhcnrsbyniacrqrvs.supabase.co/functions/v1/noboru/menu" `
  -H "Authorization: Bearer SUA_PUBLISHABLE_KEY" `
  -H "apikey: SUA_PUBLISHABLE_KEY"
```

---

## Passo 3 — Vercel

Integração Supabase já injeta as variáveis. Confira em **Settings → Environment Variables**:

- `SUPABASE_URL` = `https://eqlhhcnrsbyniacrqrvs.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` (ou `SUPABASE_ANON_KEY`)

Depois: **Deployments → Redeploy**.

---

## Passo 4 — Testar

1. https://noborupoke.vercel.app/login.html
2. Login admin acima
3. Botão **Cardápio** visível só para admin

---

## Desenvolvimento local

Em `js/config.js`, use a URL do projeto novo e a publishable key copiada da Vercel.

---

## Apagar o projeto antigo (opcional)

Depois de tudo funcionando no projeto **eqlhhcnrsbyniacrqrvs**:

1. [Dashboard projeto antigo](https://supabase.com/dashboard/project/rnhfljpchgbawwzkmmug/settings/general)
2. **General → Delete project**

Não apague antes de confirmar login e cardápio no site em produção.
