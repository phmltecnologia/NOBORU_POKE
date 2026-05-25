(function () {
  var USERS_KEY = "mercado_users";
  var SESSION_KEY = "mercado_session";

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

  function normalizePhone(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function isValidPhoneDigits(digits) {
    return digits.length >= 10 && digits.length <= 13;
  }

  function normalizeEmail(s) {
    return String(s || "")
      .trim()
      .toLowerCase();
  }

  /** Normaliza para YYYY-MM-DD (aceita input type=date ou DD/MM/AAAA) */
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
        return (
          String(y) +
          "-" +
          String(m).padStart(2, "0") +
          "-" +
          String(d).padStart(2, "0")
        );
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

  function fullName(user) {
    var first = String(user.firstName || "").trim();
    var last = String(user.lastName || "").trim();
    if (first || last) return (first + " " + last).trim();
    return String(user.name || "").trim();
  }

  function splitLegacyName(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  function findByPhone(phone) {
    var p = normalizePhone(phone);
    if (!p) return null;
    var list = getUsers();
    for (var i = 0; i < list.length; i++) {
      if (normalizePhone(list[i].phone) === p) return { user: list[i], index: i };
    }
    return null;
  }

  function findByEmail(email) {
    var e = normalizeEmail(email);
    if (!e) return null;
    var list = getUsers();
    for (var i = 0; i < list.length; i++) {
      if (normalizeEmail(list[i].email) === e) return { user: list[i], index: i };
    }
    return null;
  }

  function resolveSessionUser(sessionValue) {
    if (!sessionValue) return null;
    var byPhone = findByPhone(sessionValue);
    if (byPhone) return byPhone;
    if (sessionValue.indexOf("@") !== -1) {
      return findByEmail(sessionValue);
    }
    return null;
  }

  function setSessionForUser(user) {
    localStorage.setItem(SESSION_KEY, normalizePhone(user.phone));
  }

  function birthDateMatches(user, input) {
    var iso = normalizeBirthDate(input);
    if (!iso) return false;
    if (user.birthDate) {
      return user.birthDate === iso;
    }
    if (user.password) {
      return user.password === iso || user.password === input;
    }
    return false;
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

  function userToPublic(u) {
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
    var legacy = splitLegacyName(u.name);
    return {
      firstName: u.firstName || legacy.firstName,
      lastName: u.lastName || legacy.lastName,
      name: fullName(u),
      phone: u.phone,
      birthDate: u.birthDate || "",
      birthDateBR: formatBirthDateBR(u.birthDate || ""),
      address: copy,
    };
  }

  function register(data) {
    var phoneDigits = normalizePhone(data.phone);
    if (!phoneDigits) return { ok: false, error: "Informe o telefone." };
    if (!isValidPhoneDigits(phoneDigits)) {
      return { ok: false, error: "Informe um telefone válido (com DDD, 10 ou 11 dígitos)." };
    }
    if (findByPhone(phoneDigits)) {
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
      phone: String(data.phone).trim(),
      address: buildAddress(data),
    };

    var list = getUsers();
    list.push(user);
    setUsers(list);
    setSessionForUser(user);
    return { ok: true };
  }

  function login(phone, birthDateInput) {
    var digits = normalizePhone(phone);
    if (!digits) return { ok: false, error: "Informe o telefone." };

    var found = findByPhone(digits);
    if (!found && String(phone || "").indexOf("@") !== -1) {
      found = findByEmail(phone);
    }
    if (!found) {
      return { ok: false, error: "Telefone ou data de nascimento incorretos." };
    }
    if (!birthDateMatches(found.user, birthDateInput)) {
      return { ok: false, error: "Telefone ou data de nascimento incorretos." };
    }
    setSessionForUser(found.user);
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    return Boolean(localStorage.getItem(SESSION_KEY));
  }

  function getCurrentUser() {
    if (!isLoggedIn()) return null;
    var session = localStorage.getItem(SESSION_KEY);
    var found = resolveSessionUser(session);
    if (!found) {
      logout();
      return null;
    }
    return userToPublic(found.user);
  }

  function getCurrentUserForMessage() {
    return getCurrentUser();
  }

  function resetPassword(data) {
    var phoneDigits = normalizePhone(data.phone);
    if (!phoneDigits) return { ok: false, error: "Informe o telefone." };
    if (!isValidPhoneDigits(phoneDigits)) {
      return { ok: false, error: "Informe um telefone válido (com DDD, 10 ou 11 dígitos)." };
    }
    var found = findByPhone(phoneDigits);
    if (!found) {
      return { ok: false, error: "Não encontramos uma conta com este telefone." };
    }

    var birthIso = normalizeBirthDate(data.birthDate);
    var confirmIso = normalizeBirthDate(data.birthDateConfirm);
    if (!birthIso || !isValidBirthDate(birthIso)) {
      return { ok: false, error: "Informe uma data de nascimento válida." };
    }
    if (birthIso !== confirmIso) {
      return { ok: false, error: "As datas de nascimento não coincidem." };
    }

    found.user.birthDate = birthIso;
    delete found.user.password;
    var list = getUsers();
    list[found.index] = found.user;
    setUsers(list);
    return { ok: true };
  }

  function updateProfile(data) {
    if (!isLoggedIn()) return { ok: false, error: "Não autenticado." };
    var session = localStorage.getItem(SESSION_KEY);
    var found = resolveSessionUser(session);
    if (!found) {
      logout();
      return { ok: false, error: "Sessão inválida. Faça login de novo." };
    }

    var firstName = String(data.firstName || "").trim();
    var lastName = String(data.lastName || "").trim();
    if (!firstName) return { ok: false, error: "Informe o nome." };
    if (!lastName) return { ok: false, error: "Informe o sobrenome." };
    if (!String(data.phone || "").trim()) return { ok: false, error: "Informe o telefone." };

    var newDigits = normalizePhone(data.phone);
    if (!isValidPhoneDigits(newDigits)) {
      return { ok: false, error: "Informe um telefone válido (com DDD, 10 ou 11 dígitos)." };
    }
    var currentDigits = normalizePhone(found.user.phone);
    if (newDigits !== currentDigits) {
      var other = findByPhone(newDigits);
      if (other && other.index !== found.index) {
        return { ok: false, error: "Este telefone já está em uso por outra conta." };
      }
    }

    var addrErr = validateAddress(data);
    if (addrErr) return { ok: false, error: addrErr };

    var u = found.user;
    u.firstName = firstName;
    u.lastName = lastName;
    delete u.name;
    u.phone = String(data.phone).trim();
    delete u.email;

    if (data.birthDate) {
      var newBirth = normalizeBirthDate(data.birthDate);
      if (!newBirth || !isValidBirthDate(newBirth)) {
        return { ok: false, error: "Informe uma data de nascimento válida." };
      }
      if (!data.currentBirthDate) {
        return { ok: false, error: "Informe a data de nascimento atual para alterá-la." };
      }
      if (!birthDateMatches(u, data.currentBirthDate)) {
        return { ok: false, error: "A data de nascimento atual não confere." };
      }
      u.birthDate = newBirth;
      delete u.password;
    }

    u.address = buildAddress(data);

    var list = getUsers();
    list[found.index] = u;
    setUsers(list);
    setSessionForUser(u);
    return { ok: true };
  }

  window.Auth = {
    register: register,
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getCurrentUser: getCurrentUser,
    updateProfile: updateProfile,
    resetPassword: resetPassword,
    normalizeBirthDate: normalizeBirthDate,
    formatBirthDateBR: formatBirthDateBR,
  };
})();
