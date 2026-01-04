class ApiClient {
  constructor(baseUrl) {
    this.baseUrl =
      baseUrl || window.API_BASE_URL || "https://api.lotosproductions.com/api";
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

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

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
