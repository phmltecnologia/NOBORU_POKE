(function () {
  var REST_CFG = window.RESTAURANT || {};
  // Destino do WhatsApp para pedidos (formato E.164 sem '+')
  var WHATSAPP_E164 = REST_CFG.whatsappE164 || "5548998078186";
  var RESTAURANT_NAME = REST_CFG.name || "Noboru Poke";
  /** Mesmo nome de janela: o navegador reutiliza a aba aberta por este site (não vê abas abertas manualmente). */
  var WHATSAPP_TARGET_NAME = "WhatsAppWeb_NoboruPoke";

  var cart = {};
  /** Itens personalizados / com observação: id → { name, price, desc, detail, note } */
  var cartMeta = {};
  /** Item com camadas aguardando confirmação no modal de opções */
  var pendingOptionsItem = null;
  var pendingOptionsSelections = {};

  function getMenu() {
    return window.MENU || [];
  }
  var searchQuery = "";

  /** Definido ao confirmar o modal de pagamento, antes de enviar ao WhatsApp. */
  var checkoutPayment = { method: "pix", troco: "" };
  var lastPixPayload = "";

  function formatMoney(n) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function foldAccents(s) {
    if (!s) return "";
    var t = String(s).toLowerCase();
    try {
      t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (e) {
      // normalize ausente
    }
    return t;
  }

  function getFilteredMenu() {
    var menu = getMenu();
    var q = (searchQuery || "").trim();
    if (!q) return menu;
    var nq = foldAccents(q);
    if (!nq) return menu;
    var out = [];
    for (var i = 0; i < menu.length; i++) {
      var it = menu[i];
      var blob = foldAccents(
        (it.name || "") + " " + (it.desc || "") + " " + (it.category || "")
      );
      if (blob.indexOf(nq) !== -1) {
        out.push(it);
      }
    }
    return out;
  }

  function itemCategoryId(item) {
    return item.categoryId || item.category || "outros";
  }

  function itemCategoryName(item) {
    return item.categoryName || item.category || "Outros";
  }

  function getCategoriesForList(list) {
    var seen = {};
    var out = [];
    var global = (window.CATEGORIES || []).slice().sort(function (a, b) {
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
    for (var i = 0; i < list.length; i++) {
      seen[itemCategoryId(list[i])] = itemCategoryName(list[i]);
    }
    for (var g = 0; g < global.length; g++) {
      if (seen[global[g].id]) {
        out.push({ id: global[g].id, name: global[g].name });
        delete seen[global[g].id];
      }
    }
    for (var k in seen) {
      if (Object.prototype.hasOwnProperty.call(seen, k)) {
        out.push({ id: k, name: seen[k] });
      }
    }
    return out;
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderMenu() {
    var nav = document.getElementById("category-nav");
    var sectionRoot = document.getElementById("menu");
    if (!nav || !sectionRoot) return;
    nav.innerHTML = "";
    sectionRoot.innerHTML = "";

    var list = getFilteredMenu();
    var categories = getCategoriesForList(list);

    if (list.length === 0) {
      var empty = el("p", "search-empty", "Nenhum item encontrado para “" + (searchQuery.trim() || "") + "”.");
      empty.setAttribute("role", "status");
      sectionRoot.appendChild(empty);
      return;
    }

    for (var c = 0; c < categories.length; c++) {
      var cat = categories[c];
      var btn = el("button", "categories__btn", cat.name);
      btn.type = "button";
      btn.dataset.category = cat.id;
      btn.setAttribute("aria-pressed", c === 0 ? "true" : "false");
      if (c === 0) btn.classList.add("categories__btn--active");
      btn.addEventListener("click", function (ev) {
        var t = ev.currentTarget;
        var id = "cat-" + slug(t.dataset.category);
        var elSec = document.getElementById(id);
        if (elSec) {
          elSec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setActiveCategoryButton(t);
      });
      nav.appendChild(btn);
    }

    for (var i = 0; i < categories.length; i++) {
      var category = categories[i];
      var sec = el("section", "menu__section");
      sec.id = "cat-" + slug(category.id);
      sec.setAttribute("aria-labelledby", "h-" + slug(category.id));
      var h2 = el("h2", "menu__section-title", category.name);
      h2.id = "h-" + slug(category.id);
      sec.appendChild(h2);

      for (var j = 0; j < list.length; j++) {
        if (itemCategoryId(list[j]) !== category.id) continue;
        sec.appendChild(renderItem(list[j]));
      }
      sectionRoot.appendChild(sec);
    }
  }

  function setupSearch() {
    var input = document.getElementById("menu-search");
    var clear = document.getElementById("menu-search-clear");
    if (!input) return;
    if (searchQuery) {
      input.value = searchQuery;
    }

    function updateClear() {
      var on = (input.value || "").length > 0;
      if (clear) {
        clear.hidden = !on;
      }
    }

    function onChange() {
      searchQuery = input.value;
      updateClear();
      renderMenu();
    }

    input.addEventListener("input", onChange);
    input.addEventListener("search", onChange);
    if (clear) {
      clear.addEventListener("click", function () {
        input.value = "";
        searchQuery = "";
        input.focus();
        updateClear();
        renderMenu();
      });
    }
    updateClear();
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function renderItem(item) {
    var row = el("article", "item");
    var fig = el("div", "item__fig");
    var img = document.createElement("img");
    img.className = "item__img";
    img.src = item.image || "img/produtos/" + item.id + ".svg";
    img.alt = "";
    img.setAttribute("loading", "lazy");
    img.decoding = "async";
    img.addEventListener("error", function once() {
      if (img.src.indexOf("placeholder") !== -1) return;
      img.removeEventListener("error", once);
      img.src = "img/placeholder-produto.svg";
    });
    fig.appendChild(img);
    row.appendChild(fig);
    var body = el("div", "item__body");
    body.appendChild(el("h3", "item__name", item.name));
    if (item.desc) body.appendChild(el("p", "item__desc", item.desc));
    var hasOpts = window.MenuOptions && MenuOptions.itemHasOptions(item);
    if (hasOpts) {
      body.appendChild(
        el("div", "item__price item__price--from", "a partir de " + formatMoney(MenuOptions.minPriceFromLayers(item)))
      );
    } else {
      body.appendChild(el("div", "item__price", formatMoney(item.price)));
    }
    var addBtn = el("button", "item__add", hasOpts && (item.optionLayers || []).length > 1 ? "Montar" : hasOpts ? "Escolher" : "Adicionar");
    addBtn.type = "button";
    addBtn.addEventListener("click", function () {
      if (hasOpts) {
        openItemOptionsModal(item);
      } else {
        addToCart(item.id, 1);
      }
    });
    row.appendChild(body);
    row.appendChild(addBtn);
    return row;
  }

  function addToCart(id, delta) {
    if (!cart[id]) cart[id] = 0;
    cart[id] += delta;
    if (cart[id] <= 0) {
      delete cart[id];
      if (cartMeta[id]) delete cartMeta[id];
    }
    updateCartUI();
  }

  function resolveCartItem(id) {
    if (cartMeta[id]) return cartMeta[id];
    var menu = getMenu();
    for (var j = 0; j < menu.length; j++) {
      if (String(menu[j].id) === String(id)) return menu[j];
    }
    return null;
  }

  function cartLines() {
    var lines = [];
    for (var id in cart) {
      if (!Object.prototype.hasOwnProperty.call(cart, id)) continue;
      var q = cart[id];
      if (!q || q <= 0) continue;
      var it = resolveCartItem(id);
      if (it) {
        lines.push({ item: it, qty: q, cartId: id });
      } else {
        delete cart[id];
        if (cartMeta[id]) delete cartMeta[id];
      }
    }
    return lines;
  }

  function cartTotal() {
    var t = 0;
    var lines = cartLines();
    for (var i = 0; i < lines.length; i++) t += lines[i].item.price * lines[i].qty;
    return t;
  }

  function updateCartUI() {
    var list = document.getElementById("cart-list");
    var empty = document.getElementById("cart-empty");
    var footer = document.getElementById("cart-footer");
    var totalEl = document.getElementById("cart-total");
    var btnWa = document.getElementById("btn-whatsapp");
    var badge = document.getElementById("cart-badge");
    var lines = cartLines();
    var count = 0;
    for (var i = 0; i < lines.length; i++) count += lines[i].qty;

    list.innerHTML = "";
    if (lines.length === 0) {
      empty.hidden = false;
      footer.hidden = true;
      btnWa.disabled = true;
      badge.hidden = true;
    } else {
      empty.hidden = true;
      footer.hidden = false;
      btnWa.disabled = false;
      badge.hidden = false;
      badge.textContent = String(count);
      for (var j = 0; j < lines.length; j++) {
        list.appendChild(renderCartRow(lines[j]));
      }
    }
    totalEl.textContent = formatMoney(cartTotal());
  }

  function renderCartRow(line) {
    var li = el("li", "cart__row");
    var thumb = el("div", "cart__row-thumb");
    var img = document.createElement("img");
    img.className = "cart__row-thumb-img";
    img.alt = "";
    img.decoding = "async";
    img.src = line.item.image || "img/produtos/" + line.item.id + ".svg";
    img.addEventListener("error", function once() {
      if (img.src.indexOf("placeholder") !== -1) return;
      img.removeEventListener("error", once);
      img.src = "img/placeholder-produto.svg";
    });
    thumb.appendChild(img);

    var info = el("div", "cart__row-info");
    var name = el("span", "cart__row-name", line.qty + "× " + line.item.name);
    info.appendChild(name);
    if (line.item.detail) {
      var detailLines = String(line.item.detail).split("\n");
      for (var d = 0; d < detailLines.length; d++) {
        if (detailLines[d]) info.appendChild(el("span", "cart__row-note", detailLines[d]));
      }
    } else if (line.item.sizeLabel) {
      info.appendChild(el("span", "cart__row-note", line.item.sizeLabel));
    }
    if (line.item.note) {
      info.appendChild(el("span", "cart__row-note", "Obs: " + line.item.note));
    }
    var qty = el("div", "cart__row-qty");
    var minus = el("button", null, "−");
    minus.type = "button";
    minus.setAttribute("aria-label", "Remover um");
    var cartKey = line.cartId || line.item.id;
    minus.addEventListener("click", function () {
      addToCart(cartKey, -1);
    });
    var plus = el("button", null, "+");
    plus.type = "button";
    plus.setAttribute("aria-label", "Adicionar um");
    plus.addEventListener("click", function () {
      addToCart(cartKey, 1);
    });
    qty.appendChild(minus);
    qty.appendChild(plus);
    var sub = line.item.price * line.qty;
    var price = el("span", "cart__row-price", formatMoney(sub));
    li.appendChild(thumb);
    li.appendChild(info);
    li.appendChild(qty);
    li.appendChild(price);
    return li;
  }

  function setActiveCategoryButton(activeBtn) {
    var all = document.querySelectorAll(".categories__btn");
    for (var i = 0; i < all.length; i++) {
      all[i].classList.remove("categories__btn--active");
      all[i].setAttribute("aria-pressed", "false");
    }
    activeBtn.classList.add("categories__btn--active");
    activeBtn.setAttribute("aria-pressed", "true");
  }

  function buildWhatsAppMessage() {
    var lines = cartLines();
    var parts = [];
    parts.push("Olá! Gostaria de fazer o pedido no *" + RESTAURANT_NAME + "*. Segue o resumo:");
    if (window.Auth) {
      var u = Auth.getCurrentUser();
      if (u) {
        parts.push("");
        parts.push("*Cliente:* " + u.name);
        parts.push("Telefone: " + u.phone);
        var a = u.address;
        if (a) {
          var end =
            a.street +
            ", " +
            a.number +
            (a.complement ? " — " + a.complement : "") +
            " — " +
            a.neighborhood +
            " — " +
            a.city +
            " — CEP " +
            a.cep;
          parts.push("Endereço: " + end);
        }
        parts.push("");
      }
    }
    for (var i = 0; i < lines.length; i++) {
      var L = lines[i];
      var sub = L.item.price * L.qty;
      var line = "• " + L.qty + "× " + L.item.name + " — " + formatMoney(sub);
      if (L.item.detail) {
        line += "\n  _" + L.item.detail.replace(/\n/g, "\n  ") + "_";
      } else if (L.item.note) {
        line += "\n  _Obs: " + L.item.note + "_";
      }
      parts.push(line);
    }
    parts.push("");
    parts.push("*Total: " + formatMoney(cartTotal()) + "*");
    parts.push("");
    var payLabel = {
      pix: "PIX",
      money: "Dinheiro",
      maquininha: "Máquininha (cartão)",
      vale: "Vale alimentação",
    };
    var m = checkoutPayment.method;
    parts.push("*Forma de pagamento:* " + (payLabel[m] || "—"));
    if (m === "pix" && lastPixPayload) {
      parts.push("PIX (copia e cola): " + lastPixPayload);
    }
    if (m === "money") {
      var tro = (checkoutPayment.troco || "").trim();
      if (tro) {
        parts.push("Troco para: " + tro);
      } else {
        parts.push("Troco: (não informado — pode ajustar no atendimento).");
      }
    }
    return parts.join("\n");
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function emv(id, value) {
    var v = String(value);
    return String(id) + pad2(v.length) + v;
  }

  function crc16ccitt(str) {
    // CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF)
    var crc = 0xffff;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) {
        if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff;
        else crc = (crc << 1) & 0xffff;
      }
    }
    var hex = crc.toString(16).toUpperCase();
    return ("0000" + hex).slice(-4);
  }

  function buildPixPayload(amountNumber) {
    // Chave PIX como telefone (normaliza para +55)
    var keyRaw = "48991636944";
    var key = keyRaw;
    if (keyRaw.length === 11) {
      key = "+55" + keyRaw;
    } else if (keyRaw.length === 13 && keyRaw.indexOf("55") === 0) {
      key = "+" + keyRaw;
    } else if (keyRaw.indexOf("+") !== 0 && keyRaw.indexOf("55") === 0) {
      key = "+" + keyRaw;
    }

    var merchantName = "NOBORU POKE";
    var merchantCity = "ITAJAI";
    var amount = Number(amountNumber || 0).toFixed(2);

    // Merchant Account Information (ID 26)
    var mai =
      emv("00", "br.gov.bcb.pix") +
      emv("01", key) +
      emv("02", "Pedido Noboru Poke");

    var txid = "OP" + String(Date.now()).slice(-8);
    var addData = emv("05", txid);

    var payload =
      emv("00", "01") +
      emv("01", "12") +
      emv("26", mai) +
      emv("52", "0000") +
      emv("53", "986") +
      emv("54", amount) +
      emv("58", "BR") +
      emv("59", merchantName.slice(0, 25)) +
      emv("60", merchantCity.slice(0, 15)) +
      emv("62", addData);

    var withCrc = payload + "6304";
    var crc = crc16ccitt(withCrc);
    return withCrc + crc;
  }

  function openPixModal() {
    var overlay = document.getElementById("pix-overlay");
    if (!overlay) {
      openWhatsApp();
      closeCartPanel();
      return;
    }
    var total = cartTotal();
    lastPixPayload = buildPixPayload(total);

    var amountEl = document.getElementById("pix-amount");
    if (amountEl) amountEl.textContent = formatMoney(total);

    var codeEl = document.getElementById("pix-code-text");
    if (codeEl) codeEl.value = lastPixPayload;

    // QR via serviço externo (protótipo). Data = payload EMV.
    var img = document.getElementById("pix-qr-img");
    if (img) {
      var qrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=" +
        encodeURIComponent(lastPixPayload);
      img.src = qrUrl;
    }

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.classList.add("pix-open");
  }

  function closePixModal() {
    var overlay = document.getElementById("pix-overlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("pix-open");
    setTimeout(function () {
      if (!overlay.classList.contains("is-open")) {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
      }
    }, 200);
  }

  function setupPixModal() {
    var overlay = document.getElementById("pix-overlay");
    if (!overlay) return;
    var closeBtn = document.getElementById("pix-close");
    var copyBtn = document.getElementById("pix-copy");
    var waBtn = document.getElementById("pix-whatsapp");
    var codeEl = document.getElementById("pix-code-text");

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closePixModal();
    });
    var modal = document.getElementById("pix-modal");
    if (modal) {
      modal.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", closePixModal);
    }
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = (codeEl && codeEl.value) || lastPixPayload || "";
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
        } else if (codeEl) {
          codeEl.focus();
          codeEl.select();
          document.execCommand("copy");
        }
      });
    }
    if (waBtn) {
      waBtn.addEventListener("click", function () {
        openWhatsApp();
        closePixModal();
        closeCartPanel();
      });
    }
  }

  function openAddrModal() {
    var overlay = document.getElementById("addr-overlay");
    if (!overlay || !window.Auth) {
      if (checkoutPayment.method === "pix") {
        openPixModal();
      } else {
        openWhatsApp();
        closeCartPanel();
      }
      return;
    }
    var u = Auth.getCurrentUser();
    if (!u || !u.address) return;
    var a = u.address;
    document.getElementById("addr-cep").value = a.cep || "";
    document.getElementById("addr-street").value = a.street || "";
    document.getElementById("addr-number").value = a.number || "";
    document.getElementById("addr-complement").value = a.complement || "";
    document.getElementById("addr-neighborhood").value = a.neighborhood || "";
    document.getElementById("addr-city").value = a.city || "";
    var msg = document.getElementById("addr-msg");
    if (msg) msg.textContent = "";

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.classList.add("addr-open");
  }

  function closeAddrModal() {
    var overlay = document.getElementById("addr-overlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("addr-open");
    setTimeout(function () {
      if (!overlay.classList.contains("is-open")) {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
      }
    }, 200);
  }

  function setupAddrModal() {
    var overlay = document.getElementById("addr-overlay");
    if (!overlay) return;
    var closeBtn = document.getElementById("addr-close");
    var backBtn = document.getElementById("addr-back");
    var form = document.getElementById("addr-form");
    var cep = document.getElementById("addr-cep");
    var msg = document.getElementById("addr-msg");

    function show(t, isErr) {
      if (!msg) return;
      if (!t) {
        msg.textContent = "";
        msg.className = "addr-msg";
        return;
      }
      msg.textContent = t;
      msg.className = "addr-msg" + (isErr ? " addr-msg--err" : " addr-msg--ok");
    }

    if (cep) {
      cep.addEventListener("input", function () {
        var d = cep.value.replace(/\D/g, "").slice(0, 8);
        if (d.length <= 5) cep.value = d;
        else cep.value = d.slice(0, 5) + "-" + d.slice(5);
      });
    }
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeAddrModal();
    });
    var modal = document.getElementById("addr-modal");
    if (modal) {
      modal.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    if (closeBtn) closeBtn.addEventListener("click", closeAddrModal);
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        closeAddrModal();
        openPayModal();
      });
    }

    if (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!window.Auth) return;
        var u = Auth.getCurrentUser();
        if (!u) return;
        var data = {
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          cep: document.getElementById("addr-cep").value,
          street: document.getElementById("addr-street").value,
          number: document.getElementById("addr-number").value,
          complement: document.getElementById("addr-complement").value,
          neighborhood: document.getElementById("addr-neighborhood").value,
          city: document.getElementById("addr-city").value,
        };
        var r = await Auth.updateProfile(data);
        if (!r.ok) {
          show(r.error, true);
          return;
        }
        closeAddrModal();
        if (checkoutPayment.method === "pix") {
          openPixModal();
        } else {
          openWhatsApp();
          closeCartPanel();
        }
      });
    }
  }

  function openWhatsApp() {
    var text = buildWhatsAppMessage();
    var url =
      "https://wa.me/" + WHATSAPP_E164 + "?text=" + encodeURIComponent(text);
    // Sem "noopener" aqui: assim o retorno de window.open permite .focus() e
    // o nome da janela reaproveita a aba; o conteúdo do WhatsApp é de outro domínio.
    var w = window.open(url, WHATSAPP_TARGET_NAME);
    if (w) {
      try {
        w.focus();
      } catch (e) {
        // ignora
      }
    }
  }

  var closeCartPanel = function () {};

  function setupCartPanel() {
    var panel = document.getElementById("cart-panel");
    var fab = document.getElementById("fab-cart");
    var close = document.getElementById("cart-close");
    var backdrop = document.getElementById("cart-backdrop");
    var btnWa = document.getElementById("btn-whatsapp");

    function open() {
      panel.classList.add("is-open");
      backdrop.hidden = false;
      requestAnimationFrame(function () {
        backdrop.classList.add("is-open");
      });
      document.body.classList.add("cart-open");
    }

    function doClose() {
      panel.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      document.body.classList.remove("cart-open");
      setTimeout(function () {
        if (!panel.classList.contains("is-open")) backdrop.hidden = true;
      }, 200);
    }

    closeCartPanel = doClose;

    fab.addEventListener("click", open);
    close.addEventListener("click", doClose);
    backdrop.addEventListener("click", doClose);
    btnWa.addEventListener("click", function () {
      openPayModal();
    });
  }

  function setMoneyExpand(opened) {
    var wrap = document.getElementById("pay-wrap-money");
    var exp = document.getElementById("pay-expand-money");
    if (!wrap || !exp) return;
    if (opened) {
      wrap.classList.add("pay-option-wrap--open");
      exp.setAttribute("aria-hidden", "false");
    } else {
      wrap.classList.remove("pay-option-wrap--open");
      exp.setAttribute("aria-hidden", "true");
    }
  }

  function openPayModal() {
    var overlay = document.getElementById("pay-overlay");
    if (!overlay) {
      openWhatsApp();
      closeCartPanel();
      return;
    }
    var px = document.querySelector('input[name="payment"][value="pix"]');
    if (px) {
      px.checked = true;
    }
    var tro = document.getElementById("pay-troco");
    if (tro) tro.value = "";
    setMoneyExpand(false);
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.classList.add("pay-open");
  }

  function closePayModal() {
    var overlay = document.getElementById("pay-overlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("pay-open");
    setTimeout(function () {
      if (!overlay.classList.contains("is-open")) {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
      }
    }, 200);
  }

  function setupPayModal() {
    var overlay = document.getElementById("pay-overlay");
    if (!overlay) return;
    var form = document.getElementById("pay-form");
    var back = document.getElementById("pay-back");
    var allRadios = document.querySelectorAll('input[name="payment"]');

    function onPaymentChange() {
      for (var i = 0; i < allRadios.length; i++) {
        if (allRadios[i].checked && allRadios[i].value === "money") {
          setMoneyExpand(true);
          return;
        }
      }
      setMoneyExpand(false);
    }

    for (var r = 0; r < allRadios.length; r++) {
      allRadios[r].addEventListener("change", onPaymentChange);
    }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        closePayModal();
      }
    });

    if (back) {
      back.addEventListener("click", function () {
        closePayModal();
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var chosen = null;
        for (var j = 0; j < allRadios.length; j++) {
          if (allRadios[j].checked) {
            chosen = allRadios[j].value;
            break;
          }
        }
        if (!chosen) return;
        var trocoEl = document.getElementById("pay-troco");
        var tro = trocoEl ? trocoEl.value : "";
        checkoutPayment.method = chosen;
        checkoutPayment.troco = chosen === "money" ? (tro || "").trim() : "";
        closePayModal();
        openAddrModal();
      });
    }
  }

  function removeFromCartByProductId(pid) {
    var k = String(pid);
    if (cart[k] !== undefined) {
      delete cart[k];
    }
    if (cartMeta[k]) delete cartMeta[k];
    updateCartUI();
  }

  function addOptionsItemToCart(item, selections, note) {
    var meta = MenuOptions.buildCartMetaFromSelections(item, selections, note);
    var sig = JSON.stringify(selections) + (note || "");
    var cartId = "opt-" + item.id + "-" + sig.length + "-" + Date.now();
    cartMeta[cartId] = meta;
    cart[cartId] = 1;
    updateCartUI();
  }

  function readOptionsSelectionsFromDOM() {
    var overlay = document.getElementById("item-options-overlay");
    var out = {};
    if (!overlay || !pendingOptionsItem) return out;
    var layers = pendingOptionsItem.optionLayers || [];
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (layer.type === "multi") {
        var boxes = overlay.querySelectorAll('input[data-layer="' + layer.id + '"]:checked');
        var ids = [];
        for (var b = 0; b < boxes.length; b++) ids.push(boxes[b].value);
        out[layer.id] = ids;
      } else {
        var radio = overlay.querySelector('input[data-layer="' + layer.id + '"]:checked');
        out[layer.id] = radio ? radio.value : "";
      }
    }
    return out;
  }

  function showOptionsMsg(text, isErr) {
    var msg = document.getElementById("item-options-msg");
    if (!msg) return;
    msg.textContent = text || "";
    msg.className = "poke-msg" + (text ? (isErr ? " poke-msg--err" : " poke-msg--ok") : "");
  }

  function choicePriceLabel(item, layer, choice) {
    if (!choice) return "";
    if (layer.priceMode === "replace" || layer.priceMode === "base") {
      if (choice.price != null) return formatMoney(choice.price);
    }
    if (choice.priceDelta != null && choice.priceDelta > 0) return "+" + formatMoney(choice.priceDelta);
    return "";
  }

  function updateItemOptionsPreview() {
    if (!pendingOptionsItem || !window.MenuOptions) return;
    pendingOptionsSelections = readOptionsSelectionsFromDOM();
    var priceEl = document.getElementById("item-options-price");
    if (priceEl) {
      priceEl.textContent = formatMoney(MenuOptions.calcItemOptionsPrice(pendingOptionsItem, pendingOptionsSelections));
    }
    showOptionsMsg("");
  }

  function onMultiChoiceChange(ev, layer) {
    var overlay = document.getElementById("item-options-overlay");
    if (!overlay || !pendingOptionsItem) return;
    var selections = readOptionsSelectionsFromDOM();
    var max = MenuOptions.getMaxForLayer(layer, selections, pendingOptionsItem.optionLayers);
    var ids = MenuOptions.getSelectionArray(layer, selections[layer.id]);
    if (ids.length > max) {
      ev.target.checked = false;
      showOptionsMsg("Máximo de " + max + " em " + layer.label + ".", true);
    }
    updateItemOptionsPreview();
  }

  function buildItemOptionsUI(item) {
    var root = document.getElementById("item-options-layers");
    if (!root) return;
    root.innerHTML = "";
    var layers = item.optionLayers || [];
    for (var i = 0; i < layers.length; i++) {
      (function (layer) {
        var fs = document.createElement("fieldset");
        fs.className = "poke-fieldset";
        var legend = document.createElement("legend");
        legend.className = "poke-legend";
        legend.textContent = layer.label + (layer.required ? " *" : "");
        fs.appendChild(legend);
        var wrap = document.createElement("div");
        wrap.className = layer.type === "multi" ? "poke-ingredients" : "poke-sizes";
        for (var c = 0; c < (layer.choices || []).length; c++) {
          (function (choice, idx) {
            var lbl = document.createElement("label");
            lbl.className = layer.type === "multi" ? "poke-ing" : "poke-size";
            var inp = document.createElement("input");
            inp.type = layer.type === "multi" ? "checkbox" : "radio";
            inp.name = "layer-" + layer.id;
            inp.value = choice.id;
            inp.dataset.layer = layer.id;
            if (layer.type === "single" && idx === 0) inp.checked = true;
            inp.addEventListener("change", function (ev) {
              if (layer.type === "multi") onMultiChoiceChange(ev, layer);
              else updateItemOptionsPreview();
            });
            var box = document.createElement("span");
            box.className = layer.type === "multi" ? "poke-ing__box" : "poke-size__box";
            var priceTxt = choicePriceLabel(item, layer, choice);
            var sub = choice.subtitle ? " (" + choice.subtitle + ")" : "";
            box.innerHTML =
              "<strong>" + choice.label + sub + "</strong>" +
              (priceTxt ? " — " + priceTxt : "") +
              (choice.desc ? "<small>" + choice.desc + "</small>" : "");
            lbl.appendChild(inp);
            lbl.appendChild(box);
            wrap.appendChild(lbl);
          })(layer.choices[c], c);
        }
        fs.appendChild(wrap);
        root.appendChild(fs);
      })(layers[i]);
    }
    pendingOptionsSelections = MenuOptions.defaultSelections(layers);
    updateItemOptionsPreview();
  }

  function openItemOptionsModal(item) {
    var overlay = document.getElementById("item-options-overlay");
    if (!overlay || !item || !window.MenuOptions) return;
    pendingOptionsItem = item;
    var title = document.getElementById("item-options-title");
    var descEl = document.getElementById("item-options-desc");
    var noteEl = document.getElementById("item-options-note");
    if (title) title.textContent = item.name;
    if (descEl) {
      var d = (item.desc || "").trim();
      descEl.textContent = d;
      descEl.hidden = !d;
    }
    if (noteEl) noteEl.value = "";
    showOptionsMsg("");
    buildItemOptionsUI(item);
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.classList.add("item-options-open");
  }

  function closeItemOptionsModal() {
    var overlay = document.getElementById("item-options-overlay");
    if (!overlay) return;
    pendingOptionsItem = null;
    pendingOptionsSelections = {};
    overlay.classList.remove("is-open");
    document.body.classList.remove("item-options-open");
    setTimeout(function () {
      if (!overlay.classList.contains("is-open")) {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
      }
    }, 200);
  }

  function setupItemOptionsModal() {
    var overlay = document.getElementById("item-options-overlay");
    if (!overlay) return;
    var modal = document.getElementById("item-options-modal");
    var closeBtn = document.getElementById("item-options-close");
    var cancelBtn = document.getElementById("item-options-cancel");
    var addBtn = document.getElementById("item-options-add");
    var noteEl = document.getElementById("item-options-note");

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeItemOptionsModal();
    });
    if (modal) {
      modal.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    if (closeBtn) closeBtn.addEventListener("click", closeItemOptionsModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeItemOptionsModal);
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        if (!pendingOptionsItem) return;
        var selections = readOptionsSelectionsFromDOM();
        var v = MenuOptions.validateSelections(pendingOptionsItem, selections);
        if (!v.ok) {
          showOptionsMsg(v.error, true);
          return;
        }
        var note = noteEl ? noteEl.value : "";
        addOptionsItemToCart(pendingOptionsItem, selections, note);
        closeItemOptionsModal();
      });
    }
  }

  window.MercadoApp = {
    renderMenu: renderMenu,
    removeFromCartByProductId: removeFromCartByProductId,
    updateCart: updateCartUI,
  };

  function bootShop() {
    renderMenu();
    setupSearch();
    updateCartUI();
    setupCartPanel();
    setupPayModal();
    setupPixModal();
    setupAddrModal();
    setupItemOptionsModal();
  }

  if (window.whenMenuReady) {
    window.whenMenuReady(bootShop);
  } else {
    bootShop();
  }
})();
