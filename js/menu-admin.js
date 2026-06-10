(function () {
  if (!window.MENU || !window.MercadoApp) return;

  var overlay = document.getElementById("menuadmin-overlay");
  if (!overlay) return;

  var listEl = document.getElementById("menuadmin-list");
  var form = document.getElementById("menuadmin-form");
  var msg = document.getElementById("menuadmin-msg");
  var editId = document.getElementById("m-edit-id");
  var titleForm = document.getElementById("menuadmin-form-title");
  var btnAdd = document.getElementById("menuadmin-btn-add");
  var btnOpen = document.getElementById("btn-menuadmin");
  var layersRoot = document.getElementById("m-option-layers");
  var currentLayers = [];

  function refreshShopUI() {
    if (window.MercadoApp) {
      if (MercadoApp.renderMenu) MercadoApp.renderMenu();
      if (MercadoApp.updateCart) MercadoApp.updateCart();
    }
  }

  function showMsg(t, isErr) {
    if (!msg) return;
    if (!t) {
      msg.textContent = "";
      msg.className = "menuadmin-msg";
      return;
    }
    msg.textContent = t;
    msg.className = "menuadmin-msg" + (isErr ? " menuadmin-msg--err" : " menuadmin-msg--ok");
  }

  function parsePriceBRL(s) {
    if (s == null || s === "") return NaN;
    var t = String(s).replace(/\s/g, "");
    if (t.indexOf(",") >= 0) {
      t = t.replace(/\./g, "");
      t = t.replace(",", ".");
    } else {
      t = t.replace(/[^\d.-]/g, "");
    }
    return parseFloat(t, 10);
  }

  function nextMenuId() {
    var max = 0;
    var m = window.MENU;
    for (var i = 0; i < m.length; i++) {
      var n = parseInt(m[i].id, 10);
      if (!isNaN(n) && n > max) max = n;
    }
    if (max === 0) return String(Date.now());
    return String(max + 1);
  }

  function categoryNameById(id) {
    var cats = window.CATEGORIES || [];
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === id) return cats[i].name;
    }
    return "Outros";
  }

  function refreshCategorySelect() {
    if (window.__menuCategoriesAdmin && __menuCategoriesAdmin.refreshSelect) {
      __menuCategoriesAdmin.refreshSelect();
    }
  }

  function mountLayersEditor(layers) {
    currentLayers = layers || [];
    if (window.MenuOptionsEditor && layersRoot) {
      MenuOptionsEditor.mount(layersRoot, currentLayers, function (updated) {
        currentLayers = updated;
      });
    }
  }

  function setupTabs() {
    var tabs = overlay.querySelectorAll(".menuadmin-tabs__btn");
    var panelItems = document.getElementById("menuadmin-tab-items");
    var panelCats = document.getElementById("menuadmin-tab-categories");
    tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-tab");
        tabs.forEach(function (b) {
          b.classList.toggle("menuadmin-tabs__btn--active", b === btn);
        });
        if (panelItems) panelItems.hidden = tab !== "items";
        if (panelCats) panelCats.hidden = tab !== "categories";
        if (tab === "categories" && window.__menuCategoriesAdmin) {
          __menuCategoriesAdmin.render();
        }
      });
    });
  }

  function renderList() {
    if (!listEl) return;
    var m = window.MENU;
    listEl.innerHTML = "";
    if (m.length === 0) {
      var p = document.createElement("p");
      p.className = "menuadmin-empty";
      p.textContent = "Nenhum item. Use “Novo item” abaixo.";
      listEl.appendChild(p);
      return;
    }
    for (var i = 0; i < m.length; i++) {
      (function (item) {
        var row = document.createElement("div");
        row.className = "menuadmin-row";
        var info = document.createElement("div");
        info.className = "menuadmin-row__info";
        var n = document.createElement("strong");
        n.className = "menuadmin-row__name";
        n.textContent = item.name;
        var meta = document.createElement("div");
        meta.className = "menuadmin-row__meta";
        var layerCount = (item.optionLayers || []).length;
        meta.textContent =
          (item.categoryName || item.category || "—") +
          " · " +
          formatBRL(item.price) +
          (layerCount ? " · " + layerCount + " camada(s)" : "") +
          (item.id ? " · id " + item.id : "");
        info.appendChild(n);
        info.appendChild(meta);
        var actions = document.createElement("div");
        actions.className = "menuadmin-row__actions";
        var bEdit = document.createElement("button");
        bEdit.type = "button";
        bEdit.className = "menuadmin-icobtn";
        bEdit.textContent = "Editar";
        bEdit.addEventListener("click", function () {
          startEdit(item);
        });
        var bDel = document.createElement("button");
        bDel.type = "button";
        bDel.className = "menuadmin-icobtn menuadmin-icobtn--del";
        bDel.textContent = "Excluir";
        bDel.addEventListener("click", async function () {
          if (!confirm("Remover “" + item.name + "” do cardápio?")) return;
          try {
            if (window.deleteMenuItemFromCloud) await deleteMenuItemFromCloud(String(item.id));
          } catch (ex) {
            showMsg(ex.message || "Erro ao remover.", true);
            return;
          }
          window.MENU = window.MENU.filter(function (x) {
            return String(x.id) !== String(item.id);
          });
          await window.saveMenuCatalog();
          if (MercadoApp.removeFromCartByProductId) MercadoApp.removeFromCartByProductId(String(item.id));
          refreshShopUI();
          renderList();
          showMsg("Item removido.");
          resetForm();
        });
        actions.appendChild(bEdit);
        actions.appendChild(bDel);
        row.appendChild(info);
        row.appendChild(actions);
        listEl.appendChild(row);
      })(m[i]);
    }
  }

  function formatBRL(n) {
    return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function resetForm() {
    if (form) form.reset();
    if (editId) editId.value = "";
    if (titleForm) titleForm.textContent = "Novo item";
    currentLayers = [];
    mountLayersEditor([]);
    if (window.__menuImage && window.__menuImage.clearImageUI) window.__menuImage.clearImageUI();
    refreshCategorySelect();
  }

  function startEdit(item) {
    if (!form) return;
    showMsg("");
    if (titleForm) titleForm.textContent = "Editar item";
    if (editId) editId.value = String(item.id);
    document.getElementById("m-name").value = item.name || "";
    document.getElementById("m-price").value = String(item.price).replace(".", ",");
    document.getElementById("m-desc").value = item.desc || "";
    refreshCategorySelect();
    var catSel = document.getElementById("m-category");
    if (catSel) catSel.value = item.categoryId || item.category || "";
    mountLayersEditor(item.optionLayers || []);
    if (window.__menuImage && window.__menuImage.setFromStoredValue) {
      window.__menuImage.setFromStoredValue(item.image || "");
    }
    var panel = document.getElementById("menuadmin-form-panel");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function openOverlay() {
    showMsg("");
    resetForm();
    refreshCategorySelect();
    renderList();
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.classList.add("menuadmin-open");
  }

  function closeOverlay() {
    overlay.classList.remove("is-open");
    document.body.classList.remove("menuadmin-open");
    setTimeout(function () {
      if (!overlay.classList.contains("is-open")) {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
      }
    }, 200);
  }

  function initImageField() {
    var hidden = document.getElementById("m-image");
    var fileIn = document.getElementById("m-image-file");
    var urlIn = document.getElementById("m-image-url");
    var drop = document.getElementById("m-image-drop");
    var zone = document.getElementById("m-image-zone");
    var empty = document.getElementById("m-image-empty");
    var preview = document.getElementById("m-image-preview");
    var prevImg = document.getElementById("m-image-preview-img");
    var browse = document.getElementById("m-image-browse");
    var clearBtn = document.getElementById("m-image-clear");
    if (!hidden || !fileIn || !zone) return;

    function isMenuAdminOpen() {
      return document.body && document.body.classList.contains("menuadmin-open");
    }

    function clearImageUI() {
      hidden.value = "";
      if (urlIn) urlIn.value = "";
      fileIn.value = "";
      if (prevImg) {
        prevImg.removeAttribute("src");
        prevImg.alt = "Pré-visualização";
      }
      if (empty) empty.hidden = false;
      if (preview) preview.hidden = true;
      if (zone) zone.classList.remove("img-drop__zone--drag");
    }

    function showPreviewForUrl(url) {
      if (!prevImg || !empty || !preview) return;
      empty.hidden = true;
      preview.hidden = false;
      prevImg.src = url;
    }

    function setFromStoredValue(s) {
      if (!s) {
        clearImageUI();
        return;
      }
      hidden.value = s;
      if (urlIn) urlIn.value = String(s).indexOf("http") === 0 ? s : "";
      fileIn.value = "";
      showPreviewForUrl(s);
    }

    function compressDataUrl(dataUrl, callback) {
      var img = new Image();
      img.onload = function () {
        try {
          var maxW = 800;
          var maxH = 800;
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if (!w || !h) {
            callback(dataUrl);
            return;
          }
          var r = Math.min(maxW / w, maxH / h, 1);
          var c = document.createElement("canvas");
          c.width = Math.round(w * r);
          c.height = Math.round(h * r);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          callback(c.toDataURL("image/jpeg", 0.82) || dataUrl);
        } catch (e) {
          callback(dataUrl);
        }
      };
      img.onerror = function () {
        callback(dataUrl);
      };
      img.src = dataUrl;
    }

    function processFile(file) {
      if (!file || file.type.indexOf("image/") !== 0) {
        showMsg("Escolhe um ficheiro de imagem.", true);
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        compressDataUrl(reader.result, function (small) {
          hidden.value = small;
          if (urlIn) urlIn.value = "";
          fileIn.value = "";
          showPreviewForUrl(small);
        });
      };
      reader.readAsDataURL(file);
    }

    if (browse) browse.addEventListener("click", function (e) {
      e.preventDefault();
      if (isMenuAdminOpen()) fileIn.click();
    });
    if (fileIn) fileIn.addEventListener("change", function () {
      if (fileIn.files && fileIn.files[0]) processFile(fileIn.files[0]);
    });
    if (clearBtn) clearBtn.addEventListener("click", clearImageUI);
    if (urlIn) {
      urlIn.addEventListener("blur", function () {
        var t = (urlIn.value || "").trim();
        if (t && t.indexOf("http") === 0) {
          hidden.value = t;
          showPreviewForUrl(t);
        }
      });
    }

    window.__menuImage = { clearImageUI: clearImageUI, setFromStoredValue: setFromStoredValue };
  }

  initImageField();
  setupTabs();

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var name = (document.getElementById("m-name").value || "").trim();
      var priceRaw = document.getElementById("m-price").value;
      var desc = (document.getElementById("m-desc").value || "").trim();
      var categoryId = (document.getElementById("m-category").value || "").trim();
      var categoryName = categoryNameById(categoryId);
      var h = (document.getElementById("m-image") && document.getElementById("m-image").value) || "";
      var u = (document.getElementById("m-image-url") && document.getElementById("m-image-url").value) || "";
      var image = (h || u || "").trim();
      if (!name) {
        showMsg("Informe o nome do prato ou item.", true);
        return;
      }
      if (!categoryId) {
        showMsg("Escolha uma categoria.", true);
        return;
      }
      var price = parsePriceBRL(priceRaw);
      if (isNaN(price) || price < 0) {
        showMsg("Preço inválido.", true);
        return;
      }

      var layers = window.MenuOptionsEditor ? MenuOptionsEditor.read() : currentLayers;
      var idExisting = (editId && editId.value) || "";
      var obj = {
        id: idExisting || nextMenuId(),
        name: name,
        price: price,
        desc: desc,
        categoryId: categoryId,
        categoryName: categoryName,
        category: categoryName,
        optionLayers: layers,
      };
      if (image) obj.image = image;

      try {
        if (window.saveMenuItemToCloud) {
          var saved = await saveMenuItemToCloud(obj);
          if (saved) obj = saved;
        }
        if (idExisting) {
          for (var i = 0; i < window.MENU.length; i++) {
            if (String(window.MENU[i].id) === String(obj.id)) {
              window.MENU[i] = obj;
              break;
            }
          }
        } else {
          window.MENU.push(obj);
        }
        await window.saveMenuCatalog();
      } catch (ex) {
        showMsg(ex.message || "Erro ao salvar.", true);
        return;
      }

      showMsg(idExisting ? "Item atualizado." : "Item adicionado.");
      refreshShopUI();
      renderList();
      resetForm();
      refreshCategorySelect();
    });
  }

  if (btnAdd) btnAdd.addEventListener("click", function () {
    resetForm();
    showMsg("");
  });

  if (btnOpen) {
    btnOpen.addEventListener("click", function () {
      if (window.Auth && Auth.isAdmin && !Auth.isAdmin()) {
        alert("Somente administradores podem editar o cardápio.");
        return;
      }
      openOverlay();
    });
  }
  var bClose = document.getElementById("menuadmin-close");
  if (bClose) bClose.addEventListener("click", closeOverlay);
  var bCancel = document.getElementById("menuadmin-cancel");
  if (bCancel) bCancel.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeOverlay();
  });
})();
