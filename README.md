# Noboru Poke — Supabase + Vercel

Site estático (HTML/CSS/JS) com **login e cardápio na nuvem** via Supabase.

## URLs

- Site: https://noborupoke.vercel.app
- Repositório: https://github.com/phmltecnologia/NOBORU_POKE

## Configuração Supabase (projeto ativo — via Vercel)

- **URL:** https://eqlhhcnrsbyniacrqrvs.supabase.co  
- **Dashboard:** https://supabase.com/dashboard/project/eqlhhcnrsbyniacrqrvs  
- **Guia passo a passo:** [`supabase/SETUP.md`](supabase/SETUP.md)

1. Rode o SQL em [`supabase/RUN_IN_SQL_EDITOR.sql`](supabase/RUN_IN_SQL_EDITOR.sql) no SQL Editor.
2. Deploy da Edge Function `noboru` (dashboard ou CLI com `--no-verify-jwt`).
3. Vercel: integração Supabase injeta `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` → redeploy.

## Configuração Supabase (geral)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute o arquivo [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql).
3. Instale a [Supabase CLI](https://supabase.com/docs/guides/cli) e faça deploy da Edge Function:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy noboru --no-verify-jwt
```

A função `noboru` usa automaticamente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do projeto.

4. Em **Project Settings → API**, copie:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`

## Vercel

Em **Project → Settings → Environment Variables**:

| Variável | Valor |
|----------|--------|
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | chave anon |

O build roda `node scripts/generate-config.mjs` e gera `js/config.js`.

## Desenvolvimento local

Copie [`js/config.example.js`](js/config.example.js) para `js/config.js` e preencha URL + anon key.

Sem Supabase configurado, o site usa **localStorage** (modo protótipo, dados só no navegador).

## Login admin da loja (após migration)

| Campo | Valor |
|-------|--------|
| Telefone | `48998078186` ou `(48) 99807-8186` |
| Data de nascimento | `2006-03-11` |
| Permissão | `admin` — único perfil que vê o botão **Cardápio** |

Clientes cadastrados recebem `role = customer` e não editam o cardápio.

## Arquitetura

- **Front:** Vercel (estático)
- **Auth + CRUD cardápio:** Edge Function `noboru`
- **Dados:** Postgres (`profiles`, `sessions`, `menu_items`)
- **Fotos dos pratos:** Storage bucket `menu-images`

## Endpoints da Edge Function

Base: `{SUPABASE_URL}/functions/v1/noboru/`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `register` | Cadastro cliente |
| POST | `login` | Login (telefone + data nascimento) |
| POST | `logout` | Sair |
| GET/PATCH | `me` | Perfil (requer token) |
| POST | `reset-birthdate` | Redefinir data de nascimento |
| GET | `menu` | Cardápio público |
| POST | `menu` | Salvar item (admin) |
| DELETE | `menu-{id}` | Remover item (admin) |
| POST | `upload-image` | Upload foto (admin) |

Token de sessão: guardado em `sessionStorage` (`noboru_session_token`).
