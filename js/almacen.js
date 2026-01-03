(() => {
  const api = new ApiClient();
  const tableBody = document.querySelector("#tablaItems tbody");
  const titleEl = document.getElementById("tituloLista");
  const tabServicios = document.getElementById("tabServicios");
  const tabArticulos = document.getElementById("tabArticulos");
  const addBtn = document.getElementById("btnAgregar");

  let mode = "servicios";
  let products = [];

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
          handleEdit(product);
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

  async function handleAdd() {
    const defaultCategory = mode === "servicios" ? "Servicios" : "Productos";
    const name = prompt("Nombre del producto/servicio");
    if (!name) return;

    const category = prompt("Categoria", defaultCategory) || defaultCategory;
    const price = toNumber(prompt("Precio"), 0);
    const stockDefault = mode === "servicios" ? 0 : 1;
    const stock = Math.max(0, Math.round(toNumber(prompt("Stock"), stockDefault)));

    try {
      await api.post("/products", {
        name: name.trim(),
        category: category.trim(),
        price,
        stock,
      });
      await loadProducts();
    } catch (err) {
      alert("No se pudo agregar el producto");
    }
  }

  async function handleEdit(product) {
    const name = prompt("Nombre", product.name || "") || product.name || "";
    const category =
      prompt("Categoria", product.category || "") || product.category || "";
    const price = toNumber(prompt("Precio", product.price), product.price || 0);
    const stock = Math.max(
      0,
      Math.round(toNumber(prompt("Stock", product.stock), product.stock || 0))
    );

    const updates = {
      name: name.trim(),
      category: category.trim(),
      price,
      stock,
    };

    try {
      await api.patch(`/products/${product._id}`, updates);
      await loadProducts();
    } catch (err) {
      alert("No se pudo actualizar el producto");
    }
  }

  async function handleDelete(product) {
    const ok = confirm(`Eliminar ${product.name || "producto"}?`);
    if (!ok) return;
    try {
      await api.delete(`/products/${product._id}`);
      await loadProducts();
    } catch (err) {
      alert("No se pudo eliminar el producto");
    }
  }

  async function loadProducts() {
    try {
      const data = await api.get("/products");
      products = Array.isArray(data) ? data : [];
      render();
    } catch (err) {
      alert("No se pudieron cargar productos");
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

  addBtn?.addEventListener("click", handleAdd);

  loadProducts();
})();