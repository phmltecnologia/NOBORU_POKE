/**
 * Compartilhar link do site (WhatsApp, Web Share API ou copiar).
 */
(function () {
  var TOAST_ID = "share-site-toast";

  function getSiteUrl() {
    var r = window.RESTAURANT;
    if (r && r.siteUrl) return r.siteUrl;
    if (typeof location !== "undefined" && location.origin && /^https?:\/\//i.test(location.origin)) {
      return location.origin.replace(/\/$/, "");
    }
    return "https://noborupoke.vercel.app";
  }

  function shareMessage() {
    var url = getSiteUrl();
    var name = (window.RESTAURANT && window.RESTAURANT.name) || "Noboru Poke";
    return (
      "Olá! Peça pokes e temakis no *" +
      name +
      "* pelo site:\n\n" +
      url +
      "\n\n(O link abre direto no navegador.)"
    );
  }

  function showToast(text) {
    var el = document.getElementById(TOAST_ID);
    if (!el) {
      el = document.createElement("p");
      el.id = TOAST_ID;
      el.className = "share-site-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("share-site-toast--visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.classList.remove("share-site-toast--visible");
    }, 2800);
  }

  function copyToClipboard(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          done(true);
        })
        .catch(function () {
          copyFallback(text, done);
        });
      return;
    }
    copyFallback(text, done);
  }

  function copyFallback(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      done(ok);
    } catch (e) {
      done(false);
    }
  }

  function openWhatsAppWithText() {
    var text = shareMessage();
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
  }

  function share() {
    var url = getSiteUrl();
    if (navigator.share) {
      navigator
        .share({
          title: (window.RESTAURANT && window.RESTAURANT.name) || "Noboru Poke",
          text: "Peça pokes e temakis pelo site",
          url: url,
        })
        .catch(function (err) {
          if (err && err.name === "AbortError") return;
          openWhatsAppWithText();
        });
      return;
    }
    openWhatsAppWithText();
  }

  function shareCopyOnly() {
    copyToClipboard(getSiteUrl(), function (ok) {
      showToast(ok ? "Link copiado! Cole no WhatsApp." : "Copie: " + getSiteUrl());
    });
  }

  function createButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "restaurant-links__btn restaurant-links__btn--share";
    btn.setAttribute("aria-label", "Compartilhar link do cardápio");
    btn.innerHTML =
      '<span class="restaurant-links__icon" aria-hidden="true">🔗</span> Compartilhar site';

    btn.addEventListener("click", function () {
      share();
    });

    btn.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      shareCopyOnly();
    });

    return btn;
  }

  window.ShareSite = {
    getSiteUrl: getSiteUrl,
    share: share,
    shareCopyOnly: shareCopyOnly,
    createButton: createButton,
  };
})();
