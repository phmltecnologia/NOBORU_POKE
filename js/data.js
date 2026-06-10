/**
 * Noboru Poke — cardápio e categorias (Supabase ou fallback local)
 */
(function () {
  var STORAGE_KEY = "noboru_menu_v3";
  var CATEGORIES_KEY = "noboru_categories_v1";

  window.RESTAURANT = {
    name: "Noboru Poke",
    siteUrl: "https://noborupoke.vercel.app",
    instagram: "https://www.instagram.com/noboru_poke/",
    whatsappUrl: "https://wa.me/5548998078186",
    whatsappE164: "5548998078186",
  };

  var SIZE_POKE = {
    id: "tamanho",
    label: "Tamanho",
    type: "single",
    required: true,
    priceMode: "replace",
    choices: [
      { id: "medio", label: "Médio", subtitle: "350g", price: 38 },
      { id: "grande", label: "Grande", subtitle: "550g", price: 45 },
    ],
  };

  var SIZE_CHICKEN = {
    id: "tamanho",
    label: "Tamanho",
    type: "single",
    required: true,
    priceMode: "replace",
    choices: [
      { id: "medio", label: "Médio", subtitle: "350g", price: 24.9 },
      { id: "grande", label: "Grande", subtitle: "550g", price: 29.9 },
    ],
  };

  var SALMON_LAYER = {
    id: "salmao",
    label: "Salmão",
    type: "single",
    required: false,
    priceMode: "delta",
    choices: [
      { id: "fresco", label: "Fresco", priceDelta: 0 },
      { id: "grelhado", label: "Grelhado", priceDelta: 0 },
    ],
  };

  var BUILDER_LAYERS = [
    {
      id: "tamanho",
      label: "Tamanho",
      type: "single",
      required: true,
      priceMode: "base",
      choices: [
        { id: "medio", label: "Médio", subtitle: "350g", price: 35, meta: { maxChoices: 4 } },
        { id: "grande", label: "Grande", subtitle: "550g", price: 45, meta: { maxChoices: 6 } },
      ],
    },
    {
      id: "proteinas",
      label: "Proteínas",
      type: "multi",
      required: false,
      min: 0,
      max: 2,
      priceMode: "delta",
      choices: [
        { id: "salmao-fresco", label: "Salmão fresco", priceDelta: 10 },
        { id: "salmao-grelhado", label: "Salmão grelhado", priceDelta: 9 },
        { id: "camarao-tempura", label: "Camarão tempurá", priceDelta: 10 },
        { id: "frango-teriyaki", label: "Frango teriyaki", priceDelta: 5 },
      ],
    },
    {
      id: "complementos",
      label: "Complementos",
      type: "multi",
      priceMode: "delta",
      maxChoicesFromLayer: "tamanho",
      choices: [
        { id: "cream-cheese", label: "Cream cheese", priceDelta: 3 },
        { id: "crispe-alho-poro", label: "Crispe de alho poró", priceDelta: 2 },
        { id: "tomate-cereja", label: "Tomate cereja", priceDelta: 2 },
        { id: "sunomono", label: "Sunomono", priceDelta: 2 },
        { id: "cebola-roxa", label: "Cebola roxa", priceDelta: 1 },
        { id: "cebolinha", label: "Cebolinha", priceDelta: 0 },
        { id: "crispe-couve", label: "Crispe de couve", priceDelta: 2 },
        { id: "manga", label: "Manga", priceDelta: 3 },
        { id: "amendoas", label: "Lâmina de amêndoas", priceDelta: 3 },
        { id: "cenoura", label: "Cenoura", priceDelta: 1 },
        { id: "batata-doce", label: "Chips de batata doce", priceDelta: 2 },
        { id: "palmito", label: "Palmito", priceDelta: 2 },
        { id: "crispe-cebola", label: "Crispe de cebola", priceDelta: 2 },
      ],
    },
  ];

  var CATEGORIES_DEFAULT = [
    { id: "pokes", name: "Pokes", sortOrder: 1 },
    { id: "temakis", name: "Temakis", sortOrder: 2 },
    { id: "bebidas", name: "Bebidas", sortOrder: 3 },
  ];

  var DEFAULT = [
    {
      id: "1",
      name: "Poke Noboru",
      price: 45.0,
      desc: "Arroz japonês, salmão fresco, cream cheese, crispe de alho poró, tomate cereja, sunomono, cebola roxa, cebolinha e alga marinha",
      categoryId: "pokes",
      categoryName: "Pokes",
      category: "Pokes",
      optionLayers: [SIZE_POKE],
    },
    {
      id: "2",
      name: "Poke Aloha",
      price: 45.0,
      desc: "Arroz japonês, camarão tempurá, cream cheese, crispe de couve, manga, cebolinha, lâmina de amêndoas, cenoura e alga marinha",
      categoryId: "pokes",
      categoryName: "Pokes",
      category: "Pokes",
      optionLayers: [SIZE_POKE],
    },
    {
      id: "3",
      name: "Poke Ohana",
      price: 45.0,
      desc: "Arroz japonês, salmão fresco ou grelhado, camarão tempurá, cream cheese, chips de batata doce, cebolinha, alga marinha, cebola roxa e crispe de couve",
      categoryId: "pokes",
      categoryName: "Pokes",
      category: "Pokes",
      optionLayers: [SIZE_POKE, SALMON_LAYER],
    },
    {
      id: "4",
      name: "Poke Moana",
      price: 45.0,
      desc: "Arroz japonês, salmão fresco ou grelhado, cream cheese, sunomono, crispe de couve e palmito",
      categoryId: "pokes",
      categoryName: "Pokes",
      category: "Pokes",
      optionLayers: [SIZE_POKE, SALMON_LAYER],
    },
    {
      id: "5",
      name: "Poke Chicken Teriyaki",
      price: 29.9,
      desc: "Arroz japonês, frango teriyaki, sunomono, alga marinha, cream cheese, cebolinha, tomate cereja e crispe de cebola",
      categoryId: "pokes",
      categoryName: "Pokes",
      category: "Pokes",
      optionLayers: [SIZE_CHICKEN],
    },
    {
      id: "poke-custom",
      name: "Monte seu poke",
      price: 35.0,
      desc: "Escolha o tamanho e monte com os ingredientes que preferir",
      categoryId: "pokes",
      categoryName: "Pokes",
      category: "Pokes",
      optionLayers: BUILDER_LAYERS,
    },
    { id: "6", name: "Temaki Salmão", price: 29.9, desc: "Arroz japonês, salmão fresco, alga marinha e cebolinha", categoryId: "temakis", categoryName: "Temakis", category: "Temakis", optionLayers: [] },
    { id: "7", name: "Temaki Salmão e Cebolinha", price: 43.9, desc: "Salmão fresco, alga marinha e cebolinha (sem arroz)", categoryId: "temakis", categoryName: "Temakis", category: "Temakis", optionLayers: [] },
    { id: "8", name: "Temaki Filadélfia", price: 29.9, desc: "Arroz japonês, salmão fresco, cream cheese, alga marinha e cebolinha", categoryId: "temakis", categoryName: "Temakis", category: "Temakis", optionLayers: [] },
    { id: "9", name: "Temaki Hot", price: 35.0, desc: "Arroz japonês, salmão e alga marinha (empanado e frito)", categoryId: "temakis", categoryName: "Temakis", category: "Temakis", optionLayers: [] },
    { id: "10", name: "Mini Hot", price: 12.9, desc: "Mini temaki hot (unidade)", categoryId: "temakis", categoryName: "Temakis", category: "Temakis", optionLayers: [] },
    { id: "11", name: "Água mineral 500ml", price: 4.0, desc: "Com ou sem gás", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
    { id: "12", name: "Fanta Uva lata 350ml", price: 6.0, desc: "Refrigerante lata 350ml", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
    { id: "13", name: "Fanta Laranja lata 350ml", price: 6.0, desc: "Refrigerante lata 350ml", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
    { id: "14", name: "Fanta Guaraná lata 350ml", price: 6.0, desc: "Refrigerante lata 350ml", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
    { id: "15", name: "Coca-Cola Zero lata 350ml", price: 6.0, desc: "Refrigerante lata 350ml", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
    { id: "16", name: "Coca-Cola lata 350ml", price: 6.0, desc: "Refrigerante lata 350ml", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
    { id: "17", name: "Coca-Cola Zero 600ml", price: 8.0, desc: "Garrafa 600ml", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
    { id: "18", name: "Fanta Laranja 600ml", price: 8.0, desc: "Garrafa 600ml", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
    { id: "19", name: "Chá gelado 500ml", price: 8.0, desc: "Pêssego, limão ou verde", categoryId: "bebidas", categoryName: "Bebidas", category: "Bebidas", optionLayers: [] },
  ];

  function deepClone(a) {
    return JSON.parse(JSON.stringify(a));
  }

  function loadLocalMenu() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return deepClone(DEFAULT);
      var p = JSON.parse(raw);
      if (Array.isArray(p) && p.length > 0) return p;
    } catch (e) {
      /* ignore */
    }
    return deepClone(DEFAULT);
  }

  function loadLocalCategories() {
    try {
      var raw = localStorage.getItem(CATEGORIES_KEY);
      if (!raw) return deepClone(CATEGORIES_DEFAULT);
      var p = JSON.parse(raw);
      if (Array.isArray(p) && p.length > 0) return p;
    } catch (e) {
      /* ignore */
    }
    return deepClone(CATEGORIES_DEFAULT);
  }

  window.CATEGORIES_DEFAULT = deepClone(CATEGORIES_DEFAULT);
  window.CATEGORIES = deepClone(CATEGORIES_DEFAULT);
  window.MENU_DEFAULT = deepClone(DEFAULT);
  window.MENU = deepClone(DEFAULT);

  window.menuLoadPromise = (async function loadMenuFromApi() {
    if (window.ApiClient && ApiClient.isConfigured()) {
      try {
        var catRes = await ApiClient.fetchCategories();
        if (catRes.ok && catRes.categories && catRes.categories.length) {
          window.CATEGORIES = catRes.categories;
        }
        var r = await ApiClient.fetchMenu();
        if (r.ok && r.items && r.items.length) {
          window.MENU = r.items;
          return;
        }
      } catch (e) {
        console.warn("Falha ao carregar cardápio da nuvem, usando padrão local.", e);
      }
    }
    window.CATEGORIES = loadLocalCategories();
    window.MENU = loadLocalMenu();
  })();

  window.whenMenuReady = function (fn) {
    return window.menuLoadPromise.then(fn);
  };

  window.saveMenuCatalog = function () {
    if (window.ApiClient && ApiClient.isConfigured()) {
      return Promise.resolve();
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.MENU));
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(window.CATEGORIES));
    } catch (e) {
      console.error("saveMenuCatalog", e);
    }
    return Promise.resolve();
  };

  window.saveCategoryToCloud = async function (cat) {
    if (window.ApiClient && ApiClient.isConfigured()) {
      var r = await ApiClient.upsertCategory(cat);
      if (!r.ok) throw new Error(r.error || "Erro ao salvar categoria.");
      cat = r.category || cat;
    }
    var found = false;
    for (var i = 0; i < window.CATEGORIES.length; i++) {
      if (window.CATEGORIES[i].id === cat.id) {
        window.CATEGORIES[i] = cat;
        found = true;
        break;
      }
    }
    if (!found) window.CATEGORIES.push(cat);
    if (!window.ApiClient || !ApiClient.isConfigured()) await window.saveMenuCatalog();
    return cat;
  };

  window.deleteCategoryFromCloud = async function (id) {
    if (window.ApiClient && ApiClient.isConfigured()) {
      var r = await ApiClient.deleteCategory(id);
      if (!r.ok) throw new Error(r.error || "Erro ao remover categoria.");
    }
    window.CATEGORIES = window.CATEGORIES.filter(function (c) {
      return c.id !== id;
    });
    if (!window.ApiClient || !ApiClient.isConfigured()) await window.saveMenuCatalog();
  };

  window.saveMenuItemToCloud = async function (item) {
    if (window.ApiClient && ApiClient.isConfigured()) {
      var image = item.image || "";
      if (image.indexOf("data:image/") === 0) {
        var up = await ApiClient.uploadMenuImage(item.id, image);
        if (up.ok && up.url) {
          item = Object.assign({}, item, { image: up.url });
        }
      }
      var r = await ApiClient.upsertMenuItem(item);
      if (!r.ok) throw new Error(r.error || "Erro ao salvar item.");
      return r.item || item;
    }
    window.saveMenuCatalog();
    return item;
  };

  window.deleteMenuItemFromCloud = async function (id) {
    if (window.ApiClient && ApiClient.isConfigured()) {
      var r = await ApiClient.deleteMenuItem(id);
      if (!r.ok) throw new Error(r.error || "Erro ao remover item.");
      return;
    }
    window.saveMenuCatalog();
  };

  window.resetMenuCatalog = function () {
    window.MENU = deepClone(window.MENU_DEFAULT);
    window.CATEGORIES = deepClone(window.CATEGORIES_DEFAULT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.MENU));
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(window.CATEGORIES));
    } catch (e) {
      console.error(e);
    }
  };
})();
