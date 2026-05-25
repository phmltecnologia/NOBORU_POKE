/**
 * Noboru Poke — pokes e temakis
 * Padrão em MENU_DEFAULT; versão ativa em window.MENU (pode vir do localStorage).
 */
(function () {
  var STORAGE_KEY = "noboru_menu_v2";

  window.RESTAURANT = {
    name: "Noboru Poke",
    siteUrl: "https://noborupoke.vercel.app",
    instagram: "https://www.instagram.com/noboru_poke/",
    whatsappUrl: "https://wa.me/5548998078186",
    whatsappE164: "5548998078186",
  };

  var DEFAULT = [
    {
      id: "1",
      name: "Poke Noboru",
      price: 45.0,
      desc: "Arroz japonês, salmão fresco, cream cheese, crispe de alho poró, tomate cereja, sunomono, cebola roxa, cebolinha e alga marinha",
      category: "Pokes",
    },
    {
      id: "2",
      name: "Poke Aloha",
      price: 45.0,
      desc: "Arroz japonês, camarão tempurá, cream cheese, crispe de couve, manga, cebolinha, lâmina de amêndoas, cenoura e alga marinha",
      category: "Pokes",
    },
    {
      id: "3",
      name: "Poke Ohana",
      price: 45.0,
      desc: "Arroz japonês, salmão fresco ou grelhado, camarão tempurá, cream cheese, chips de batata doce, cebolinha, alga marinha, cebola roxa e crispe de couve",
      category: "Pokes",
    },
    {
      id: "4",
      name: "Poke Moana",
      price: 45.0,
      desc: "Arroz japonês, salmão fresco ou grelhado, cream cheese, sunomono, crispe de couve e palmito",
      category: "Pokes",
    },
    {
      id: "5",
      name: "Poke Chicken Teriyaki",
      price: 29.9,
      desc: "Arroz japonês, frango teriyaki, sunomono, alga marinha, cream cheese, cebolinha, tomate cereja e crispe de cebola",
      category: "Pokes",
    },
    {
      id: "poke-custom",
      name: "Monte seu poke",
      price: 35.0,
      desc: "Escolha o tamanho e monte com os ingredientes que preferir",
      category: "Pokes",
      customPoke: true,
    },
    {
      id: "6",
      name: "Temaki Salmão",
      price: 29.9,
      desc: "Arroz japonês, salmão fresco, alga marinha e cebolinha",
      category: "Temakis",
    },
    {
      id: "7",
      name: "Temaki Salmão e Cebolinha",
      price: 43.9,
      desc: "Salmão fresco, alga marinha e cebolinha (sem arroz)",
      category: "Temakis",
    },
    {
      id: "8",
      name: "Temaki Filadélfia",
      price: 29.9,
      desc: "Arroz japonês, salmão fresco, cream cheese, alga marinha e cebolinha",
      category: "Temakis",
    },
    {
      id: "9",
      name: "Temaki Hot",
      price: 35.0,
      desc: "Arroz japonês, salmão e alga marinha (empanado e frito)",
      category: "Temakis",
    },
    {
      id: "10",
      name: "Mini Hot",
      price: 12.9,
      desc: "Mini temaki hot (unidade)",
      category: "Temakis",
    },
    {
      id: "11",
      name: "Água mineral 500ml",
      price: 4.0,
      desc: "Com ou sem gás",
      category: "Bebidas",
    },
    {
      id: "12",
      name: "Fanta Uva lata 350ml",
      price: 6.0,
      desc: "Refrigerante lata 350ml",
      category: "Bebidas",
    },
    {
      id: "13",
      name: "Fanta Laranja lata 350ml",
      price: 6.0,
      desc: "Refrigerante lata 350ml",
      category: "Bebidas",
    },
    {
      id: "14",
      name: "Fanta Guaraná lata 350ml",
      price: 6.0,
      desc: "Refrigerante lata 350ml",
      category: "Bebidas",
    },
    {
      id: "15",
      name: "Coca-Cola Zero lata 350ml",
      price: 6.0,
      desc: "Refrigerante lata 350ml",
      category: "Bebidas",
    },
    {
      id: "16",
      name: "Coca-Cola lata 350ml",
      price: 6.0,
      desc: "Refrigerante lata 350ml",
      category: "Bebidas",
    },
    {
      id: "17",
      name: "Coca-Cola Zero 600ml",
      price: 8.0,
      desc: "Garrafa 600ml",
      category: "Bebidas",
    },
    {
      id: "18",
      name: "Fanta Laranja 600ml",
      price: 8.0,
      desc: "Garrafa 600ml",
      category: "Bebidas",
    },
    {
      id: "19",
      name: "Chá gelado 500ml",
      price: 8.0,
      desc: "Pêssego, limão ou verde",
      category: "Bebidas",
    },
  ];

  window.POKE_BUILDER = {
    sizes: [
      {
        id: "medio",
        name: "Médio",
        weight: "350g",
        price: 35.0,
        maxExtras: 4,
        desc: "350g · base + até 4 ingredientes",
      },
      {
        id: "grande",
        name: "Grande",
        weight: "550g",
        price: 45.0,
        maxExtras: 6,
        desc: "550g · base + até 6 ingredientes",
      },
    ],
    base: ["Arroz japonês", "Alga marinha"],
    ingredients: [
      { id: "salmao-fresco", name: "Salmão fresco", price: 10, group: "proteina" },
      { id: "salmao-grelhado", name: "Salmão grelhado", price: 9, group: "proteina" },
      { id: "camarao-tempura", name: "Camarão tempurá", price: 10, group: "proteina" },
      { id: "frango-teriyaki", name: "Frango teriyaki", price: 5, group: "proteina" },
      { id: "cream-cheese", name: "Cream cheese", price: 3, group: "extra" },
      { id: "crispe-alho-poro", name: "Crispe de alho poró", price: 2, group: "extra" },
      { id: "tomate-cereja", name: "Tomate cereja", price: 2, group: "extra" },
      { id: "sunomono", name: "Sunomono", price: 2, group: "extra" },
      { id: "cebola-roxa", name: "Cebola roxa", price: 1, group: "extra" },
      { id: "cebolinha", name: "Cebolinha", price: 0, group: "extra" },
      { id: "crispe-couve", name: "Crispe de couve", price: 2, group: "extra" },
      { id: "manga", name: "Manga", price: 3, group: "extra" },
      { id: "amendoas", name: "Lâmina de amêndoas", price: 3, group: "extra" },
      { id: "cenoura", name: "Cenoura", price: 1, group: "extra" },
      { id: "batata-doce", name: "Chips de batata doce", price: 2, group: "extra" },
      { id: "palmito", name: "Palmito", price: 2, group: "extra" },
      { id: "crispe-cebola", name: "Crispe de cebola", price: 2, group: "extra" },
    ],
    maxProteins: 2,
  };

  /** Preços por tamanho nos pokes prontos (grande = preço do cardápio quando não informado). */
  window.getPremadePokePrice = function (item, sizeId) {
    if (!item) return 0;
    if (item.sizePrices && item.sizePrices[sizeId] != null) {
      return item.sizePrices[sizeId];
    }
    if (String(item.id) === "5") {
      return sizeId === "medio" ? 24.9 : 29.9;
    }
    var grande = Number(item.price) || 45;
    return sizeId === "medio" ? Math.max(grande - 7, 35) : grande;
  };

  function deepClone(a) {
    return JSON.parse(JSON.stringify(a));
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return deepClone(DEFAULT);
      var p = JSON.parse(raw);
      if (Array.isArray(p) && p.length > 0) return p;
    } catch (e) {
      // ignora
    }
    return deepClone(DEFAULT);
  }

  window.MENU_DEFAULT = deepClone(DEFAULT);
  window.MENU = load();

  window.saveMenuCatalog = function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.MENU));
    } catch (e) {
      console.error("saveMenuCatalog", e);
    }
  };

  window.resetMenuCatalog = function () {
    window.MENU = deepClone(window.MENU_DEFAULT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.MENU));
    } catch (e) {
      console.error(e);
    }
  };
})();
