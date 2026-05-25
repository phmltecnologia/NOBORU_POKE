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

  function refreshShopUI() {
    if (window.MercadoApp) {
      if (MercadoApp.renderMenu) {
        MercadoApp.renderMenu();
      }
      if (MercadoApp.updateCart) {
        MercadoApp.updateCart();
      }
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

  function categoryDatalist() {
    var seen = {};
    var out = [];
    function addList(arr) {
      for (var i = 0; i < arr.length; i++) {
        var c = arr[i].category || "Outros";
        if (!seen[c]) {
          seen[c] = true;
          out.push(c);
        }
      }
    }
    addList(window.MENU || []);
    if (window.MENU_DEFAULT) addList(window.MENU_DEFAULT);
    return out.sort();
  }

  function refreshDatalist() {
    var dl = document.getElementById("menuadmin-cat-list");
    if (!dl) return;
    dl.innerHTML = "";
    var list = categoryDatalist();
    for (var i = 0; i < list.length; i++) {
      var o = document.createElement("option");
      o.value = list[i];
      dl.appendChild(o);
    }
  }

  function renderList() {
    if (!listEl) return;
    var m = window.MENU;
    listEl.innerHTML = "";
    if (m.length === 0) {
      listEl.appendChild(
        (function () {
          var p = document.createElement("p");
          p.className = "menuadmin-empty";
          p.textContent = "Nenhum item. Use “Novo item” abaixo.";
          return p;
        })()
      );
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
        meta.textContent =
          (item.category || "—") + " · " + formatBRL(item.price) + (item.id ? " · id " + item.id : "");
        info.appendChild(n);
        info.appendChild(meta);
        var actions = document.createElement("div");
        actions.className = "menuadmin-row__actions";
        var bEdit = document.createElement("button");
        bEdit.type = "button";
        bEdit.className = "menuadmin-icobtn";
        bEdit.setAttribute("aria-label", "Editar");
        bEdit.textContent = "Editar";
        bEdit.addEventListener("click", function () {
          startEdit(item);
        });
        var bDel = document.createElement("button");
        bDel.type = "button";
        bDel.className = "menuadmin-icobtn menuadmin-icobtn--del";
        bDel.setAttribute("aria-label", "Excluir");
        bDel.textContent = "Excluir";
        bDel.addEventListener("click", function () {
          if (
            !confirm("Remover “" + item.name + "” do cardápio? Será removido também do carrinho, se houver.")
          ) {
            return;
          }
          var idx = -1;
          for (var j = 0; j < window.MENU.length; j++) {
            if (String(window.MENU[j].id) === String(item.id)) {
              idx = j;
              break;
            }
          }
          if (idx < 0) return;
          window.MENU.splice(idx, 1);
          window.saveMenuCatalog();
          if (window.MercadoApp && MercadoApp.removeFromCartByProductId) {
            MercadoApp.removeFromCartByProductId(String(item.id));
          }
          refreshShopUI();
          renderList();
          showMsg("Item removido.");
          resetForm();
          refreshDatalist();
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
    if (form) {
      form.reset();
    }
    if (editId) editId.value = "";
    if (titleForm) titleForm.textContent = "Novo item";
    if (window.__menuImage && window.__menuImage.clearImageUI) {
      window.__menuImage.clearImageUI();
    }
  }

  function startEdit(item) {
    if (!form) return;
    showMsg("");
    if (titleForm) titleForm.textContent = "Editar item";
    if (editId) editId.value = String(item.id);
    document.getElementById("m-name").value = item.name || "";
    document.getElementById("m-price").value = String(item.price).replace(".", ",");
    document.getElementById("m-desc").value = item.desc || "";
    document.getElementById("m-category").value = item.category || "";
    if (window.__menuImage && window.__menuImage.setFromStoredValue) {
      window.__menuImage.setFromStoredValue(item.image || "");
    }
    var panel = document.getElementById("menuadmin-form-panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function openOverlay() {
    showMsg("");
    resetForm();
    refreshDatalist();
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
      if (urlIn) {
        urlIn.value = "";
      }
      fileIn.value = "";
      if (prevImg) {
        prevImg.removeAttribute("src");
        prevImg.alt = "Pré-visualização";
      }
      if (empty) {
        empty.hidden = false;
      }
      if (preview) {
        preview.hidden = true;
      }
      if (zone) {
        zone.classList.remove("img-drop__zone--drag");
      }
    }

    function showPreviewForUrl(url) {
      if (!prevImg || !empty || !preview) {
        return;
      }
      empty.hidden = true;
      preview.hidden = false;
      prevImg.onload = function () {
        prevImg.onload = null;
        prevImg.onerror = null;
      };
      prevImg.onerror = function () {
        if (String(url).indexOf("data:") === 0) {
          return;
        }
        showMsg("Não foi possível mostrar a imagem. Verifica o link ou a rede.", true);
        clearImageUI();
      };
      prevImg.src = url;
    }

    function setFromStoredValue(s) {
      if (!s) {
        clearImageUI();
        return;
      }
      hidden.value = s;
      if (urlIn) {
        if (String(s).indexOf("http") === 0) {
          urlIn.value = s;
        } else {
          urlIn.value = "";
        }
      }
      if (fileIn) {
        fileIn.value = "";
      }
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
          var nw = Math.round(w * r);
          var nh = Math.round(h * r);
          var c = document.createElement("canvas");
          c.width = nw;
          c.height = nh;
          c.getContext("2d").drawImage(img, 0, 0, nw, nh);
          var out = c.toDataURL("image/jpeg", 0.82);
          callback(out || dataUrl);
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
      if (!file) {
        return;
      }
      if (!file.type || file.type.indexOf("image/") !== 0) {
        showMsg("Escolhe um ficheiro de imagem (JPG, PNG, GIF, WebP).", true);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showMsg("Ficheiro demasiado grande. Tenta outro (máx. 5 MB).", true);
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var d = reader.result;
        if (String(d).length > 2 * 1024 * 1024) {
          showMsg("Imagem muito pesada. Escolhe um ficheiro mais pequeno.", true);
          return;
        }
        compressDataUrl(d, function (small) {
          if (String(small).length > 1.5 * 1024 * 1024) {
            showMsg("Imagem muito pesada após ajuste. Tenta outra com menos pormenor.", true);
            return;
          }
          hidden.value = small;
          if (urlIn) {
            urlIn.value = "";
          }
          if (fileIn) {
            fileIn.value = "";
          }
          showPreviewForUrl(small);
        });
      };
      reader.onerror = function () {
        showMsg("Não foi possível ler o ficheiro.", true);
      };
      reader.readAsDataURL(file);
    }

    if (browse) {
      browse.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (!isMenuAdminOpen()) return;
        fileIn.click();
      });
    }
    if (fileIn) {
      fileIn.addEventListener("change", function () {
        if (fileIn.files && fileIn.files[0]) {
          processFile(fileIn.files[0]);
        }
      });
    }
    if (empty) {
      empty.addEventListener("click", function (e) {
        if (e.target && (e.target.id === "m-image-browse" || (e.target.closest && e.target.closest("#m-image-browse")))) {
          return;
        }
        e.preventDefault();
        if (!isMenuAdminOpen()) return;
        fileIn.click();
      });
    }
    if (zone) {
      ["dragenter", "dragover"].forEach(function (name) {
        drop.addEventListener(name, function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (!isMenuAdminOpen()) return;
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "copy";
          }
          zone.classList.add("img-drop__zone--drag");
        });
      });
      drop.addEventListener("dragleave", function (e) {
        if (!e.relatedTarget || (drop && !drop.contains(e.relatedTarget))) {
          zone.classList.remove("img-drop__zone--drag");
        }
      });
      drop.addEventListener("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isMenuAdminOpen()) return;
        zone.classList.remove("img-drop__zone--drag");
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) {
          processFile(f);
        }
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        clearImageUI();
      });
    }
    if (urlIn) {
      urlIn.addEventListener("blur", function () {
        var t = (urlIn.value || "").trim();
        if (t) {
          if (t.indexOf("http") !== 0) {
            showMsg("O link deve começar por http:// ou https://", true);
            return;
          }
          hidden.value = t;
          if (fileIn) {
            fileIn.value = "";
          }
          showPreviewForUrl(t);
        } else {
          if (String(hidden.value || "").indexOf("http") === 0) {
            clearImageUI();
          }
        }
      });
    }
    if (zone) {
      zone.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isMenuAdminOpen()) return;
          if (!preview || preview.hidden) {
            fileIn.click();
          }
        }
      });
    }

    window.__menuImage = {
      clearImageUI: clearImageUI,
      setFromStoredValue: setFromStoredValue,
    };
  }

  initImageField();

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (document.getElementById("m-name").value || "").trim();
      var priceRaw = document.getElementById("m-price").value;
      var desc = (document.getElementById("m-desc").value || "").trim();
      var category = (document.getElementById("m-category").value || "").trim() || "Outros";
      var h = (document.getElementById("m-image") && document.getElementById("m-image").value) || "";
      var u = (document.getElementById("m-image-url") && document.getElementById("m-image-url").value) || "";
      var image = (h || u || "").trim();
      if (!name) {
        showMsg("Informe o nome do prato ou item.", true);
        return;
      }
      var price = parsePriceBRL(priceRaw);
      if (isNaN(price) || price < 0) {
        showMsg("Preço inválido. Use o formato 12,50 ou 12.5", true);
        return;
      }

      var idExisting = (editId && editId.value) || "";
      if (idExisting) {
        for (var i = 0; i < window.MENU.length; i++) {
          if (String(window.MENU[i].id) === idExisting) {
            window.MENU[i] = {
              id: idExisting,
              name: name,
              price: price,
              desc: desc,
              category: category,
            };
            if (image) window.MENU[i].image = image;
            else delete window.MENU[i].image;
            break;
          }
        }
        showMsg("Item atualizado.");
      } else {
        var newId = nextMenuId();
        var obj = {
          id: newId,
          name: name,
          price: price,
          desc: desc,
          category: category,
        };
        if (image) obj.image = image;
        window.MENU.push(obj);
        showMsg("Item adicionado.");
      }
      window.saveMenuCatalog();
      refreshShopUI();
      renderList();
      resetForm();
      refreshDatalist();
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", function () {
      resetForm();
      showMsg("");
    });
  }

  if (btnOpen) {
    btnOpen.addEventListener("click", openOverlay);
  }
  var bClose = document.getElementById("menuadmin-close");
  if (bClose) {
    bClose.addEventListener("click", closeOverlay);
  }
  var bCancel = document.getElementById("menuadmin-cancel");
  if (bCancel) {
    bCancel.addEventListener("click", closeOverlay);
  }
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeOverlay();
  });
})();
