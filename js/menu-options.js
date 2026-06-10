/**
 * Camadas de seleção do cardápio — cálculo de preço e validação (loja + admin).
 */
(function () {
  function findLayer(layers, id) {
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].id === id) return layers[i];
    }
    return null;
  }

  function findChoice(layer, choiceId) {
    if (!layer || !layer.choices) return null;
    for (var i = 0; i < layer.choices.length; i++) {
      if (layer.choices[i].id === choiceId) return layer.choices[i];
    }
    return null;
  }

  function itemHasOptions(item) {
    return Boolean(item && item.optionLayers && item.optionLayers.length > 0);
  }

  function slugCategoryId(name) {
    var s = String(name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return s || "outros";
  }

  function getSelectionArray(layer, value) {
    if (layer.type === "multi") {
      return Array.isArray(value) ? value : [];
    }
    return value ? [value] : [];
  }

  function getMaxForLayer(layer, selections, layers) {
    if (layer.max != null && layer.max !== "") return Number(layer.max);
    if (layer.maxChoicesFromLayer) {
      var ref = selections[layer.maxChoicesFromLayer];
      var refLayer = findLayer(layers, layer.maxChoicesFromLayer);
      var choice = findChoice(refLayer, ref);
      if (choice && choice.meta && choice.meta.maxChoices != null) {
        return Number(choice.meta.maxChoices);
      }
    }
    return 999;
  }

  function calcItemOptionsPrice(item, selections) {
    var layers = item.optionLayers || [];
    var base = Number(item.price) || 0;
    var total = base;
    var replaced = false;

    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var raw = selections[layer.id];
      var mode = layer.priceMode || "delta";
      var ids = getSelectionArray(layer, raw);

      if (layer.type === "single") {
        var choice = findChoice(layer, raw);
        if (!choice) continue;
        if (mode === "replace" || mode === "base") {
          total = Number(choice.price != null ? choice.price : base);
          replaced = true;
        } else {
          total += Number(choice.priceDelta) || 0;
        }
      } else {
        for (var j = 0; j < ids.length; j++) {
          var c = findChoice(layer, ids[j]);
          if (!c) continue;
          if (!replaced && mode === "base" && j === 0) {
            total = Number(c.price != null ? c.price : base);
            replaced = true;
          } else {
            total += Number(c.priceDelta != null ? c.priceDelta : c.price) || 0;
          }
        }
      }
    }
    return Math.max(0, total);
  }

  function minPriceFromLayers(item) {
    var layers = item.optionLayers || [];
    if (!layers.length) return Number(item.price) || 0;
    var min = null;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (layer.type !== "single" || !layer.choices || !layer.choices.length) continue;
      if (layer.priceMode === "replace" || layer.priceMode === "base") {
        for (var j = 0; j < layer.choices.length; j++) {
          var p = Number(layer.choices[j].price);
          if (!isNaN(p) && (min === null || p < min)) min = p;
        }
      }
    }
    if (min !== null) return min;
    return Number(item.price) || 0;
  }

  function validateSelections(item, selections) {
    var layers = item.optionLayers || [];
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var raw = selections[layer.id];
      var ids = getSelectionArray(layer, raw);

      if (layer.required && !ids.length) {
        return { ok: false, error: "Escolha: " + (layer.label || layer.id) + "." };
      }
      if (layer.type === "single" && ids.length > 1) {
        return { ok: false, error: "Escolha apenas uma opção em " + layer.label + "." };
      }
      if (layer.min != null && ids.length < Number(layer.min)) {
        return { ok: false, error: "Mínimo de " + layer.min + " em " + layer.label + "." };
      }
      var max = getMaxForLayer(layer, selections, layers);
      if (ids.length > max) {
        return { ok: false, error: "Máximo de " + max + " em " + layer.label + "." };
      }
    }
    return { ok: true };
  }

  function formatSelectionsDetail(layers, selections) {
    var lines = [];
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var raw = selections[layer.id];
      var ids = getSelectionArray(layer, raw);
      if (!ids.length) continue;
      var labels = [];
      for (var j = 0; j < ids.length; j++) {
        var c = findChoice(layer, ids[j]);
        if (c) labels.push(c.label + (c.subtitle ? " (" + c.subtitle + ")" : ""));
      }
      if (labels.length) lines.push((layer.label || layer.id) + ": " + labels.join(", "));
    }
    return lines.join("\n");
  }

  function buildCartMetaFromSelections(item, selections, note) {
    var layers = item.optionLayers || [];
    var price = calcItemOptionsPrice(item, selections);
    var detail = formatSelectionsDetail(layers, selections);
    var n = (note || "").trim();
    if (n) detail = (detail ? detail + "\n" : "") + "Obs: " + n;
    var suffix = "";
    var sizeLayer = findLayer(layers, "tamanho");
    if (sizeLayer && selections.tamanho) {
      var sc = findChoice(sizeLayer, selections.tamanho);
      if (sc) suffix = " — " + sc.label;
    }
    return {
      id: item.id,
      name: item.name + suffix,
      price: price,
      desc: item.desc,
      image: item.image,
      category: item.categoryName || item.category,
      categoryId: item.categoryId,
      note: n,
      detail: detail,
      selections: selections,
      optionLayers: layers,
    };
  }

  function emptySelections(layers) {
    var s = {};
    for (var i = 0; i < layers.length; i++) {
      s[layers[i].id] = layers[i].type === "multi" ? [] : "";
    }
    return s;
  }

  function defaultSelections(layers) {
    var s = emptySelections(layers);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (layer.type === "single" && layer.choices && layer.choices.length) {
        s[layer.id] = layer.choices[0].id;
      }
    }
    return s;
  }

  window.MenuOptions = {
    findLayer: findLayer,
    findChoice: findChoice,
    itemHasOptions: itemHasOptions,
    slugCategoryId: slugCategoryId,
    calcItemOptionsPrice: calcItemOptionsPrice,
    minPriceFromLayers: minPriceFromLayers,
    validateSelections: validateSelections,
    formatSelectionsDetail: formatSelectionsDetail,
    buildCartMetaFromSelections: buildCartMetaFromSelections,
    emptySelections: emptySelections,
    defaultSelections: defaultSelections,
    getMaxForLayer: getMaxForLayer,
    getSelectionArray: getSelectionArray,
  };
})();
