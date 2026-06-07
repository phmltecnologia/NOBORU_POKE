(function () {
  var msgBox = document.getElementById("auth-messages");
  var authTabs = document.getElementById("auth-tabs");
  var tabLogin = document.getElementById("tab-login");
  var tabRegister = document.getElementById("tab-register");
  var panelLogin = document.getElementById("panel-login");
  var panelRegister = document.getElementById("panel-register");
  var panelReset = document.getElementById("panel-reset");
  var formLogin = document.getElementById("form-login");
  var formRegister = document.getElementById("form-register");
  var formReset = document.getElementById("form-reset");
  var cepInput = document.getElementById("reg-cep");

  function showMessage(text, isError) {
    msgBox.innerHTML = "";
    if (!text) return;
    var p = document.createElement("p");
    p.className = "auth__msg" + (isError ? " auth__msg--error" : " auth__msg--ok");
    p.textContent = text;
    msgBox.appendChild(p);
  }

  function setPanel(which) {
    var isLogin = which === "login";
    var isRegister = which === "register";
    var isReset = which === "reset";

    if (authTabs) authTabs.hidden = isReset;

    if (tabLogin && tabRegister) {
      tabLogin.classList.toggle("auth__tab--active", isLogin);
      tabRegister.classList.toggle("auth__tab--active", isRegister);
      tabLogin.setAttribute("aria-selected", isLogin);
      tabRegister.setAttribute("aria-selected", isRegister);
    }

    panelLogin.classList.toggle("auth__panel--hidden", !isLogin);
    panelRegister.classList.toggle("auth__panel--hidden", !isRegister);
    panelLogin.hidden = !isLogin;
    panelRegister.hidden = !isRegister;

    if (panelReset) {
      panelReset.classList.toggle("auth__panel--hidden", !isReset);
      panelReset.hidden = !isReset;
    }

    showMessage("");
  }

  tabLogin.addEventListener("click", function () {
    setPanel("login");
  });
  tabRegister.addEventListener("click", function () {
    setPanel("register");
  });

  var btnForgot = document.getElementById("btn-forgot-password");
  if (btnForgot) {
    btnForgot.addEventListener("click", function () {
      var loginPhone = document.getElementById("login-phone");
      var resetPhone = document.getElementById("reset-phone");
      if (loginPhone && resetPhone && loginPhone.value) {
        resetPhone.value = loginPhone.value;
      }
      setPanel("reset");
    });
  }

  var btnResetBack = document.getElementById("reset-back");
  if (btnResetBack) {
    btnResetBack.addEventListener("click", function () {
      setPanel("login");
    });
  }

  if (cepInput) {
    cepInput.addEventListener("input", function () {
      var d = cepInput.value.replace(/\D/g, "").slice(0, 8);
      if (d.length <= 5) cepInput.value = d;
      else cepInput.value = d.slice(0, 5) + "-" + d.slice(5);
    });
  }

  if (window.PhoneField) {
    PhoneField.init(document);
  }

  function phoneFromInput(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    if (window.PhoneField) {
      var v = PhoneField.validate(el.value);
      if (!v.ok) {
        PhoneField.bind(el);
        el.focus();
        setFieldError(el, v.error);
        return null;
      }
      el.value = v.formatted;
      return v.formatted;
    }
    return el.value;
  }

  function setFieldError(input, message) {
    if (!input || !window.PhoneField) return;
    var field = input.closest(".field");
    if (!field) return;
    var existing = field.querySelector(".field__phone-error");
    if (message) {
      field.classList.add("field--invalid");
      if (!existing) {
        existing = document.createElement("p");
        existing.className = "field__phone-error field__hint";
        field.appendChild(existing);
      }
      existing.textContent = message;
    } else {
      field.classList.remove("field--invalid");
      if (existing) existing.remove();
    }
  }

  formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();
    var phoneEl = document.getElementById("login-phone");
    var phone = phoneFromInput("login-phone");
    if (phone === null) {
      var err = window.PhoneField ? PhoneField.validate(phoneEl.value).error : "Telefone inválido.";
      showMessage(err, true);
      return;
    }
    var birthDate = document.getElementById("login-birthdate").value;
    var r = await Auth.login(phone, birthDate);
    if (r.ok) {
      showMessage("Entrando…", false);
      location.href = "index.html";
    } else {
      showMessage(r.error, true);
    }
  });

  formRegister.addEventListener("submit", async function (e) {
    e.preventDefault();
    var phone = phoneFromInput("reg-phone");
    if (phone === null) {
      var regEl = document.getElementById("reg-phone");
      var errReg = window.PhoneField ? PhoneField.validate(regEl.value).error : "Telefone inválido.";
      showMessage(errReg, true);
      return;
    }
    var data = {
      firstName: document.getElementById("reg-firstname").value,
      lastName: document.getElementById("reg-lastname").value,
      phone: phone,
      birthDate: document.getElementById("reg-birthdate").value,
      cep: document.getElementById("reg-cep").value,
      street: document.getElementById("reg-street").value,
      number: document.getElementById("reg-number").value,
      complement: document.getElementById("reg-complement").value,
      neighborhood: document.getElementById("reg-neighborhood").value,
      city: document.getElementById("reg-city").value,
    };
    var r = await Auth.register(data);
    if (r.ok) {
      showMessage("Conta criada! Redirecionando…", false);
      location.href = "index.html";
    } else {
      showMessage(r.error, true);
    }
  });

  if (formReset) {
    formReset.addEventListener("submit", async function (e) {
      e.preventDefault();
      var phone = phoneFromInput("reset-phone");
      if (phone === null) {
        var resetEl = document.getElementById("reset-phone");
        var errReset = window.PhoneField ? PhoneField.validate(resetEl.value).error : "Telefone inválido.";
        showMessage(errReset, true);
        return;
      }
      var data = {
        phone: phone,
        birthDate: document.getElementById("reset-birthdate").value,
        birthDateConfirm: document.getElementById("reset-birthdate2").value,
      };
      var r = await Auth.resetPassword(data);
      if (r.ok) {
        showMessage("Data atualizada! Entre com a nova data de nascimento.", false);
        document.getElementById("login-phone").value = data.phone;
        document.getElementById("login-birthdate").value = data.birthDate;
        formReset.reset();
        setPanel("login");
      } else {
        showMessage(r.error, true);
      }
    });
  }
})();
