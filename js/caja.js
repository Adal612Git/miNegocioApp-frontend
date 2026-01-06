(() => {
  console.log(" Frontend conectado a la API en Railway");
  const api = new ApiClient();
  const catalogBody = document.querySelector("#tablaCatalogo tbody");
  const cartBody = document.querySelector("#tablaCarrito tbody");
  const totalEl = document.getElementById("total");
  const payBtn = document.getElementById("btnCobrar");
  const payModal = document.getElementById("modalCobro");
  const posClose = document.getElementById("posClose");
  const posCancel = document.getElementById("posCancel");
  const posConfirm = document.getElementById("posConfirm");
  const posTotal = document.getElementById("posTotal");
  const posAmount = document.getElementById("posMontoRecibido");
  const posChange = document.getElementById("posCambio");
  const posKeypad = document.getElementById("posKeypad");

  let catalog = [];
  let cart = [];
  let amountInput = "";

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

  function updatePosDisplay() {
    const total = computeTotal();
    const amount = parseAmount(amountInput);
    if (posTotal) posTotal.textContent = formatMoney(total);
    if (posAmount) posAmount.textContent = formatMoney(amount);
    if (posChange) {
      posChange.textContent = formatMoney(Math.max(amount - total, 0));
    }
  }

  function appendDigit(digit) {
    if (!digit) return;
    if (amountInput === "0") {
      amountInput = digit;
    } else {
      amountInput += digit;
    }
    updatePosDisplay();
  }

  function clearAmount() {
    amountInput = "";
    updatePosDisplay();
  }

  function removeLastDigit() {
    amountInput = amountInput.slice(0, -1);
    updatePosDisplay();
  }

  function openPayModal() {
    if (!cart.length) {
      alert("Carrito vacio");
      return;
    }
    amountInput = "";
    updatePosDisplay();
    if (payModal) payModal.style.display = "flex";
  }

  function closePayModal() {
    if (payModal) payModal.style.display = "none";
  }

  async function handlePay() {
    const amountPaid = parseAmount(amountInput);
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
      if (posChange) posChange.textContent = formatMoney(changeAmount);
      if (window.AppUI?.showToast) {
        window.AppUI.showToast(`Cambio: ${formatMoney(changeAmount)}`);
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
  posConfirm?.addEventListener("click", handlePay);
  posClose?.addEventListener("click", closePayModal);
  posCancel?.addEventListener("click", closePayModal);
  posKeypad?.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");
    if (!button) return;
    const digit = button.getAttribute("data-key");
    const action = button.getAttribute("data-action");
    if (digit) {
      appendDigit(digit);
      return;
    }
    if (action === "clear") {
      clearAmount();
      return;
    }
    if (action === "back") {
      removeLastDigit();
    }
  });
  payModal?.addEventListener("click", (event) => {
    if (event.target === payModal) closePayModal();
  });

  loadProducts();
})();
