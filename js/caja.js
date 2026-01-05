(() => {
  console.log(" Frontend conectado a la API en Railway");
  const api = new ApiClient();
  const catalogBody = document.querySelector("#tablaCatalogo tbody");
  const cartBody = document.querySelector("#tablaCarrito tbody");
  const totalEl = document.getElementById("total");
  const payBtn = document.getElementById("btnCobrar");
  const backdrop = document.getElementById("backdrop");
  const closeBtn = document.getElementById("cerrar");
  const cancelBtn = document.getElementById("cancelar");
  const confirmBtn = document.getElementById("confirmar");
  const mTotal = document.getElementById("mTotal");
  const mRecibido = document.getElementById("mRecibido");

  let catalog = [];
  let cart = [];

  function formatMoney(amount) {
    const value = Number(amount || 0);
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  }

  function computeTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function renderCatalog() {
    if (!catalogBody) return;
    catalogBody.innerHTML = "";

    catalog.forEach((product) => {
      const tr = document.createElement("tr");
      const price = formatMoney(product.price || 0);
      const stock = product.stock ?? 0;
      tr.innerHTML = `
        <td>${product.name || ""}</td>
        <td>${product.category || "-"}</td>
        <td>${price}</td>
        <td>
          <button class="btn-sm">Agregar</button>
        </td>
      `;
      tr.querySelector("button")?.addEventListener("click", () => {
        addToCart(product);
      });
      catalogBody.appendChild(tr);
    });
  }

  function renderCart() {
    if (!cartBody) return;
    cartBody.innerHTML = "";

    cart.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.name} x${item.quantity}</td>
        <td>${formatMoney(item.price * item.quantity)}</td>
        <td><button class="btn-sm">Quitar</button></td>
      `;
      tr.querySelector("button")?.addEventListener("click", () => {
        removeFromCart(item.productId);
      });
      cartBody.appendChild(tr);
    });

    if (totalEl) {
      totalEl.textContent = formatMoney(computeTotal());
    }
  }

  function addToCart(product) {
    const productId = product._id || product.id;
    if (!productId) return;

    const existing = cart.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId,
        name: product.name,
        price: product.price ?? 0,
        quantity: 1,
      });
    }
    renderCart();
  }

  function removeFromCart(productId) {
    cart = cart.filter((item) => item.productId !== productId);
    renderCart();
  }

  function parseAmount(value) {
    if (!value) return 0;
    const normalized = value.replace(/[^0-9.]/g, "");
    if (!normalized) return 0;
    const amount = Number.parseFloat(normalized);
    if (Number.isNaN(amount)) return 0;
    return amount;
  }

  function openPayModal() {
    if (!backdrop) {
      handlePay();
      return;
    }
    if (mTotal) mTotal.textContent = formatMoney(computeTotal());
    if (mRecibido) mRecibido.value = "";
    backdrop.style.display = "flex";
  }

  function closePayModal() {
    if (backdrop) backdrop.style.display = "none";
  }

  async function handlePay() {
    if (!cart.length) {
      alert("Carrito vacio");
      return;
    }

    const raw = mRecibido?.value || prompt("Monto recibido");
    const amountPaid = parseAmount(String(raw || ""));
    if (amountPaid <= 0) {
      alert("Ingresa un monto recibido valido");
      return;
    }

    try {
      const total = computeTotal();
      const sale = await api.post("/sales", {
        items: cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        amount_paid: amountPaid,
        total,
      });

      const saleTotal = sale?.total ?? total;
      const changeData = await api.post("/sales/change", {
        total: saleTotal,
        monto_recibido: amountPaid,
      });
      const changeAmount = changeData?.cambio ?? 0;
      const changeEl = document.getElementById("mCambio");
      if (changeEl) {
        changeEl.textContent = formatMoney(changeAmount);
      } else {
        alert(`Cambio: ${formatMoney(changeAmount)}`);
      }

      cart = [];
      renderCart();
      closePayModal();
    } catch (err) {
      if (err?.status === 409) {
        alert("Stock insuficiente");
        return;
      }
      alert(window.getErrorMessage(err, "No se pudo procesar la venta"));
    }
  }

  async function loadProducts() {
    try {
      console.log("Cargando catalogo de caja...");
      const data = await api.get("/inventory");
      catalog = Array.isArray(data) ? data : [];
      renderCatalog();
    } catch (err) {
      const message = window.getErrorMessage(err, "No se pudieron cargar productos");
      if (window.AppUI?.showToast) {
        window.AppUI.showToast(message, "error");
      } else {
        alert(message);
      }
    }
  }

  payBtn?.addEventListener("click", openPayModal);
  confirmBtn?.addEventListener("click", handlePay);
  closeBtn?.addEventListener("click", closePayModal);
  cancelBtn?.addEventListener("click", closePayModal);
  backdrop?.addEventListener("click", (event) => {
    if (event.target === backdrop) closePayModal();
  });

  loadProducts();
})();
