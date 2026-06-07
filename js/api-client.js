/**
 * Cliente HTTP para Supabase REST + Edge Function noboru
 */
(function () {
  var SESSION_TOKEN_KEY = "noboru_session_token";

  function config() {
    return window.SUPABASE_CONFIG || {};
  }

  function isConfigured() {
    var c = config();
    return Boolean(c.url && c.anonKey && c.url.indexOf("SEU_PROJETO") === -1);
  }

  function fnUrl(path) {
    return config().url.replace(/\/$/, "") + "/functions/v1/noboru/" + path;
  }

  function getToken() {
    try {
      return sessionStorage.getItem(SESSION_TOKEN_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setToken(token) {
    try {
      if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      else sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function clearToken() {
    setToken("");
  }

  function baseHeaders(withAuth) {
    var h = {
      "Content-Type": "application/json",
      apikey: config().anonKey,
    };
    var token = withAuth ? getToken() : config().anonKey;
    if (token) h.Authorization = "Bearer " + token;
    return h;
  }

  async function request(path, options) {
    options = options || {};
    var method = options.method || "GET";
    var useAuth = options.auth !== false;
    var res = await fetch(fnUrl(path), {
      method: method,
      headers: baseHeaders(useAuth),
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    var data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText || "Erro de rede." };
    }
    return Object.assign({ ok: true }, data);
  }

  window.ApiClient = {
    isConfigured: isConfigured,
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    get: function (path) {
      return request(path, { method: "GET" });
    },
    post: function (path, body, auth) {
      return request(path, { method: "POST", body: body, auth: auth !== false });
    },
    patch: function (path, body) {
      return request(path, { method: "PATCH", body: body });
    },
    delete: function (path) {
      return request(path, { method: "DELETE" });
    },
    fetchMenu: function () {
      return request("menu", { method: "GET", auth: false });
    },
    upsertMenuItem: function (item) {
      return request("menu", {
        method: "POST",
        body: {
          id: item.id,
          name: item.name,
          desc: item.desc,
          category: item.category,
          price: item.price,
          image: item.image || null,
          customPoke: Boolean(item.customPoke),
          sizePrices: item.sizePrices || null,
          sort_order: item.sort_order,
        },
      });
    },
    deleteMenuItem: function (id) {
      return request("menu-" + encodeURIComponent(String(id)), { method: "DELETE" });
    },
    uploadMenuImage: function (itemId, dataUrl) {
      return request("upload-image", {
        method: "POST",
        body: { itemId: itemId, dataUrl: dataUrl },
      });
    },
  };
})();
