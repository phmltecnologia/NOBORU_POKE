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
  var stateInput = document.getElementById("reg-state");

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
      var loginEmail = document.getElementById("login-email");
      var resetEmail = document.getElementById("reset-email");
      if (loginEmail && resetEmail && loginEmail.value) {
        resetEmail.value = loginEmail.value;
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
  if (stateInput) {
    stateInput.addEventListener("input", function () {
      stateInput.value = stateInput.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    });
  }

  formLogin.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("login-email").value;
    var password = document.getElementById("login-password").value;
    var r = Auth.login(email, password);
    if (r.ok) {
      showMessage("Entrando…", false);
      location.href = "index.html";
    } else {
      showMessage(r.error, true);
    }
  });

  formRegister.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = {
      name: document.getElementById("reg-name").value,
      email: document.getElementById("reg-email").value,
      phone: document.getElementById("reg-phone").value,
      password: document.getElementById("reg-password").value,
      passwordConfirm: document.getElementById("reg-password2").value,
      cep: document.getElementById("reg-cep").value,
      street: document.getElementById("reg-street").value,
      number: document.getElementById("reg-number").value,
      complement: document.getElementById("reg-complement").value,
      neighborhood: document.getElementById("reg-neighborhood").value,
      city: document.getElementById("reg-city").value,
      state: document.getElementById("reg-state").value,
    };
    var r = Auth.register(data);
    if (r.ok) {
      showMessage("Conta criada! Redirecionando…", false);
      location.href = "index.html";
    } else {
      showMessage(r.error, true);
    }
  });

  if (formReset) {
    formReset.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {
        email: document.getElementById("reset-email").value,
        phone: document.getElementById("reset-phone").value,
        password: document.getElementById("reset-password").value,
        passwordConfirm: document.getElementById("reset-password2").value,
      };
      var r = Auth.resetPassword(data);
      if (r.ok) {
        showMessage("Senha redefinida! Faça login com a nova senha.", false);
        document.getElementById("login-email").value = data.email;
        document.getElementById("login-password").value = "";
        formReset.reset();
        setPanel("login");
      } else {
        showMessage(r.error, true);
      }
    });
  }

  if (window.PasswordFields) {
    PasswordFields.init(document);
  }
})();
