(() => {
  const api = new ApiClient();
  const tableBody = document.querySelector("#tablaItems tbody");
  const titleEl = document.getElementById("tituloLista");
  const tabServicios = document.getElementById("tabServicios");
  const tabArticulos = document.getElementById("tabArticulos");
  const addBtn = document.getElementById("btnAgregar");
  const modal = document.getElementById("productBackdrop");
  const form = document.getElementById("productForm");
  const modalTitle = document.getElementById("productModalTitle");
  const closeBtn = document.getElementById("productClose");
  const cancelBtn = document.getElementById("productCancel");
  const nameInput = document.getElementById("productName");
  const categorySelect = document.getElementById("productCategory");
  const priceInput = document.getElementById("productPrice");
  const stockInput = document.getElementById("productStock");

  let mode = "servicios";
  let products = [];
  let editingId = null;

  const CATEGORY_OPTIONS = ["Servicio", "Producto", "Accesorio", "Insumo"];

  function formatMoney(amount) {
    const value = Number(amount || 0);
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  }

  function normalizeCategory(category) {
    return String(category || "").toLowerCase();
  }

  function isService(product) {
    const category = normalizeCategory(product.category);
    return category.includes("servicio");
  }

  function getFilteredProducts() {
    return products.filter((product) =>
      mode === "servicios" ? isService(product) : !isService(product)
    );
  }

  function render() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    if (titleEl) {
      titleEl.textContent = mode === "servicios" ? "Servicios" : "Articulos";
    }

    const list = getFilteredProducts();
    list.forEach((product) => {
      const tr = document.createElement("tr");
      const stock = Number.isFinite(product.stock) ? product.stock : "-";
      tr.innerHTML = `
        <td>${product.name || ""}</td>
        <td>${product.category || "-"}</td>
        <td>${formatMoney(product.price || 0)}</td>
        <td>${stock}</td>
        <td>
          <button class="btn-sm" data-edit="${product._id}">Editar</button>
          <button class="btn-sm" data-del="${product._id}">Eliminar</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit");
        const product = products.find((item) => item._id === id);
        if (product) {
          openModal(product);
        }
      });
    });

    tableBody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        const product = products.find((item) => item._id === id);
        if (product) {
          handleDelete(product);
        }
      });
    });
  }

  function toNumber(value, fallback) {
    const num = Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isNaN(num) ? fallback : num;
  }

  function normalizeCategoryChoice(value, fallback) {
    if (!value) return fallback;
    const match = CATEGORY_OPTIONS.find(
      (option) => option.toLowerCase() === value.toLowerCase()
    );
    return match || fallback;
  }

  function openModal(product) {
    if (!modal || !form) return;
    const defaultCategory = mode === "servicios" ? "Servicio" : "Producto";
    const isEdit = Boolean(product);
    editingId = isEdit ? product._id : null;
    if (modalTitle) {
      modalTitle.textContent = isEdit ? "Editar producto" : "Nuevo producto";
    }
    if (nameInput) nameInput.value = product?.name || "";
    if (categorySelect) {
      categorySelect.value = normalizeCategoryChoice(
        product?.category,
        defaultCategory
      );
    }
    if (priceInput) priceInput.value = product?.price ?? "";
    if (stockInput) stockInput.value = product?.stock ?? "";
    modal.style.display = "flex";
  }

  function closeModal() {
    if (!modal || !form) return;
    modal.style.display = "none";
    form.reset();
    editingId = null;
  }

  async function handleSubmit(event) {
    event?.preventDefault?.();
    const defaultCategory = mode === "servicios" ? "Servicio" : "Producto";
    const name = nameInput?.value?.trim();
    if (!name) {
      alert("Nombre requerido");
      return;
    }

    const category = normalizeCategoryChoice(
      categorySelect?.value,
      defaultCategory
    );
    const price = toNumber(priceInput?.value, 0);
    const stockDefault = mode === "servicios" ? 0 : 1;
    const stock = Math.max(
      0,
      Math.round(toNumber(stockInput?.value, stockDefault))
    );

    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, {
          name,
          category,
          price,
          stock,
        });
      } else {
        await api.post("/products", {
          name,
          category,
          price,
          stock,
        });
      }
      await loadProducts();
      closeModal();
    } catch (err) {
      alert(
        window.getErrorMessage(
          err,
          editingId
            ? "No se pudo actualizar el producto"
            : "No se pudo agregar el producto"
        )
      );
    }
  }

  function enforcePriceFormat() {
    if (!priceInput) return;
    let value = priceInput.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join("")}`;
    }
    if (parts[1]) {
      parts[1] = parts[1].slice(0, 2);
      value = `${parts[0]}.${parts[1]}`;
    }
    priceInput.value = value;
  }

  async function handleDelete(product) {
    const ok = confirm(`Eliminar ${product.name || "producto"}?`);
    if (!ok) return;
    try {
      await api.delete(`/products/${product._id}`);
      await loadProducts();
    } catch (err) {
      alert(window.getErrorMessage(err, "No se pudo eliminar el producto"));
    }
  }

  async function loadProducts() {
    try {
      const data = await api.get("/products");
      products = Array.isArray(data) ? data : [];
      render();
    } catch (err) {
      alert(window.getErrorMessage(err, "No se pudieron cargar productos"));
    }
  }

  tabServicios?.addEventListener("click", () => {
    mode = "servicios";
    tabServicios.classList.add("active");
    tabArticulos?.classList.remove("active");
    render();
  });

  tabArticulos?.addEventListener("click", () => {
    mode = "articulos";
    tabArticulos.classList.add("active");
    tabServicios?.classList.remove("active");
    render();
  });

  addBtn?.addEventListener("click", () => openModal());
  form?.addEventListener("submit", handleSubmit);
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  priceInput?.addEventListener("input", enforcePriceFormat);

  loadProducts();
})();
