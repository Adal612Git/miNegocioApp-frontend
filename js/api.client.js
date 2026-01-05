class ApiClient {
  constructor(baseUrl) {
    let resolved =
      baseUrl || window.API_BASE_URL || "https://api.lotosproductions.com";
    resolved = String(resolved || "").replace(/\/+$/, "");
    if (!resolved.endsWith("/api")) {
      resolved = `${resolved}/api`;
    }
    this.baseUrl = resolved;
    console.log(" Frontend conectado a la API en Railway");
  }

  getToken() {
    return localStorage.getItem("token");
  }

  async request(path, options) {
    const headers = new Headers(options?.headers || {});
    headers.set("Content-Type", "application/json");

    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response = null;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
      });
    } catch (err) {
      const message = "Error de red. Verifica tu conexion.";
      if (window.AppUI?.showToast) {
        window.AppUI.showToast(message, "error");
      } else {
        alert(message);
      }
      const error = new Error(message);
      error.status = 0;
      throw error;
    }

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return null;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(data?.message || "REQUEST_FAILED");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  get(path) {
    return this.request(path, { method: "GET" });
  }

  post(path, body) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(body || {}),
    });
  }

  patch(path, body) {
    return this.request(path, {
      method: "PATCH",
      body: JSON.stringify(body || {}),
    });
  }

  delete(path) {
    return this.request(path, { method: "DELETE" });
  }
}

window.ApiClient = ApiClient;
window.getErrorMessage = function getErrorMessage(err, fallback) {
  return err?.data?.message || err?.message || fallback || "REQUEST_FAILED";
};
