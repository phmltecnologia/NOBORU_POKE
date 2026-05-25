/**
 * Links do restaurante (Instagram, WhatsApp) — usa window.RESTAURANT de data.js
 */
(function () {
  function render(containerId) {
    var root = document.getElementById(containerId);
    var r = window.RESTAURANT;
    if (!root || !r) return;

    root.innerHTML = "";
    root.setAttribute("aria-label", "Contato e redes sociais");

    var ig = document.createElement("a");
    ig.className = "restaurant-links__btn restaurant-links__btn--ig";
    ig.href = r.instagram;
    ig.target = "_blank";
    ig.rel = "noopener noreferrer";
    ig.innerHTML = '<span class="restaurant-links__icon" aria-hidden="true">📷</span> Nosso Instagram';

    var wa = document.createElement("a");
    wa.className = "restaurant-links__btn restaurant-links__btn--wa";
    wa.href = r.whatsappUrl;
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    wa.innerHTML =
      '<span class="restaurant-links__icon" aria-hidden="true">💬</span> Falar com restaurante';

    root.appendChild(ig);
    root.appendChild(wa);

    if (window.ShareSite && ShareSite.createButton) {
      root.appendChild(ShareSite.createButton());
    }
  }

  window.renderRestaurantLinks = render;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      render("restaurant-links");
    });
  } else {
    render("restaurant-links");
  }
})();
