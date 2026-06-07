(function () {
  var USERS_KEY = "mercado_users";
  var SESSION_KEY = "mercado_session";
  var cachedUser = null;
  var initPromise = null;

  function useApi() {
    return window.ApiClient && ApiClient.isConfigured();
  }

  function normalizePhone(s) {
    if (window.PhoneField) return PhoneField.normalize(s);
    return String(s || "").replace(/\D/g, "");
  }

  function checkPhone(value) {
    if (window.PhoneField) return PhoneField.validate(value);
    var digits = normalizePhone(value);
    var ok = digits.length >= 10 && digits.length <= 13;
    return {
      ok: ok,
      error: ok ? "" : "Informe um telefone válido (com DDD e número completo).",
      formatted: String(value || "").trim(),
      digits: digits,
    };
  }

  function formatPhoneStored(value) {
    var v = checkPhone(value);
    return v.formatted || String(value || "").trim();
  }

  function normalizeBirthDate(s) {
    var raw = String(s || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    var digits = raw.replace(/\D/g, "");
    if (digits.length === 8) {
      var d = parseInt(digits.slice(0, 2), 10);
      var m = parseInt(digits.slice(2, 4), 10);
      var y = parseInt(digits.slice(4, 8), 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        return String(y) + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      }
    }
    return "";
  }

  function isValidBirthDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    var parts = iso.split("-");
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (y < 1900 || y > new Date().getFullYear()) return false;
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    var dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function formatBirthDateBR(iso) {
    if (!iso || iso.indexOf("-") === -1) return iso || "";
    var p = iso.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  function buildAddress(data) {
    return {
      cep: String(data.cep).trim(),
      street: String(data.street).trim(),
      number: String(data.number).trim(),
      complement: String(data.complement || "").trim(),
      neighborhood: String(data.neighborhood).trim(),
      city: String(data.city).trim(),
    };
  }

  function validateAddress(data) {
    if (!String(data.street || "").trim()) return "Informe o logradouro.";
    if (!String(data.number || "").trim()) return "Informe o número.";
    if (!String(data.neighborhood || "").trim()) return "Informe o bairro.";
    if (!String(data.city || "").trim()) return "Informe a cidade.";
    if (!String(data.cep || "").trim()) return "Informe o CEP.";
    return null;
  }

  function mapApiUser(u) {
    if (!u) return null;
    return {
      id: u.id,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      name: u.name || "",
      phone: u.phone || "",
      birthDate: u.birthDate || "",
      birthDateBR: formatBirthDateBR(u.birthDate || ""),
      role: u.role || "customer",
      address: u.address || null,
    };
  }

  /* ---------- localStorage (fallback dev) ---------- */

  function getUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function setUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }

  function findByPhoneLocal(phone) {
    var p = normalizePhone(phone);
    if (!p) return null;
    var list = getUsers();
    for (var i = 0; i < list.length; i++) {
      if (normalizePhone(list[i].phone) === p) return { user: list[i], index: i };
    }
    return null;
  }

  function birthDateMatchesLocal(user, input) {
    var iso = normalizeBirthDate(input);
    if (!iso) return false;
    if (user.birthDate) return user.birthDate === iso;
    if (user.password) return user.password === iso || user.password === input;
    return false;
  }

  function userToPublicLocal(u) {
    var addr = u.address;
    var copy = addr
      ? {
          cep: addr.cep,
          street: addr.street,
          number: addr.number,
          complement: addr.complement,
          neighborhood: addr.neighborhood,
          city: addr.city,
        }
      : null;
    var first = u.firstName || (u.name || "").split(" ")[0] || "";
    var last = u.lastName || (u.name || "").split(" ").slice(1).join(" ") || "";
    return {
      firstName: first,
      lastName: last,
      name: (first + " " + last).trim() || u.name,
      phone: u.phone,
      birthDate: u.birthDate || "",
      birthDateBR: formatBirthDateBR(u.birthDate || ""),
      role: u.role || "customer",
      address: copy,
    };
  }

  function getCurrentUserLocal() {
    if (!localStorage.getItem(SESSION_KEY)) return null;
    var found = findByPhoneLocal(localStorage.getItem(SESSION_KEY));
    if (!found) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return userToPublicLocal(found.user);
  }

  /* ---------- API + init ---------- */

  function init() {
    if (!initPromise) {
      initPromise = (async function () {
        if (!useApi()) {
          cachedUser = getCurrentUserLocal();
          return;
        }
        if (!ApiClient.getToken()) {
          cachedUser = null;
          return;
        }
        var r = await ApiClient.get("me");
        if (r.ok && r.user) {
          cachedUser = mapApiUser(r.user);
        } else {
          ApiClient.clearToken();
          cachedUser = null;
        }
      })();
    }
    return initPromise;
  }

  function isLoggedIn() {
    if (useApi()) return Boolean(ApiClient.getToken() && cachedUser);
    return Boolean(localStorage.getItem(SESSION_KEY));
  }

  function isAdmin() {
    var u = getCurrentUser();
    return u && u.role === "admin";
  }

  function getCurrentUser() {
    if (useApi()) return cachedUser;
    return getCurrentUserLocal();
  }

  function getCurrentUserForMessage() {
    return getCurrentUser();
  }

  async function register(data) {
    if (useApi()) {
      var r = await ApiClient.post("register", data, false);
      if (!r.ok) return { ok: false, error: r.error };
      ApiClient.setToken(r.token);
      cachedUser = mapApiUser(r.user);
      return { ok: true };
    }

    var phoneCheck = checkPhone(data.phone);
    if (!phoneCheck.ok) return { ok: false, error: phoneCheck.error };
    if (findByPhoneLocal(phoneCheck.digits)) {
      return { ok: false, error: "Este telefone já está cadastrado." };
    }
    var firstName = String(data.firstName || "").trim();
    var lastName = String(data.lastName || "").trim();
    if (!firstName) return { ok: false, error: "Informe o nome." };
    if (!lastName) return { ok: false, error: "Informe o sobrenome." };
    var birthIso = normalizeBirthDate(data.birthDate);
    if (!birthIso || !isValidBirthDate(birthIso)) {
      return { ok: false, error: "Informe uma data de nascimento válida." };
    }
    var addrErr = validateAddress(data);
    if (addrErr) return { ok: false, error: addrErr };

    var user = {
      firstName: firstName,
      lastName: lastName,
      birthDate: birthIso,
      phone: formatPhoneStored(data.phone),
      role: "customer",
      address: buildAddress(data),
    };
    var list = getUsers();
    list.push(user);
    setUsers(list);
    localStorage.setItem(SESSION_KEY, phoneCheck.digits);
    cachedUser = userToPublicLocal(user);
    return { ok: true };
  }

  async function login(phone, birthDateInput) {
    if (useApi()) {
      var r = await ApiClient.post(
        "login",
        { phone: phone, birthDate: birthDateInput },
        false
      );
      if (!r.ok) return { ok: false, error: r.error };
      ApiClient.setToken(r.token);
      cachedUser = mapApiUser(r.user);
      return { ok: true };
    }

    var digits = normalizePhone(phone);
    if (!digits) return { ok: false, error: "Informe o telefone." };
    var found = findByPhoneLocal(digits);
    if (!found) return { ok: false, error: "Telefone ou data de nascimento incorretos." };
    if (!birthDateMatchesLocal(found.user, birthDateInput)) {
      return { ok: false, error: "Telefone ou data de nascimento incorretos." };
    }
    localStorage.setItem(SESSION_KEY, digits);
    cachedUser = userToPublicLocal(found.user);
    return { ok: true };
  }

  async function logout() {
    if (useApi()) {
      await ApiClient.post("logout", {});
      ApiClient.clearToken();
      cachedUser = null;
      return;
    }
    localStorage.removeItem(SESSION_KEY);
    cachedUser = null;
  }

  async function resetPassword(data) {
    if (useApi()) {
      var r = await ApiClient.post("reset-birthdate", data, false);
      return r.ok ? { ok: true } : { ok: false, error: r.error };
    }

    var phoneCheck = checkPhone(data.phone);
    if (!phoneCheck.ok) return { ok: false, error: phoneCheck.error };
    var found = findByPhoneLocal(phoneCheck.digits);
    if (!found) return { ok: false, error: "Não encontramos uma conta com este telefone." };
    var birthIso = normalizeBirthDate(data.birthDate);
    var confirmIso = normalizeBirthDate(data.birthDateConfirm);
    if (!birthIso || !isValidBirthDate(birthIso)) {
      return { ok: false, error: "Informe uma data de nascimento válida." };
    }
    if (birthIso !== confirmIso) {
      return { ok: false, error: "As datas de nascimento não coincidem." };
    }
    found.user.birthDate = birthIso;
    var list = getUsers();
    list[found.index] = found.user;
    setUsers(list);
    return { ok: true };
  }

  async function updateProfile(data) {
    if (useApi()) {
      var body = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
      };
      if (data.birthDate) {
        body.birthDate = data.birthDate;
        body.currentBirthDate = data.currentBirthDate;
      }
      var r = await ApiClient.patch("me", body);
      if (!r.ok) return { ok: false, error: r.error };
      cachedUser = mapApiUser(r.user);
      return { ok: true };
    }

    if (!isLoggedIn()) return { ok: false, error: "Não autenticado." };
    var found = findByPhoneLocal(localStorage.getItem(SESSION_KEY));
    if (!found) {
      localStorage.removeItem(SESSION_KEY);
      return { ok: false, error: "Sessão inválida. Faça login de novo." };
    }

    var firstName = String(data.firstName || "").trim();
    var lastName = String(data.lastName || "").trim();
    if (!firstName) return { ok: false, error: "Informe o nome." };
    if (!lastName) return { ok: false, error: "Informe o sobrenome." };
    var phoneCheck = checkPhone(data.phone);
    if (!phoneCheck.ok) return { ok: false, error: phoneCheck.error };
    var addrErr = validateAddress(data);
    if (addrErr) return { ok: false, error: addrErr };

    var u = found.user;
    u.firstName = firstName;
    u.lastName = lastName;
    u.phone = formatPhoneStored(data.phone);
    u.address = buildAddress(data);

    if (data.birthDate) {
      var newBirth = normalizeBirthDate(data.birthDate);
      if (!newBirth || !isValidBirthDate(newBirth)) {
        return { ok: false, error: "Informe uma data de nascimento válida." };
      }
      if (!data.currentBirthDate) {
        return { ok: false, error: "Informe a data de nascimento atual para alterá-la." };
      }
      if (!birthDateMatchesLocal(u, data.currentBirthDate)) {
        return { ok: false, error: "A data de nascimento atual não confere." };
      }
      u.birthDate = newBirth;
    }

    var list = getUsers();
    list[found.index] = u;
    setUsers(list);
    localStorage.setItem(SESSION_KEY, phoneCheck.digits);
    cachedUser = userToPublicLocal(u);
    return { ok: true };
  }

  window.Auth = {
    init: init,
    register: register,
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    isAdmin: isAdmin,
    getCurrentUser: getCurrentUser,
    updateProfile: updateProfile,
    resetPassword: resetPassword,
    normalizeBirthDate: normalizeBirthDate,
    formatBirthDateBR: formatBirthDateBR,
  };
})();
