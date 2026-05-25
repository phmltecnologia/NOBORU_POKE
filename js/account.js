(function () {
  if (!window.Auth) return;

  var overlay = document.getElementById("account-overlay");
  var form = document.getElementById("account-form");
  var msg = document.getElementById("account-msg");
  if (!overlay || !form) return;

  function showMsg(text, isError) {
    if (!msg) return;
    msg.textContent = text || "";
    msg.className = "account-msg" + (isError ? " account-msg--error" : " account-msg--ok");
  }

  function openModal() {
    var u = Auth.getCurrentUser();
    if (!u) return;
    showMsg("");

    document.getElementById("acc-name").value = u.name || "";
    document.getElementById("acc-email").value = u.email || "";
    document.getElementById("acc-phone").value = u.phone || "";
    var a = u.address || {};
    document.getElementById("acc-cep").value = a.cep || "";
    document.getElementById("acc-street").value = a.street || "";
    document.getElementById("acc-number").value = a.number || "";
    document.getElementById("acc-complement").value = a.complement || "";
    document.getElementById("acc-neighborhood").value = a.neighborhood || "";
    document.getElementById("acc-city").value = a.city || "";
    document.getElementById("acc-state").value = a.state || "";
    document.getElementById("acc-pass-current").value = "";
    document.getElementById("acc-pass-new").value = "";
    document.getElementById("acc-pass-new2").value = "";

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.classList.add("account-open");
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    document.body.classList.remove("account-open");
    setTimeout(function () {
      if (!overlay.classList.contains("is-open")) {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
      }
    }, 200);
  }

  function updateGreeting() {
    var u = Auth.getCurrentUser();
    var el = document.getElementById("user-greeting");
    if (el && u) {
      el.textContent = "Olá, " + ((u.name || "Cliente").split(" ")[0] || u.name);
    }
  }

  var cep = document.getElementById("acc-cep");
  if (cep) {
    cep.addEventListener("input", function () {
      var d = cep.value.replace(/\D/g, "").slice(0, 8);
      if (d.length <= 5) cep.value = d;
      else cep.value = d.slice(0, 5) + "-" + d.slice(5);
    });
  }
  var st = document.getElementById("acc-state");
  if (st) {
    st.addEventListener("input", function () {
      st.value = st.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    });
  }

  var btnAcc = document.getElementById("btn-account");
  if (btnAcc) {
    btnAcc.addEventListener("click", function () {
      openModal();
    });
  }
  var btnClose = document.getElementById("account-close");
  if (btnClose) {
    btnClose.addEventListener("click", closeModal);
  }
  var btnCancel = document.getElementById("account-cancel");
  if (btnCancel) {
    btnCancel.addEventListener("click", closeModal);
  }

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeModal();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var newP = (document.getElementById("acc-pass-new").value || "").trim();
    var data = {
      name: document.getElementById("acc-name").value,
      phone: document.getElementById("acc-phone").value,
      cep: document.getElementById("acc-cep").value,
      street: document.getElementById("acc-street").value,
      number: document.getElementById("acc-number").value,
      complement: document.getElementById("acc-complement").value,
      neighborhood: document.getElementById("acc-neighborhood").value,
      city: document.getElementById("acc-city").value,
      state: document.getElementById("acc-state").value,
      currentPassword: document.getElementById("acc-pass-current").value,
      newPassword: newP,
      newPasswordConfirm: document.getElementById("acc-pass-new2").value,
    };
    if (newP && !data.currentPassword) {
      showMsg("Para definir uma nova senha, informe a senha atual.", true);
      return;
    }
    if (!newP) {
      data.newPassword = "";
      data.newPasswordConfirm = "";
      data.currentPassword = "";
    }
    var r = Auth.updateProfile(data);
    if (r.ok) {
      showMsg("Dados salvos com sucesso.");
      updateGreeting();
      document.getElementById("acc-pass-current").value = "";
      document.getElementById("acc-pass-new").value = "";
      document.getElementById("acc-pass-new2").value = "";
      setTimeout(function () {
        closeModal();
      }, 800);
    } else {
      showMsg(r.error, true);
    }
  });

  if (window.PasswordFields) {
    PasswordFields.init(form);
  }

  if (typeof window !== "undefined") {
    window.__account = { openModal: openModal, updateGreeting: updateGreeting };
  }
})();
