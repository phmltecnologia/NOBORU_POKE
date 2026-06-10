/**
 * Editor de camadas de seleção no painel admin.
 */
(function () {
  var root = null;
  var onChange = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function newLayerId() {
    return "layer-" + Date.now().toString(36);
  }

  function newChoiceId() {
    return "opt-" + Math.random().toString(36).slice(2, 8);
  }

  function parseNum(v) {
    if (v === "" || v == null) return null;
    var t = String(v).replace(",", ".");
    var n = parseFloat(t);
    return isNaN(n) ? null : n;
  }

  function readLayers() {
    if (!root) return [];
    var cards = root.querySelectorAll(".opt-layer");
    var out = [];
    cards.forEach(function (card) {
      var layer = {
        id: (card.querySelector(".opt-layer__id") || {}).value || newLayerId(),
        label: (card.querySelector(".opt-layer__label") || {}).value || "",
        type: (card.querySelector(".opt-layer__type") || {}).value || "single",
        required: (card.querySelector(".opt-layer__required") || {}).checked || false,
        priceMode: (card.querySelector(".opt-layer__pricemode") || {}).value || "delta",
      };
      var minEl = card.querySelector(".opt-layer__min");
      var maxEl = card.querySelector(".opt-layer__max");
      var maxFrom = card.querySelector(".opt-layer__maxfrom");
      if (minEl && minEl.value !== "") layer.min = parseNum(minEl.value);
      if (maxEl && maxEl.value !== "") layer.max = parseNum(maxEl.value);
      if (maxFrom && maxFrom.value.trim()) layer.maxChoicesFromLayer = maxFrom.value.trim();

      var choices = [];
      card.querySelectorAll(".opt-choice").forEach(function (row) {
        var c = {
          id: (row.querySelector(".opt-choice__id") || {}).value || newChoiceId(),
          label: (row.querySelector(".opt-choice__label") || {}).value || "",
        };
        var sub = row.querySelector(".opt-choice__subtitle");
        if (sub && sub.value.trim()) c.subtitle = sub.value.trim();
        var price = row.querySelector(".opt-choice__price");
        var delta = row.querySelector(".opt-choice__delta");
        var metaMax = row.querySelector(".opt-choice__metamax");
        if (price && price.value !== "") c.price = parseNum(price.value);
        if (delta && delta.value !== "") c.priceDelta = parseNum(delta.value);
        if (metaMax && metaMax.value !== "") {
          c.meta = { maxChoices: parseNum(metaMax.value) };
        }
        if (c.label) choices.push(c);
      });
      layer.choices = choices;
      if (layer.label) out.push(layer);
    });
    return out;
  }

  function notify() {
    if (onChange) onChange(readLayers());
  }

  function buildChoiceRow(choice, priceMode) {
    var row = el("div", "opt-choice");
    row.innerHTML =
      '<input type="hidden" class="opt-choice__id" value="' +
      (choice.id || newChoiceId()) +
      '" />' +
      '<input class="field__input opt-choice__label" type="text" placeholder="Nome da opção" value="' +
      (choice.label || "").replace(/"/g, "&quot;") +
      '" />' +
      '<input class="field__input opt-choice__subtitle" type="text" placeholder="Subtítulo (opc.)" value="' +
      (choice.subtitle || "").replace(/"/g, "&quot;") +
      '" />' +
      '<input class="field__input opt-choice__price" type="text" placeholder="Preço" value="' +
      (choice.price != null ? choice.price : "") +
      '" />' +
      '<input class="field__input opt-choice__delta" type="text" placeholder="+R$" value="' +
      (choice.priceDelta != null ? choice.priceDelta : "") +
      '" />' +
      '<input class="field__input opt-choice__metamax" type="number" min="0" placeholder="Máx extras" value="' +
      (choice.meta && choice.meta.maxChoices != null ? choice.meta.maxChoices : "") +
      '" title="Máx. complementos (só tamanho builder)" />' +
      '<button type="button" class="menuadmin-icobtn menuadmin-icobtn--del opt-choice__del">×</button>';

    row.querySelector(".opt-choice__del").addEventListener("click", function () {
      row.remove();
      notify();
    });
    row.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("input", notify);
      inp.addEventListener("change", notify);
    });
    return row;
  }

  function buildLayerCard(layer) {
    var card = el("div", "opt-layer");
    var head = el("div", "opt-layer__head");
    head.innerHTML =
      '<input type="hidden" class="opt-layer__id" value="' +
      (layer.id || newLayerId()) +
      '" />' +
      '<input class="field__input opt-layer__label" type="text" placeholder="Nome da camada (ex.: Tamanho)" value="' +
      (layer.label || "").replace(/"/g, "&quot;") +
      '" />' +
      '<select class="field__input opt-layer__type"><option value="single">Uma opção</option><option value="multi">Várias opções</option></select>' +
      '<select class="field__input opt-layer__pricemode"><option value="replace">Preço da opção substitui</option><option value="delta">Soma ao total</option><option value="base">Base (monte seu)</option></select>' +
      '<label class="opt-layer__req"><input type="checkbox" class="opt-layer__required" /> Obrigatório</label>' +
      '<button type="button" class="menuadmin-icobtn menuadmin-icobtn--del opt-layer__del">Remover camada</button>';

    var typeSel = head.querySelector(".opt-layer__type");
    typeSel.value = layer.type || "single";
    head.querySelector(".opt-layer__pricemode").value = layer.priceMode || "delta";
    if (layer.required) head.querySelector(".opt-layer__required").checked = true;

    var extra = el("div", "opt-layer__extra");
    extra.innerHTML =
      '<input class="field__input opt-layer__min" type="number" min="0" placeholder="Mín." value="' +
      (layer.min != null ? layer.min : "") +
      '" />' +
      '<input class="field__input opt-layer__max" type="number" min="0" placeholder="Máx." value="' +
      (layer.max != null ? layer.max : "") +
      '" />' +
      '<input class="field__input opt-layer__maxfrom" type="text" placeholder="Máx. vem da camada (id)" value="' +
      (layer.maxChoicesFromLayer || "") +
      '" />';

    var choicesWrap = el("div", "opt-layer__choices");
    (layer.choices || []).forEach(function (c) {
      choicesWrap.appendChild(buildChoiceRow(c, layer.priceMode));
    });

    var addChoice = el("button", "btn btn--ghost opt-layer__addchoice", "+ Opção");
    addChoice.type = "button";
    addChoice.addEventListener("click", function () {
      choicesWrap.appendChild(buildChoiceRow({}, layer.priceMode));
      notify();
    });

    head.querySelector(".opt-layer__del").addEventListener("click", function () {
      card.remove();
      notify();
    });
    head.querySelectorAll("input, select").forEach(function (inp) {
      inp.addEventListener("input", notify);
      inp.addEventListener("change", notify);
    });
    extra.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("input", notify);
      inp.addEventListener("change", notify);
    });

    card.appendChild(head);
    card.appendChild(extra);
    card.appendChild(choicesWrap);
    card.appendChild(addChoice);
    return card;
  }

  window.MenuOptionsEditor = {
    mount: function (container, layers, changeCb) {
      root = container;
      onChange = changeCb;
      root.innerHTML = "";
      var list = layers && layers.length ? layers : [];
      list.forEach(function (layer) {
        root.appendChild(buildLayerCard(layer));
      });
      var addBtn = el("button", "btn btn--ghost opt-editor__addlayer", "+ Adicionar camada");
      addBtn.type = "button";
      addBtn.addEventListener("click", function () {
        root.insertBefore(
          buildLayerCard({ id: newLayerId(), label: "", type: "single", priceMode: "replace", choices: [] }),
          addBtn
        );
        notify();
      });
      root.appendChild(addBtn);
    },
    read: readLayers,
    clear: function () {
      if (root) root.innerHTML = "";
    },
  };
})();
