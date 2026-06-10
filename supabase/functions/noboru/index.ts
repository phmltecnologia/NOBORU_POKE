import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ ok: false, error: message }, status);
}

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhoneDigits(phone: string) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) return d;
  if (d.length >= 10 && d.length <= 11) return "55" + d;
  return d;
}

function normalizeBirthDate(s: string) {
  const raw = String(s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return "";
}

function profileToPublic(row: Record<string, unknown>) {
  const addr = (row.address as Record<string, string>) || {};
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: `${row.first_name} ${row.last_name}`.trim(),
    phone: row.phone_display,
    birthDate: row.birth_date,
    role: row.role,
    address: {
      cep: addr.cep || "",
      street: addr.street || "",
      number: addr.number || "",
      complement: addr.complement || "",
      neighborhood: addr.neighborhood || "",
      city: addr.city || "",
    },
  };
}

async function createSession(supabase: ReturnType<typeof getServiceClient>, profileId: string) {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const tokenHash = await sha256(token);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("sessions").insert({
    profile_id: profileId,
    token_hash: tokenHash,
    expires_at: expires,
  });
  if (error) throw error;
  return token;
}

async function getSessionProfile(supabase: ReturnType<typeof getServiceClient>, authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.length < 20) return null;
  const tokenHash = await sha256(token);
  const { data: sessions } = await supabase
    .from("sessions")
    .select("profile_id, expires_at")
    .eq("token_hash", tokenHash)
    .limit(1);
  if (!sessions?.length) return null;
  const sess = sessions[0];
  if (new Date(sess.expires_at) < new Date()) return null;
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sess.profile_id)
    .limit(1);
  return profiles?.[0] || null;
}

async function requireAdmin(supabase: ReturnType<typeof getServiceClient>, authHeader: string | null) {
  const profile = await getSessionProfile(supabase, authHeader);
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

function slugCategoryId(name: string) {
  const s = String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "outros";
}

function rowToCategory(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: Number(row.sort_order) || 0,
  };
}

function rowToMenuItem(row: Record<string, unknown>, catName?: string) {
  const item: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    desc: row.desc,
    category: catName || row.category,
    categoryId: row.category_id || null,
    categoryName: catName || row.category,
  };
  if (row.option_layers && Array.isArray(row.option_layers) && row.option_layers.length) {
    item.optionLayers = row.option_layers;
  }
  if (row.custom_poke) item.customPoke = true;
  if (row.size_prices) item.sizePrices = row.size_prices;
  if (row.image_url) item.image = row.image_url;
  if (row.sort_order != null) item.sort_order = row.sort_order;
  return item;
}

function itemIdSafe(id: string) {
  return String(id).replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const action = parts[parts.length - 1] || "";
  const supabase = getServiceClient();
  const authHeader = req.headers.get("Authorization");

  try {
    if (req.method === "POST" && action === "register") {
      const body = await req.json();
      const phoneDigits = normalizePhoneDigits(body.phone);
      if (phoneDigits.length < 12) return err("Telefone inválido.");
      const birthDate = normalizeBirthDate(body.birthDate);
      if (!birthDate) return err("Data de nascimento inválida.");
      const firstName = String(body.firstName || "").trim();
      const lastName = String(body.lastName || "").trim();
      if (!firstName || !lastName) return err("Informe nome e sobrenome.");

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone_digits", phoneDigits)
        .limit(1);
      if (existing?.length) return err("Este telefone já está cadastrado.");

      const { data: hashRow, error: hashErr } = await supabase.rpc("hash_birth_date", {
        p_birth_date: birthDate,
      });
      if (hashErr) return err("Erro ao criar conta.", 500);

      const address = {
        cep: String(body.cep || "").trim(),
        street: String(body.street || "").trim(),
        number: String(body.number || "").trim(),
        complement: String(body.complement || "").trim(),
        neighborhood: String(body.neighborhood || "").trim(),
        city: String(body.city || "").trim(),
      };

      const { data: inserted, error: insErr } = await supabase
        .from("profiles")
        .insert({
          phone_digits: phoneDigits,
          phone_display: String(body.phone || "").trim(),
          first_name: firstName,
          last_name: lastName,
          role: "customer",
          birth_date: birthDate,
          birth_date_hash: hashRow,
          address,
        })
        .select("*")
        .single();
      if (insErr) return err(insErr.message, 500);

      const token = await createSession(supabase, inserted.id);
      return json({ ok: true, token, user: profileToPublic(inserted) });
    }

    if (req.method === "POST" && action === "login") {
      const body = await req.json();
      const phoneDigits = normalizePhoneDigits(body.phone);
      const birthDate = normalizeBirthDate(body.birthDate);
      if (!phoneDigits || !birthDate) return err("Telefone ou data de nascimento incorretos.", 401);

      const { data: profileId, error: loginErr } = await supabase.rpc("login_with_birth", {
        p_phone_digits: phoneDigits,
        p_birth_date: birthDate,
      });
      if (loginErr || !profileId) {
        return err("Telefone ou data de nascimento incorretos.", 401);
      }

      const { data: full } = await supabase.from("profiles").select("*").eq("id", profileId).single();
      if (!full) return err("Conta não encontrada.", 404);
      const token = await createSession(supabase, full.id);
      return json({ ok: true, token, user: profileToPublic(full) });
    }

    if (req.method === "POST" && action === "logout") {
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (token) {
        const tokenHash = await sha256(token);
        await supabase.from("sessions").delete().eq("token_hash", tokenHash);
      }
      return json({ ok: true });
    }

    if (req.method === "GET" && action === "me") {
      const profile = await getSessionProfile(supabase, authHeader);
      if (!profile) return err("Não autenticado.", 401);
      return json({ ok: true, user: profileToPublic(profile) });
    }

    if (req.method === "PATCH" && action === "me") {
      const profile = await getSessionProfile(supabase, authHeader);
      if (!profile) return err("Não autenticado.", 401);
      const body = await req.json();

      const updates: Record<string, unknown> = {
        first_name: String(body.firstName || profile.first_name).trim(),
        last_name: String(body.lastName || profile.last_name).trim(),
        phone_display: String(body.phone || profile.phone_display).trim(),
        address: {
          cep: String(body.cep || "").trim(),
          street: String(body.street || "").trim(),
          number: String(body.number || "").trim(),
          complement: String(body.complement || "").trim(),
          neighborhood: String(body.neighborhood || "").trim(),
          city: String(body.city || "").trim(),
        },
      };

      const newDigits = normalizePhoneDigits(body.phone);
      if (newDigits && newDigits !== profile.phone_digits) {
        const { data: other } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone_digits", newDigits)
          .neq("id", profile.id)
          .limit(1);
        if (other?.length) return err("Este telefone já está em uso.");
        updates.phone_digits = newDigits;
      }

      if (body.birthDate && body.currentBirthDate) {
        const newBirth = normalizeBirthDate(body.birthDate);
        const curBirth = normalizeBirthDate(body.currentBirthDate);
        if (!newBirth) return err("Nova data de nascimento inválida.");
        const { data: curId } = await supabase.rpc("login_with_birth", {
          p_phone_digits: profile.phone_digits,
          p_birth_date: curBirth,
        });
        if (!curId) return err("A data de nascimento atual não confere.");
        const { data: newHash } = await supabase.rpc("hash_birth_date", { p_birth_date: newBirth });
        updates.birth_date = newBirth;
        updates.birth_date_hash = newHash;
      }

      const { data: updated, error: upErr } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id)
        .select("*")
        .single();
      if (upErr) return err(upErr.message, 500);
      return json({ ok: true, user: profileToPublic(updated) });
    }

    if (req.method === "POST" && action === "reset-birthdate") {
      const body = await req.json();
      const phoneDigits = normalizePhoneDigits(body.phone);
      const birthDate = normalizeBirthDate(body.birthDate);
      const confirm = normalizeBirthDate(body.birthDateConfirm);
      if (birthDate !== confirm) return err("As datas de nascimento não coincidem.");
      const { data: rows } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone_digits", phoneDigits)
        .limit(1);
      if (!rows?.length) return err("Não encontramos uma conta com este telefone.");
      const { data: newHash } = await supabase.rpc("hash_birth_date", { p_birth_date: birthDate });
      await supabase
        .from("profiles")
        .update({ birth_date: birthDate, birth_date_hash: newHash })
        .eq("id", rows[0].id);
      return json({ ok: true });
    }

    if (req.method === "GET" && action === "categories") {
      const { data, error: catErr } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (catErr) return err(catErr.message, 500);
      return json({ ok: true, categories: (data || []).map(rowToCategory) });
    }

    if (req.method === "POST" && action === "categories") {
      const admin = await requireAdmin(supabase, authHeader);
      if (!admin) return err("Sem permissão.", 403);
      const body = await req.json();
      const name = String(body.name || "").trim();
      if (!name) return err("Nome da categoria obrigatório.");
      const id = String(body.id || "").trim() || slugCategoryId(name);
      const row = {
        id,
        name,
        sort_order: Number(body.sortOrder) || 999,
        active: true,
      };
      const { error: upsErr } = await supabase.from("menu_categories").upsert(row);
      if (upsErr) return err(upsErr.message, 500);
      return json({ ok: true, category: rowToCategory(row) });
    }

    if (req.method === "PATCH" && action.startsWith("categories-")) {
      const admin = await requireAdmin(supabase, authHeader);
      if (!admin) return err("Sem permissão.", 403);
      const catId = decodeURIComponent(action.slice("categories-".length));
      const body = await req.json();
      const updates: Record<string, unknown> = {};
      if (body.name != null) updates.name = String(body.name).trim();
      if (body.sortOrder != null) updates.sort_order = Number(body.sortOrder);
      if (Object.keys(updates).length === 0) return err("Nada para atualizar.");
      const { data: updated, error: upErr } = await supabase
        .from("menu_categories")
        .update(updates)
        .eq("id", catId)
        .select("*")
        .single();
      if (upErr) return err(upErr.message, 500);
      return json({ ok: true, category: rowToCategory(updated) });
    }

    if (req.method === "DELETE" && action.startsWith("categories-")) {
      const admin = await requireAdmin(supabase, authHeader);
      if (!admin) return err("Sem permissão.", 403);
      const catId = decodeURIComponent(action.slice("categories-".length));
      const { count } = await supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true })
        .eq("category_id", catId)
        .eq("active", true);
      if (count && count > 0) {
        return err("Não é possível excluir: há itens nesta categoria.", 400);
      }
      await supabase.from("menu_categories").update({ active: false }).eq("id", catId);
      return json({ ok: true });
    }

    if (req.method === "GET" && action === "menu") {
      const { data: cats } = await supabase
        .from("menu_categories")
        .select("id, name")
        .eq("active", true);
      const catMap: Record<string, string> = {};
      for (const c of cats || []) {
        catMap[c.id as string] = c.name as string;
      }
      const { data, error: menuErr } = await supabase
        .from("menu_items")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (menuErr) return err(menuErr.message, 500);
      return json({
        ok: true,
        items: (data || []).map((row) =>
          rowToMenuItem(row, catMap[row.category_id as string] || (row.category as string))
        ),
      });
    }

    if (req.method === "POST" && action === "menu") {
      const admin = await requireAdmin(supabase, authHeader);
      if (!admin) return err("Sem permissão.", 403);
      const body = await req.json();
      const id = String(body.id || "").trim();
      if (!id) return err("ID do item obrigatório.");
      const categoryId = String(body.categoryId || "").trim();
      let categoryName = String(body.category || "Outros").trim();
      if (categoryId) {
        const { data: catRow } = await supabase
          .from("menu_categories")
          .select("name")
          .eq("id", categoryId)
          .limit(1);
        if (catRow?.length) categoryName = catRow[0].name as string;
      }
      const optionLayers = Array.isArray(body.optionLayers) ? body.optionLayers : [];
      const row = {
        id,
        name: String(body.name || "").trim(),
        desc: String(body.desc || "").trim(),
        category: categoryName,
        category_id: categoryId || null,
        option_layers: optionLayers,
        price: Number(body.price) || 0,
        image_url: body.image ? String(body.image).trim() : null,
        custom_poke: optionLayers.length > 1,
        size_prices: body.sizePrices || null,
        sort_order: Number(body.sort_order) || 999,
        active: true,
        updated_at: new Date().toISOString(),
      };
      const { error: upsErr } = await supabase.from("menu_items").upsert(row);
      if (upsErr) return err(upsErr.message, 500);
      return json({ ok: true, item: rowToMenuItem(row, categoryName) });
    }

    if (req.method === "DELETE" && action.startsWith("menu-")) {
      const admin = await requireAdmin(supabase, authHeader);
      if (!admin) return err("Sem permissão.", 403);
      const itemId = decodeURIComponent(action.slice("menu-".length));
      await supabase
        .from("menu_items")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("id", itemId);
      return json({ ok: true });
    }

    if (req.method === "POST" && action === "upload-image") {
      const admin = await requireAdmin(supabase, authHeader);
      if (!admin) return err("Sem permissão.", 403);
      const body = await req.json();
      const dataUrl = String(body.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return err("Imagem inválida.");
      const mime = match[1];
      const ext = mime.split("/")[1].replace("jpeg", "jpg");
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      const path = `${itemIdSafe(body.itemId || "item")}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("menu-images").upload(path, bytes, {
        contentType: mime,
        upsert: true,
      });
      if (upErr) return err(upErr.message, 500);
      const { data: pub } = supabase.storage.from("menu-images").getPublicUrl(path);
      return json({ ok: true, url: pub.publicUrl });
    }

    return err("Rota não encontrada.", 404);
  } catch (e) {
    console.error(e);
    return err("Erro interno.", 500);
  }
});
