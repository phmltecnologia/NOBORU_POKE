(function () {
  var ICON_SHOW =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var ICON_HIDE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  function enhanceInput(input) {
    if (!input || input.type !== "password" || input.closest(".field__password-wrap")) return;

    var wrap = document.createElement("div");
    wrap.className = "field__password-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "field__password-toggle";
    btn.setAttribute("aria-label", "Mostrar senha");
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = ICON_SHOW;

    btn.addEventListener("click", function () {
      var visible = input.type === "text";
      input.type = visible ? "password" : "text";
      btn.setAttribute("aria-label", visible ? "Mostrar senha" : "Ocultar senha");
      btn.setAttribute("aria-pressed", visible ? "false" : "true");
      btn.classList.toggle("is-visible", !visible);
      btn.innerHTML = visible ? ICON_SHOW : ICON_HIDE;
    });

    wrap.appendChild(btn);
  }

  function init(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var inputs = scope.querySelectorAll('input[type="password"]');
    for (var i = 0; i < inputs.length; i++) {
      enhanceInput(inputs[i]);
    }
  }

  window.PasswordFields = { init: init };
})();
