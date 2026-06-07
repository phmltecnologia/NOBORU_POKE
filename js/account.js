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

    document.getElementById("acc-firstname").value = u.firstName || "";
    document.getElementById("acc-lastname").value = u.lastName || "";
    var phoneEl = document.getElementById("acc-phone");
    if (phoneEl) {
      phoneEl.value = window.PhoneField ? PhoneField.format(u.phone) : u.phone || "";
    }
    document.getElementById("acc-birthdate").value = u.birthDate || "";
    var a = u.address || {};
    document.getElementById("acc-cep").value = a.cep || "";
    document.getElementById("acc-street").value = a.street || "";
    document.getElementById("acc-number").value = a.number || "";
    document.getElementById("acc-complement").value = a.complement || "";
    document.getElementById("acc-neighborhood").value = a.neighborhood || "";
    document.getElementById("acc-city").value = a.city || "";
    var curBirth = document.getElementById("acc-birthdate-current");
    var newBirth = document.getElementById("acc-birthdate-new");
    var newBirth2 = document.getElementById("acc-birthdate-new2");
    if (curBirth) curBirth.value = "";
    if (newBirth) newBirth.value = "";
    if (newBirth2) newBirth2.value = "";

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

  if (window.PhoneField) {
    PhoneField.init(form);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var phoneEl = document.getElementById("acc-phone");
    var phoneVal = phoneEl ? phoneEl.value : "";
    if (window.PhoneField) {
      var pv = PhoneField.validate(phoneVal);
      if (!pv.ok) {
        showMsg(pv.error, true);
        phoneEl.focus();
        return;
      }
      phoneEl.value = pv.formatted;
      phoneVal = pv.formatted;
    }
    var newBirth = (document.getElementById("acc-birthdate-new") || {}).value || "";
    var data = {
      firstName: document.getElementById("acc-firstname").value,
      lastName: document.getElementById("acc-lastname").value,
      phone: phoneVal,
      cep: document.getElementById("acc-cep").value,
      street: document.getElementById("acc-street").value,
      number: document.getElementById("acc-number").value,
      complement: document.getElementById("acc-complement").value,
      neighborhood: document.getElementById("acc-neighborhood").value,
      city: document.getElementById("acc-city").value,
    };
    if (newBirth) {
      var confirmBirth = (document.getElementById("acc-birthdate-new2") || {}).value || "";
      if (newBirth !== confirmBirth) {
        showMsg("A confirmação da nova data de nascimento não confere.", true);
        return;
      }
      var currentBirth = (document.getElementById("acc-birthdate-current") || {}).value || "";
      if (!currentBirth) {
        showMsg("Para alterar a data de nascimento, informe a data atual.", true);
        return;
      }
      data.birthDate = newBirth;
      data.currentBirthDate = currentBirth;
    }
    var r = await Auth.updateProfile(data);
    if (r.ok) {
      showMsg("Dados salvos com sucesso.");
      updateGreeting();
      setTimeout(function () {
        closeModal();
      }, 800);
    } else {
      showMsg(r.error, true);
    }
  });

  if (typeof window !== "undefined") {
    window.__account = { openModal: openModal, updateGreeting: updateGreeting };
  }
})();
