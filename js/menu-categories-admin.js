/**
 * CRUD de categorias no painel admin.
 */
(function () {
  var listEl = document.getElementById("menuadmin-categories-list");
  var nameInput = document.getElementById("cat-new-name");
  var addBtn = document.getElementById("cat-add-btn");
  var msgEl = document.getElementById("menuadmin-cat-msg");

  if (!listEl) return;

  function showCatMsg(t, isErr) {
    if (!msgEl) return;
    msgEl.textContent = t || "";
    msgEl.className = "menuadmin-msg" + (t ? (isErr ? " menuadmin-msg--err" : " menuadmin-msg--ok") : "");
  }

  function slugId(name) {
    return window.MenuOptions ? MenuOptions.slugCategoryId(name) : name.toLowerCase().replace(/\s+/g, "-");
  }

  function refreshCategorySelect() {
    var sel = document.getElementById("m-category");
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = "";
    var cats = (window.CATEGORIES || []).slice().sort(function (a, b) {
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
    for (var i = 0; i < cats.length; i++) {
      var o = document.createElement("option");
      o.value = cats[i].id;
      o.textContent = cats[i].name;
      sel.appendChild(o);
    }
    if (cur) sel.value = cur;
  }

  function renderCategories() {
    listEl.innerHTML = "";
    var cats = (window.CATEGORIES || []).slice().sort(function (a, b) {
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
    if (!cats.length) {
      listEl.textContent = "Nenhuma categoria.";
      return;
    }
    cats.forEach(function (cat) {
      var row = document.createElement("div");
      row.className = "menuadmin-cat-row";
      var name = document.createElement("span");
      name.className = "menuadmin-cat-row__name";
      name.textContent = cat.name;
      var order = document.createElement("input");
      order.type = "number";
      order.className = "field__input menuadmin-cat-row__order";
      order.value = String(cat.sortOrder != null ? cat.sortOrder : 0);
      order.title = "Ordem";
      var actions = document.createElement("div");
      actions.className = "menuadmin-cat-row__actions";
      var btnUp = document.createElement("button");
      btnUp.type = "button";
      btnUp.className = "menuadmin-icobtn";
      btnUp.textContent = "Salvar ordem";
      btnUp.addEventListener("click", async function () {
        try {
          var updated = Object.assign({}, cat, { sortOrder: parseInt(order.value, 10) || 0 });
          if (window.ApiClient && ApiClient.isConfigured()) {
            var r = await ApiClient.patchCategory(cat.id, { sortOrder: updated.sortOrder });
            if (!r.ok) throw new Error(r.error);
            updated = r.category || updated;
          }
          for (var i = 0; i < window.CATEGORIES.length; i++) {
            if (window.CATEGORIES[i].id === cat.id) window.CATEGORIES[i] = updated;
          }
          await window.saveMenuCatalog();
          showCatMsg("Ordem atualizada.");
          renderCategories();
          refreshCategorySelect();
          if (window.MercadoApp && MercadoApp.renderMenu) MercadoApp.renderMenu();
        } catch (ex) {
          showCatMsg(ex.message || "Erro.", true);
        }
      });
      var btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "menuadmin-icobtn menuadmin-icobtn--del";
      btnDel.textContent = "Excluir";
      btnDel.addEventListener("click", async function () {
        if (!confirm('Excluir categoria "' + cat.name + '"?')) return;
        try {
          if (window.deleteCategoryFromCloud) await deleteCategoryFromCloud(cat.id);
          showCatMsg("Categoria removida.");
          renderCategories();
          refreshCategorySelect();
          if (window.MercadoApp && MercadoApp.renderMenu) MercadoApp.renderMenu();
        } catch (ex) {
          showCatMsg(ex.message || "Erro.", true);
        }
      });
      actions.appendChild(btnUp);
      actions.appendChild(btnDel);
      row.appendChild(name);
      row.appendChild(order);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
    refreshCategorySelect();
  }

  if (addBtn) {
    addBtn.addEventListener("click", async function () {
      var name = (nameInput && nameInput.value || "").trim();
      if (!name) {
        showCatMsg("Informe o nome da categoria.", true);
        return;
      }
      var cat = {
        id: slugId(name),
        name: name,
        sortOrder: (window.CATEGORIES || []).length + 1,
      };
      try {
        if (window.saveCategoryToCloud) await saveCategoryToCloud(cat);
        if (nameInput) nameInput.value = "";
        showCatMsg("Categoria adicionada.");
        renderCategories();
        if (window.MercadoApp && MercadoApp.renderMenu) MercadoApp.renderMenu();
      } catch (ex) {
        showCatMsg(ex.message || "Erro.", true);
      }
    });
  }

  window.__menuCategoriesAdmin = {
    render: renderCategories,
    refreshSelect: refreshCategorySelect,
  };

  renderCategories();
})();
