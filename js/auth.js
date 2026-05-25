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

  function normalizeEmail(s) {
    return String(s || "")
      .trim()
      .toLowerCase();
  }

  function normalizePhone(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function findByEmail(email) {
    var e = normalizeEmail(email);
    var list = getUsers();
    for (var i = 0; i < list.length; i++) {
      if (normalizeEmail(list[i].email) === e) return { user: list[i], index: i };
    }
    return null;
  }

  function register(data) {
    var email = normalizeEmail(data.email);
    if (!email) return { ok: false, error: "Informe um e-mail." };
    if (findByEmail(email)) return { ok: false, error: "Este e-mail já está cadastrado." };
    if (!data.password || data.password.length < 4) {
      return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
    }
    if (data.password !== data.passwordConfirm) {
      return { ok: false, error: "As senhas não coincidem." };
    }
    if (!String(data.name || "").trim()) return { ok: false, error: "Informe o nome completo." };
    if (!String(data.phone || "").trim()) return { ok: false, error: "Informe o telefone." };
    if (!String(data.street || "").trim()) return { ok: false, error: "Informe o logradouro." };
    if (!String(data.number || "").trim()) return { ok: false, error: "Informe o número." };
    if (!String(data.neighborhood || "").trim()) return { ok: false, error: "Informe o bairro." };
    if (!String(data.city || "").trim()) return { ok: false, error: "Informe a cidade." };
    if (!String(data.state || "").trim() || String(data.state).length !== 2) {
      return { ok: false, error: "Informe a UF com 2 letras (ex.: SC)." };
    }
    if (!String(data.cep || "").trim()) return { ok: false, error: "Informe o CEP." };

    var user = {
      email: email,
      password: data.password,
      name: String(data.name).trim(),
      phone: String(data.phone).trim(),
      address: {
        cep: String(data.cep).trim(),
        street: String(data.street).trim(),
        number: String(data.number).trim(),
        complement: String(data.complement || "").trim(),
        neighborhood: String(data.neighborhood).trim(),
        city: String(data.city).trim(),
        state: String(data.state)
          .trim()
          .toUpperCase()
          .slice(0, 2),
      },
    };

    var list = getUsers();
    list.push(user);
    setUsers(list);
    localStorage.setItem(SESSION_KEY, user.email);
    return { ok: true };
  }

  function login(email, password) {
    var found = findByEmail(email);
    if (!found) return { ok: false, error: "E-mail ou senha incorretos." };
    if (found.user.password !== password) {
      return { ok: false, error: "E-mail ou senha incorretos." };
    }
    localStorage.setItem(SESSION_KEY, found.user.email);
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
    var email = localStorage.getItem(SESSION_KEY);
    var found = findByEmail(email);
    if (!found) {
      logout();
      return null;
    }
    var u = found.user;
    var addr = u.address;
    var copy =
      addr
        ? {
            cep: addr.cep,
            street: addr.street,
            number: addr.number,
            complement: addr.complement,
            neighborhood: addr.neighborhood,
            city: addr.city,
            state: addr.state,
          }
        : null;
    return { email: u.email, name: u.name, phone: u.phone, address: copy };
  }

  function getCurrentUserForMessage() {
    return getCurrentUser();
  }

  function resetPassword(data) {
    var email = normalizeEmail(data.email);
    if (!email) return { ok: false, error: "Informe o e-mail." };
    var found = findByEmail(email);
    if (!found) {
      return { ok: false, error: "Não encontramos uma conta com este e-mail." };
    }

    var phoneIn = normalizePhone(data.phone);
    if (!phoneIn) return { ok: false, error: "Informe o telefone cadastrado." };
    if (normalizePhone(found.user.phone) !== phoneIn) {
      return { ok: false, error: "O telefone não confere com o cadastro." };
    }

    var pw = String(data.password || "");
    if (pw.length < 4) {
      return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
    }
    if (pw !== String(data.passwordConfirm || "")) {
      return { ok: false, error: "As senhas não coincidem." };
    }

    found.user.password = pw;
    var list = getUsers();
    list[found.index] = found.user;
    setUsers(list);
    return { ok: true };
  }

  function updateProfile(data) {
    if (!isLoggedIn()) return { ok: false, error: "Não autenticado." };
    var sessionEmail = localStorage.getItem(SESSION_KEY);
    var found = findByEmail(sessionEmail);
    if (!found) {
      logout();
      return { ok: false, error: "Sessão inválida. Faça login de novo." };
    }

    if (!String(data.name || "").trim()) return { ok: false, error: "Informe o nome completo." };
    if (!String(data.phone || "").trim()) return { ok: false, error: "Informe o telefone." };
    if (!String(data.street || "").trim()) return { ok: false, error: "Informe o logradouro." };
    if (!String(data.number || "").trim()) return { ok: false, error: "Informe o número." };
    if (!String(data.neighborhood || "").trim()) return { ok: false, error: "Informe o bairro." };
    if (!String(data.city || "").trim()) return { ok: false, error: "Informe a cidade." };
    if (!String(data.state || "").trim() || String(data.state).length !== 2) {
      return { ok: false, error: "Informe a UF com 2 letras (ex.: SC)." };
    }
    if (!String(data.cep || "").trim()) return { ok: false, error: "Informe o CEP." };

    var newPw = (data.newPassword || "").trim();
    if (newPw) {
      if (newPw.length < 4) {
        return { ok: false, error: "A nova senha deve ter pelo menos 4 caracteres." };
      }
      if (newPw !== (data.newPasswordConfirm || "")) {
        return { ok: false, error: "A confirmação da nova senha não confere." };
      }
      if ((data.currentPassword || "") !== found.user.password) {
        return { ok: false, error: "Senha atual incorreta." };
      }
    }

    var u = found.user;
    u.name = String(data.name).trim();
    u.phone = String(data.phone).trim();
    u.address = {
      cep: String(data.cep).trim(),
      street: String(data.street).trim(),
      number: String(data.number).trim(),
      complement: String(data.complement || "").trim(),
      neighborhood: String(data.neighborhood).trim(),
      city: String(data.city).trim(),
      state: String(data.state)
        .trim()
        .toUpperCase()
        .slice(0, 2),
    };
    if (newPw) u.password = newPw;

    var list = getUsers();
    list[found.index] = u;
    setUsers(list);
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
  };
})();
