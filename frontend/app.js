(function () {
  const DEFAULT_API_BASE = "http://localhost:3056/v1/api";
  const STORAGE_KEY = "quyencommerce.frontend.v1";
  const DEVICE_KEY = "quyencommerce.device.id";

  const fallbackImages = [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1585386959984-a41552231658?auto=format&fit=crop&w=900&q=80"
  ];

  const sampleProducts = [
    {
      id: "sample-camera-kit",
      name: "Mirrorless creator kit",
      intro: "Compact camera kit with prime lens and travel case.",
      images: [fallbackImages[4]],
      shopBusinessId: "sample-shop-media",
      brand: { name: "Lumio" },
      category: { name: "Cameras" },
      skus: [{ id: "sample-camera-kit-sku", name: "Black kit", price: 89900, stock: 18, image: fallbackImages[4] }],
      isSample: true
    },
    {
      id: "sample-headphones",
      name: "Noise cancelling headphones",
      intro: "Wireless over-ear headphones with soft touch controls.",
      images: [fallbackImages[1]],
      shopBusinessId: "sample-shop-audio",
      brand: { name: "Aural" },
      category: { name: "Audio" },
      skus: [{ id: "sample-headphones-sku", name: "Graphite", price: 24900, stock: 42, image: fallbackImages[1] }],
      isSample: true
    },
    {
      id: "sample-phone",
      name: "Edge display smartphone",
      intro: "Fast 5G phone with a vivid display and all-day battery.",
      images: [fallbackImages[0]],
      shopBusinessId: "sample-shop-mobile",
      brand: { name: "Nexa" },
      category: { name: "Phones" },
      skus: [{ id: "sample-phone-sku", name: "256 GB", price: 69900, stock: 31, image: fallbackImages[0] }],
      isSample: true
    },
    {
      id: "sample-watch",
      name: "Minimal steel watch",
      intro: "Water resistant watch with a sapphire crystal face.",
      images: [fallbackImages[2]],
      shopBusinessId: "sample-shop-style",
      brand: { name: "Northline" },
      category: { name: "Accessories" },
      skus: [{ id: "sample-watch-sku", name: "Silver", price: 17900, stock: 12, image: fallbackImages[2] }],
      isSample: true
    },
    {
      id: "sample-sneaker",
      name: "Runner knit sneaker",
      intro: "Lightweight knit upper with a cushioned sole.",
      images: [fallbackImages[3]],
      shopBusinessId: "sample-shop-sport",
      brand: { name: "Stride" },
      category: { name: "Footwear" },
      skus: [{ id: "sample-sneaker-sku", name: "White 42", price: 12900, stock: 26, image: fallbackImages[3] }],
      isSample: true
    },
    {
      id: "sample-fragrance",
      name: "Citrus cedar fragrance",
      intro: "Fresh citrus top notes with a cedar base.",
      images: [fallbackImages[5]],
      shopBusinessId: "sample-shop-beauty",
      brand: { name: "Miro" },
      category: { name: "Beauty" },
      skus: [{ id: "sample-fragrance-sku", name: "50 ml", price: 8900, stock: 54, image: fallbackImages[5] }],
      isSample: true
    }
  ];

  const state = {
    apiBase: DEFAULT_API_BASE,
    products: [],
    searchResults: null,
    cart: [],
    session: null,
    selectedProduct: null,
    selectedSkuIndex: 0,
    source: "initial",
    filters: {
      query: "",
      category: "all",
      sort: "newest",
      publishedOnly: true
    },
    status: {
      kind: "idle",
      message: "Idle"
    },
    auth: {
      role: "user",
      mode: "login"
    }
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindElements();
    restoreState();
    bindEvents();
    renderAll();
    loadProducts();
  }

  function bindElements() {
    [
      "apiForm",
      "apiBaseInput",
      "apiStatus",
      "reloadButton",
      "searchForm",
      "searchInput",
      "categorySelect",
      "sortSelect",
      "publishedOnly",
      "resultMeta",
      "productGrid",
      "miniCart",
      "cartView",
      "cartCount",
      "cartButton",
      "authButton",
      "authDialog",
      "authForm",
      "authFields",
      "authTitle",
      "authOutput",
      "productDialog",
      "productDetail",
      "sessionSummary",
      "syncCartButton",
      "clearCartButton",
      "productForm",
      "brandForm",
      "sellerOutput",
      "toast"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    document.querySelectorAll("[data-view-link]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        setView(link.dataset.viewLink);
      });
    });

    els.apiForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = els.apiBaseInput.value.trim().replace(/\/+$/, "");
      state.apiBase = value || DEFAULT_API_BASE;
      persistState();
      setStatus("Saved " + state.apiBase, "online");
      loadProducts();
    });

    els.reloadButton.addEventListener("click", () => loadProducts());

    els.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.filters.query = els.searchInput.value.trim();
      searchProducts();
    });

    els.categorySelect.addEventListener("change", () => {
      state.filters.category = els.categorySelect.value;
      renderCatalog();
    });

    els.sortSelect.addEventListener("change", () => {
      state.filters.sort = els.sortSelect.value;
      renderCatalog();
    });

    els.publishedOnly.addEventListener("change", () => {
      state.filters.publishedOnly = els.publishedOnly.checked;
      loadProducts();
    });

    els.productGrid.addEventListener("click", handleProductGridClick);
    els.productDetail.addEventListener("click", handleProductDialogClick);
    els.cartView.addEventListener("click", handleCartClick);
    els.cartView.addEventListener("change", handleCartChange);
    els.miniCart.addEventListener("click", handleMiniCartClick);

    els.cartButton.addEventListener("click", () => setView("checkout"));
    els.syncCartButton.addEventListener("click", () => syncCartFromBackend());
    els.clearCartButton.addEventListener("click", clearCart);

    els.authButton.addEventListener("click", () => {
      if (state.session) {
        logout();
        return;
      }
      renderAuthFields();
      openDialog(els.authDialog);
    });

    els.authForm.addEventListener("click", handleAuthToggle);
    els.authForm.addEventListener("submit", handleAuthSubmit);
    els.productForm.addEventListener("submit", handleProductSubmit);
    els.brandForm.addEventListener("submit", handleBrandSubmit);

    document.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-close-dialog]");
      if (closeButton) {
        closeButton.closest("dialog")?.close();
      }
    });
  }

  function restoreState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      state.apiBase = stored.apiBase || DEFAULT_API_BASE;
      state.cart = Array.isArray(stored.cart) ? stored.cart : [];
      state.session = stored.session || null;
    } catch (error) {
      state.apiBase = DEFAULT_API_BASE;
      state.cart = [];
      state.session = null;
    }

    els.apiBaseInput.value = state.apiBase;
  }

  function persistState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        apiBase: state.apiBase,
        cart: state.cart,
        session: state.session
      })
    );
  }

  async function apiFetch(path, options = {}) {
    const url = state.apiBase + path;
    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined;

    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const token = options.token || state.session?.accessToken;
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", "Bearer " + token);
    }

    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      const message = payload?.message || payload?.error || response.statusText || "Request failed";
      throw new Error(Array.isArray(message) ? message.join(", ") : message);
    }

    return unwrapResponse(payload);
  }

  function unwrapResponse(payload) {
    if (!payload || typeof payload !== "object") {
      return payload;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "metadata")) {
      return payload.metadata;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "data")) {
      return payload.data;
    }
    return payload;
  }

  async function loadProducts() {
    setStatus("Loading products", "idle");
    state.searchResults = null;
    renderCatalog(true);

    const publishedParam = state.filters.publishedOnly ? "&isPublished=true" : "";
    try {
      const data = await apiFetch("/product/all?take=36&skip=0" + publishedParam);
      const rows = Array.isArray(data) ? data : data?.items || [];
      const normalized = rows.map(normalizeProduct).filter(Boolean);

      if (normalized.length === 0) {
        state.products = sampleProducts.map(normalizeProduct);
        state.source = "sample";
        setStatus("API online, no products returned", "online");
      } else {
        state.products = normalized;
        state.source = "api";
        setStatus("Connected to " + state.apiBase, "online");
      }
    } catch (error) {
      state.products = sampleProducts.map(normalizeProduct);
      state.source = "sample";
      setStatus("Using sample products: " + error.message, "offline");
    }

    renderAll();
  }

  async function searchProducts() {
    if (!state.filters.query) {
      state.searchResults = null;
      renderCatalog();
      return;
    }

    setStatus("Searching " + state.filters.query, "idle");
    try {
      const data = await apiFetch("/product/search/" + encodeURIComponent(state.filters.query));
      const rows = Array.isArray(data) ? data : data?.results || [];
      const normalized = rows.map(normalizeProduct).filter(Boolean);
      state.searchResults = normalized.length ? normalized : null;
      setStatus(normalized.length ? "Search loaded from API" : "No API search matches", "online");
    } catch (error) {
      state.searchResults = null;
      setStatus("Local search: " + error.message, "offline");
    }

    renderCatalog();
  }

  function normalizeProduct(product, index = 0) {
    if (!product || typeof product !== "object") {
      return null;
    }

    const rawSkus = Array.isArray(product.skus)
      ? product.skus
      : product.sku
        ? [product.sku]
        : [];

    const firstSku = rawSkus[0] || {};
    const id = String(product.id || product.productId || firstSku.spuId || "product-" + index);
    const name = product.name || product.productName || firstSku.name || "Untitled product";
    const brandName = product.brand?.name || product.brandName || firstSku.brandName || "Marketplace";
    const categoryName = product.category?.name || product.category || "General";
    const shopId = product.shopBusinessId || product.shopId || firstSku.shopId || "unknown-shop";
    const images = collectImages(product, firstSku, index);
    const price = toNumber(firstSku.price ?? product.price ?? product.productPrice ?? 0);

    const skus = rawSkus.length
      ? rawSkus.map((sku, skuIndex) => normalizeSku(sku, { product, index, skuIndex, images, price, name }))
      : [
          {
            id: String(product.skuId || product.productId || id),
            name,
            price,
            stock: toNumber(product.stock ?? 0),
            image: images[0],
            images,
            attributes: product.attributes || ""
          }
        ];

    return {
      id,
      name,
      intro: product.intro || product.description || stripHtml(product.content || ""),
      content: product.content || "",
      images,
      brandName,
      categoryName,
      shopId,
      createdAt: toNumber(product.createdAt || 0),
      isMarketable: Boolean(product.isMarketable ?? true),
      skus,
      comments: Array.isArray(product.comment) ? product.comment : [],
      raw: product,
      isSample: Boolean(product.isSample)
    };
  }

  function normalizeSku(sku, context) {
    const image = sku.image || firstString(sku.images) || context.images[0] || fallbackImages[context.index % fallbackImages.length];
    const price = toNumber(sku.price ?? context.price);
    return {
      id: String(sku.id || context.product.productId || context.product.id || "sku-" + context.index + "-" + context.skuIndex),
      name: sku.name || context.name,
      price,
      stock: toNumber(sku.stock ?? sku.inventory?.inventoryStock ?? 0),
      image,
      images: collectImageArray([sku.images, sku.image, context.images]),
      attributes: sku.attributes || "",
      status: sku.status
    };
  }

  function collectImages(product, firstSku, index) {
    const images = collectImageArray([
      product.images,
      product.image,
      product.productThumb,
      firstSku.images,
      firstSku.image
    ]);
    return images.length ? images : [fallbackImages[index % fallbackImages.length]];
  }

  function collectImageArray(groups) {
    return groups
      .flatMap((group) => (Array.isArray(group) ? group : group ? [group] : []))
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => value.trim());
  }

  function firstString(values) {
    return Array.isArray(values) ? values.find((value) => typeof value === "string" && value.trim()) : values;
  }

  function renderAll() {
    renderControls();
    renderSession();
    renderCatalog();
    renderCart();
  }

  function renderControls() {
    els.apiBaseInput.value = state.apiBase;
    els.searchInput.value = state.filters.query;
    els.sortSelect.value = state.filters.sort;
    els.publishedOnly.checked = state.filters.publishedOnly;
    renderCategorySelect();
    renderStatus();
  }

  function renderStatus() {
    els.apiStatus.textContent = state.status.message;
    els.apiStatus.classList.toggle("is-online", state.status.kind === "online");
    els.apiStatus.classList.toggle("is-offline", state.status.kind === "offline");
  }

  function renderCategorySelect() {
    const categories = Array.from(new Set(state.products.map((product) => product.categoryName))).sort();
    const options = ['<option value="all">All categories</option>']
      .concat(categories.map((category) => `<option value="${escapeAttr(category)}">${escapeHtml(category)}</option>`));
    els.categorySelect.innerHTML = options.join("");
    if (!categories.includes(state.filters.category)) {
      state.filters.category = "all";
    }
    els.categorySelect.value = state.filters.category;
  }

  function renderSession() {
    if (!state.session) {
      els.authButton.textContent = "Sign in";
      els.sessionSummary.innerHTML = "<span>Not signed in</span>";
      return;
    }

    els.authButton.textContent = "Sign out";
    const role = escapeHtml(state.session.role || "ACCOUNT");
    const id = escapeHtml(state.session.accountId || "unknown");
    const email = escapeHtml(state.session.email || "");
    els.sessionSummary.innerHTML = `
      <strong>${role}</strong>
      <span>${email || "Token session"}</span>
      <span>${id}</span>
    `;
  }

  function renderCatalog(isLoading = false) {
    if (isLoading) {
      els.productGrid.innerHTML = '<div class="loading-state">Loading products</div>';
      els.resultMeta.textContent = "";
      return;
    }

    renderCategorySelect();
    const products = getVisibleProducts();
    els.resultMeta.textContent = products.length + " products" + (state.source === "sample" ? " from sample data" : "");

    if (!products.length) {
      els.productGrid.innerHTML = '<div class="empty-state">No matching products</div>';
      return;
    }

    els.productGrid.innerHTML = products.map(renderProductCard).join("");
  }

  function renderProductCard(product) {
    const sku = product.skus[0] || {};
    const image = sku.image || product.images[0] || fallbackImages[0];
    const stockText = sku.stock > 0 ? sku.stock + " in stock" : "Stock pending";

    return `
      <article class="product-card">
        <div class="product-image">
          <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" loading="lazy" onerror="this.src='${fallbackImages[0]}'">
          <span class="stock-badge">${escapeHtml(stockText)}</span>
        </div>
        <div class="product-body">
          <h3 class="product-title">
            <button type="button" data-open-product="${escapeAttr(product.id)}">${escapeHtml(product.name)}</button>
          </h3>
          <div class="product-meta">
            <span class="tag">${escapeHtml(product.brandName)}</span>
            <span class="tag">${escapeHtml(product.categoryName)}</span>
          </div>
          <div class="product-price-line">
            <span class="price">${formatMoney(sku.price)}</span>
            <button class="solid-button" type="button" data-add-product="${escapeAttr(product.id)}">Add</button>
          </div>
        </div>
      </article>
    `;
  }

  function getVisibleProducts() {
    const query = state.filters.query.toLowerCase();
    const base = state.searchResults || state.products;
    const filtered = base.filter((product) => {
      const matchesCategory = state.filters.category === "all" || product.categoryName === state.filters.category;
      const haystack = [product.name, product.intro, product.brandName, product.categoryName].join(" ").toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesCategory && matchesQuery;
    });

    return filtered.sort((a, b) => {
      const aPrice = a.skus[0]?.price || 0;
      const bPrice = b.skus[0]?.price || 0;
      if (state.filters.sort === "priceAsc") return aPrice - bPrice;
      if (state.filters.sort === "priceDesc") return bPrice - aPrice;
      if (state.filters.sort === "nameAsc") return a.name.localeCompare(b.name);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  async function handleProductGridClick(event) {
    const openButton = event.target.closest("[data-open-product]");
    if (openButton) {
      openProduct(openButton.dataset.openProduct);
      return;
    }

    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
      await addProductById(addButton.dataset.addProduct);
    }
  }

  async function addProductById(productId) {
    const product = findProduct(productId);
    if (!product) return;

    let cartProduct = product;
    const firstSku = product.skus[0];
    const needsSkuDetail = !product.isSample && (!firstSku?.id || firstSku.id === product.id);

    if (needsSkuDetail) {
      try {
        cartProduct = await fetchProductDetail(productId);
      } catch (error) {
        setStatus("Added locally: " + error.message, "offline");
      }
    }

    addProductToCart(cartProduct, 1);
  }

  async function openProduct(productId) {
    const localProduct = findProduct(productId);
    if (!localProduct) return;

    state.selectedProduct = localProduct;
    state.selectedSkuIndex = 0;
    renderProductDialog();
    openDialog(els.productDialog);

    if (localProduct.isSample) return;

    try {
      const detail = await fetchProductDetail(productId);
      state.selectedProduct = detail;
      state.selectedSkuIndex = 0;
      renderProductDialog();
    } catch (error) {
      showToast("Product detail unavailable: " + error.message);
    }
  }

  async function fetchProductDetail(productId) {
    const data = await apiFetch("/product/productById/" + encodeURIComponent(productId));
    const detail = normalizeProduct(data);
    replaceProduct(detail);
    return detail;
  }

  function replaceProduct(product) {
    const replaceIn = (list) => {
      const index = list.findIndex((item) => item.id === product.id);
      if (index >= 0) {
        list.splice(index, 1, product);
      }
    };
    replaceIn(state.products);
    if (state.searchResults) replaceIn(state.searchResults);
  }

  function findProduct(productId) {
    return [...state.products, ...(state.searchResults || [])].find((product) => product.id === productId);
  }

  function renderProductDialog() {
    const product = state.selectedProduct;
    if (!product) return;

    const sku = product.skus[state.selectedSkuIndex] || product.skus[0] || {};
    const images = collectImageArray([sku.images, sku.image, product.images]);
    const mainImage = images[0] || fallbackImages[0];
    const thumbs = images.slice(0, 4);
    const stockText = sku.stock > 0 ? sku.stock + " available" : "Stock pending";
    const attributes = sku.attributes ? `<p>${escapeHtml(sku.attributes)}</p>` : "";

    els.productDetail.innerHTML = `
      <div class="modal-head">
        <div>
          <p class="eyebrow">${escapeHtml(product.brandName)} / ${escapeHtml(product.categoryName)}</p>
          <h2>${escapeHtml(product.name)}</h2>
        </div>
        <button class="icon-button" type="button" data-close-dialog aria-label="Close">x</button>
      </div>
      <div class="product-detail-grid">
        <div class="detail-media">
          <div class="detail-media-main">
            <img src="${escapeAttr(mainImage)}" alt="${escapeAttr(product.name)}" onerror="this.src='${fallbackImages[0]}'">
          </div>
          <div class="detail-thumbs">
            ${thumbs.map((image) => `<img src="${escapeAttr(image)}" alt="" onerror="this.src='${fallbackImages[0]}'">`).join("")}
          </div>
        </div>
        <div class="detail-copy">
          <div class="product-meta">
            <span class="tag">${escapeHtml(stockText)}</span>
            <span class="tag">Shop ${escapeHtml(product.shopId)}</span>
          </div>
          <div class="price">${formatMoney(sku.price)}</div>
          <p>${escapeHtml(product.intro || stripHtml(product.content) || "No description available.")}</p>
          ${attributes}
          <div class="sku-list">
            ${product.skus.map((item, index) => `
              <button class="sku-button ${index === state.selectedSkuIndex ? "is-active" : ""}" type="button" data-sku-index="${index}">
                ${escapeHtml(item.name || "SKU " + (index + 1))}
              </button>
            `).join("")}
          </div>
          <div class="inline-actions">
            <button class="solid-button" type="button" data-add-detail>Add to cart</button>
            <button class="ghost-button" type="button" data-close-dialog>Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function handleProductDialogClick(event) {
    const skuButton = event.target.closest("[data-sku-index]");
    if (skuButton) {
      state.selectedSkuIndex = Number(skuButton.dataset.skuIndex) || 0;
      renderProductDialog();
      return;
    }

    const addButton = event.target.closest("[data-add-detail]");
    if (addButton && state.selectedProduct) {
      addProductToCart(state.selectedProduct, 1);
    }
  }

  function addProductToCart(product, quantity) {
    const sku = product.skus[state.selectedProduct?.id === product.id ? state.selectedSkuIndex : 0] || product.skus[0] || {};
    const lineId = sku.id || product.id;
    const existing = state.cart.find((line) => line.productId === lineId && line.shopId === product.shopId);
    const line = {
      id: lineId + "::" + product.shopId,
      productId: lineId,
      spuId: product.id,
      shopId: product.shopId,
      name: sku.name || product.name,
      price: toNumber(sku.price),
      quantity: quantity,
      image: sku.image || product.images[0] || fallbackImages[0],
      cartId: existing?.cartId || null,
      isSample: product.isSample
    };

    if (existing) {
      existing.quantity += quantity;
    } else {
      state.cart.push(line);
    }

    persistState();
    renderCart();
    showToast("Added to cart");

    if (state.session?.role === "USER" && !line.isSample) {
      syncCartLine(existing || line);
    }
  }

  async function syncCartLine(line) {
    if (!state.session?.accountId) return;
    try {
      const data = await apiFetch("/cart", {
        method: "POST",
        body: {
          userId: state.session.accountId,
          product: {
            productId: line.productId,
            shopId: line.shopId,
            quantity: line.quantity,
            name: line.name,
            price: line.price
          }
        }
      });

      if (data?.cartId) {
        line.cartId = data.cartId;
        persistState();
        renderCart();
      }
      setStatus("Cart synced", "online");
    } catch (error) {
      setStatus("Local cart: " + error.message, "offline");
    }
  }

  async function syncCartFromBackend() {
    if (!state.session?.accountId || state.session.role !== "USER") {
      showToast("User session required");
      return;
    }

    try {
      const data = await apiFetch("/cart?userId=" + encodeURIComponent(state.session.accountId));
      const rows = Array.isArray(data) ? data : [];
      state.cart = rows.map((row, index) => {
        const local = state.cart.find((line) => line.productId === row.productId);
        return {
          id: String(row.productId || "cart-" + index) + "::" + String(row.shopId || "shop"),
          productId: String(row.productId || ""),
          spuId: String(row.productId || ""),
          shopId: String(row.shopId || ""),
          name: row.name || local?.name || "Cart item",
          price: toNumber(row.price),
          quantity: toNumber(row.quantity || 1),
          image: local?.image || fallbackImages[index % fallbackImages.length],
          cartId: row.cartId || local?.cartId || null,
          isSample: false
        };
      });
      persistState();
      renderCart();
      setStatus("Cart loaded from API", "online");
    } catch (error) {
      setStatus("Cart sync failed: " + error.message, "offline");
    }
  }

  function renderCart() {
    const count = state.cart.reduce((sum, line) => sum + line.quantity, 0);
    els.cartCount.textContent = String(count);
    renderMiniCart();
    renderCheckoutView();
  }

  function renderMiniCart() {
    if (!state.cart.length) {
      els.miniCart.innerHTML = '<div class="empty-state">Cart is empty</div>';
      return;
    }

    const rows = state.cart.slice(0, 4).map((line) => `
      <div class="mini-cart-item">
        <img src="${escapeAttr(line.image)}" alt="" onerror="this.src='${fallbackImages[0]}'">
        <div>
          <p class="mini-cart-name">${escapeHtml(line.name)}</p>
          <div class="cart-row-meta">
            <span>${line.quantity} x ${formatMoney(line.price)}</span>
          </div>
        </div>
      </div>
    `);

    els.miniCart.innerHTML = `
      <div class="mini-cart-list">${rows.join("")}</div>
      <div class="cart-total">
        <div class="total-line"><span>Subtotal</span><strong>${formatMoney(cartSubtotal())}</strong></div>
        <button class="solid-button" type="button" data-view-cart>Checkout</button>
      </div>
    `;
  }

  function renderCheckoutView() {
    if (!state.cart.length) {
      els.cartView.innerHTML = '<div class="empty-state">Cart is empty</div>';
      return;
    }

    const rows = state.cart.map((line) => `
      <div class="cart-row" data-line-id="${escapeAttr(line.id)}">
        <img src="${escapeAttr(line.image)}" alt="" onerror="this.src='${fallbackImages[0]}'">
        <div>
          <p class="cart-row-name">${escapeHtml(line.name)}</p>
          <div class="cart-row-meta">
            <span class="tag">${escapeHtml(line.shopId)}</span>
            <span>${formatMoney(line.price)}</span>
            ${line.cartId ? `<span>Cart ${escapeHtml(line.cartId)}</span>` : ""}
          </div>
        </div>
        <div class="cart-row-actions">
          <div class="quantity-control">
            <button type="button" data-quantity-step="-1" aria-label="Decrease quantity">-</button>
            <input type="number" min="0" step="1" value="${line.quantity}" data-quantity-input>
            <button type="button" data-quantity-step="1" aria-label="Increase quantity">+</button>
          </div>
          <button class="danger-button" type="button" data-remove-line>Remove</button>
        </div>
      </div>
    `);

    els.cartView.innerHTML = `
      <div class="cart-table">${rows.join("")}</div>
      <div class="order-panel">
        <div class="rail-title">Order</div>
        <div class="total-line"><span>Items</span><strong>${state.cart.reduce((sum, line) => sum + line.quantity, 0)}</strong></div>
        <div class="total-line"><span>Subtotal</span><strong>${formatMoney(cartSubtotal())}</strong></div>
        <div class="total-line"><span>Cart ID</span><strong>${escapeHtml(currentCartId() || "None")}</strong></div>
        <button class="ghost-button" type="button" data-checkout-review>Review</button>
        <button class="solid-button" type="button" data-checkout-create>Create order</button>
        <pre id="checkoutOutput" class="result-output"></pre>
      </div>
    `;
  }

  function handleMiniCartClick(event) {
    if (event.target.closest("[data-view-cart]")) {
      setView("checkout");
    }
  }

  function handleCartClick(event) {
    const row = event.target.closest("[data-line-id]");
    if (!row) {
      if (event.target.closest("[data-checkout-review]")) runCheckout("review");
      if (event.target.closest("[data-checkout-create]")) runCheckout("create_order");
      return;
    }

    const line = state.cart.find((item) => item.id === row.dataset.lineId);
    if (!line) return;

    const stepButton = event.target.closest("[data-quantity-step]");
    if (stepButton) {
      const nextQuantity = Math.max(0, line.quantity + Number(stepButton.dataset.quantityStep));
      updateCartQuantity(line.id, nextQuantity);
      return;
    }

    if (event.target.closest("[data-remove-line]")) {
      updateCartQuantity(line.id, 0);
    }
  }

  function handleCartChange(event) {
    const input = event.target.closest("[data-quantity-input]");
    if (!input) return;
    const row = input.closest("[data-line-id]");
    updateCartQuantity(row.dataset.lineId, Math.max(0, Number(input.value) || 0));
  }

  function updateCartQuantity(lineId, nextQuantity) {
    const line = state.cart.find((item) => item.id === lineId);
    if (!line) return;

    const oldQuantity = line.quantity;
    if (nextQuantity <= 0) {
      state.cart = state.cart.filter((item) => item.id !== lineId);
    } else {
      line.quantity = nextQuantity;
    }

    persistState();
    renderCart();

    if (state.session?.role === "USER" && !line.isSample) {
      syncCartQuantity(line, oldQuantity, nextQuantity);
    }
  }

  async function syncCartQuantity(line, oldQuantity, nextQuantity) {
    if (!state.session?.accountId) return;
    try {
      await apiFetch("/cart/update", {
        method: "POST",
        body: {
          userId: state.session.accountId,
          shopOrderIds: [
            {
              shopId: line.shopId,
              version: 1,
              itemProducts: [
                {
                  quantity: nextQuantity,
                  oldQuantity,
                  price: line.price,
                  shopId: line.shopId,
                  productId: line.productId,
                  name: line.name
                }
              ]
            }
          ]
        }
      });
      setStatus("Cart quantity synced", "online");
    } catch (error) {
      setStatus("Quantity saved locally: " + error.message, "offline");
    }
  }

  function clearCart() {
    state.cart = [];
    persistState();
    renderCart();
  }

  async function runCheckout(action) {
    const output = document.getElementById("checkoutOutput");
    if (!state.session?.accountId || state.session.role !== "USER") {
      output.textContent = "User session required.";
      return;
    }
    if (!state.cart.length) {
      output.textContent = "Cart is empty.";
      return;
    }

    const cartId = currentCartId();
    if (!cartId) {
      output.textContent = "Sync the cart before checkout.";
      return;
    }

    const path = action === "review" ? "/checkout/review" : "/checkout/create_order";
    const payload = {
      cartId,
      userId: state.session.accountId,
      shopOrderIds: buildShopOrderIds()
    };

    output.textContent = "Submitting...";
    try {
      const data = await apiFetch(path, { method: "POST", body: payload });
      output.textContent = JSON.stringify(data, null, 2);
      setStatus("Checkout response received", "online");
    } catch (error) {
      output.textContent = error.message;
      setStatus("Checkout failed: " + error.message, "offline");
    }
  }

  function buildShopOrderIds() {
    const groups = new Map();
    state.cart.forEach((line) => {
      if (!groups.has(line.shopId)) {
        groups.set(line.shopId, {
          shopId: line.shopId,
          shopDiscounts: [],
          itemProducts: []
        });
      }
      groups.get(line.shopId).itemProducts.push({
        price: line.price,
        quantity: line.quantity,
        productId: line.productId
      });
    });
    return Array.from(groups.values());
  }

  function currentCartId() {
    return state.cart.find((line) => line.cartId)?.cartId || "";
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }

  function handleAuthToggle(event) {
    const roleButton = event.target.closest("[data-auth-role]");
    if (roleButton) {
      state.auth.role = roleButton.dataset.authRole;
      renderAuthFields();
      return;
    }

    const modeButton = event.target.closest("[data-auth-mode]");
    if (modeButton) {
      state.auth.mode = modeButton.dataset.authMode;
      renderAuthFields();
    }
  }

  function renderAuthFields() {
    els.authTitle.textContent = state.auth.mode === "login" ? "Sign in" : "Create account";

    els.authForm.querySelectorAll("[data-auth-role]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authRole === state.auth.role);
    });
    els.authForm.querySelectorAll("[data-auth-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authMode === state.auth.mode);
    });

    const commonFields = `
      <label class="field">
        <span>Email</span>
        <input name="email" type="email" autocomplete="email" required>
      </label>
      <label class="field">
        <span>Password</span>
        <input name="password" type="password" autocomplete="current-password" required>
      </label>
    `;

    if (state.auth.mode === "login") {
      els.authFields.innerHTML = commonFields;
      return;
    }

    if (state.auth.role === "user") {
      els.authFields.innerHTML = `
        ${commonFields}
        <div class="form-row">
          <label class="field">
            <span>Name</span>
            <input name="name" autocomplete="name" required>
          </label>
          <label class="field">
            <span>Username</span>
            <input name="username" autocomplete="username">
          </label>
        </div>
        <div class="form-row">
          <label class="field">
            <span>Phone</span>
            <input name="phone" autocomplete="tel">
          </label>
          <label class="field">
            <span>Date of birth</span>
            <input name="dateOfBirth" type="date">
          </label>
        </div>
        <label class="field">
          <span>Address</span>
          <input name="address" autocomplete="street-address">
        </label>
      `;
      return;
    }

    els.authFields.innerHTML = `
      ${commonFields}
      <div class="form-row">
        <label class="field">
          <span>Shop name</span>
          <input name="name" required>
        </label>
        <label class="field">
          <span>Business name</span>
          <input name="businessName" required>
        </label>
      </div>
      <div class="form-row">
        <label class="field">
          <span>Business type</span>
          <input name="businessType" required>
        </label>
        <label class="field">
          <span>Username</span>
          <input name="username">
        </label>
      </div>
      <label class="field">
        <span>Business address</span>
        <input name="businessAddress">
      </label>
      <label class="field">
        <span>Phone</span>
        <input name="phone" autocomplete="tel">
      </label>
    `;
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    els.authOutput.textContent = "Submitting...";
    const formData = new FormData(els.authForm);
    const body = cleanObject(Object.fromEntries(formData.entries()));
    const isUser = state.auth.role === "user";
    const isLogin = state.auth.mode === "login";
    const endpoint = isLogin
      ? isUser
        ? "/loginManual"
        : "/login"
      : isUser
        ? "/user/registerManual"
        : "/register";

    if (isLogin) {
      body.deviceId = getDeviceId();
      body.deviceName = "Web storefront";
      body.userAgent = navigator.userAgent;
    }

    if (!isLogin && isUser) {
      body.language = "en";
      body.currency = "USD";
      body.theme = "light";
      if (!body.dateOfBirth) delete body.dateOfBirth;
    }

    if (!isLogin && !isUser) {
      body.language = "en";
      body.currency = "USD";
      body.theme = "light";
    }

    try {
      const data = await apiFetch(endpoint, { method: "POST", body, token: null });
      storeSession(data, isUser ? "USER" : "SHOP");
      els.authOutput.textContent = "Signed in";
      els.authDialog.close();
      renderAll();
      if (state.session.role === "USER") syncCartFromBackend();
    } catch (error) {
      els.authOutput.textContent = error.message;
    }
  }

  function storeSession(data, fallbackRole) {
    const tokenPayload = decodeJwtPayload(data?.accessToken);
    const actor = data?.user || data?.shop || data?.account || {};
    state.session = {
      role: tokenPayload.role || fallbackRole,
      accountId: actor.id || data?.userId || data?.shopId || tokenPayload.accountId || "",
      email: tokenPayload.email || data?.email || "",
      deviceId: tokenPayload.deviceId || getDeviceId(),
      accessToken: data?.accessToken || "",
      refreshToken: data?.refreshToken || ""
    };
    persistState();
  }

  async function logout() {
    const token = state.session?.accessToken;
    state.session = null;
    persistState();
    renderAll();
    if (!token) return;

    try {
      await apiFetch("/logout", { method: "POST", token });
    } catch (error) {
      setStatus("Signed out locally: " + error.message, "offline");
    }
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    if (!requireShopSession()) return;

    const formData = new FormData(els.productForm);
    const data = cleanObject(Object.fromEntries(formData.entries()));
    const image = data.image || "";
    const payload = {
      spu: {
        name: data.name,
        intro: data.intro,
        brandId: data.brandId,
        categoryId: data.categoryId,
        images: image ? [image] : [],
        isMarketable: Boolean(formData.get("isMarketable")),
        status: Boolean(formData.get("isMarketable")) ? 1 : 0
      },
      sku: {
        name: data.skuName,
        price: Number(data.price),
        stock: Number(data.stock || 0),
        image,
        images: image ? [image] : [],
        attributes: data.attributes || "",
        status: 1
      }
    };

    els.sellerOutput.textContent = "Submitting...";
    try {
      const result = await apiFetch("/product/create_product", { method: "POST", body: payload });
      els.sellerOutput.textContent = JSON.stringify(result, null, 2);
      loadProducts();
    } catch (error) {
      els.sellerOutput.textContent = error.message;
    }
  }

  async function handleBrandSubmit(event) {
    event.preventDefault();
    if (!requireShopSession()) return;

    const formData = new FormData(els.brandForm);
    const data = cleanObject(Object.fromEntries(formData.entries()));
    const payload = {
      name: data.name,
      image: data.image || "",
      initial: data.initial || data.name.slice(0, 1).toUpperCase(),
      sort: Number(data.sort || 10)
    };

    els.sellerOutput.textContent = "Submitting...";
    try {
      const result = await apiFetch("/product/create_brand", { method: "POST", body: payload });
      els.sellerOutput.textContent = JSON.stringify(result, null, 2);
    } catch (error) {
      els.sellerOutput.textContent = error.message;
    }
  }

  function requireShopSession() {
    if (state.session?.role === "SHOP") return true;
    els.sellerOutput.textContent = "Shop session required.";
    return false;
  }

  function setView(view) {
    document.querySelectorAll(".view").forEach((element) => {
      element.classList.toggle("is-active", element.id === "view-" + view);
    });
    document.querySelectorAll(".nav-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });
    history.replaceState(null, "", "#" + view);
  }

  function setStatus(message, kind) {
    state.status = { message, kind };
    renderStatus();
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
  }

  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = "web-" + cryptoRandom();
      localStorage.setItem(DEVICE_KEY, deviceId);
    }
    return deviceId;
  }

  function cryptoRandom() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function decodeJwtPayload(token) {
    if (!token || typeof token !== "string" || token.split(".").length < 2) return {};
    try {
      const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch (error) {
      return {};
    }
  }

  function cleanObject(object) {
    return Object.fromEntries(
      Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== "")
    );
  }

  function stripHtml(value) {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function formatMoney(value) {
    const raw = toNumber(value);
    const normalized = raw > 9999 ? raw / 100 : raw;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: normalized % 1 ? 2 : 0
    }).format(normalized);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
})();
