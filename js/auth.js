(() => {
  const api = new ApiClient();

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setRegisterError(message) {
    const el = document.getElementById("registerError");
    if (!el) return;
    el.textContent = message || "";
  }

  function clearFieldErrors() {
    document.querySelectorAll(".field.error").forEach((field) => {
      field.classList.remove("error");
    });
    document.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
    });
  }

  function setFieldError(fieldId, message) {
    if (!fieldId) return;
    const input = document.getElementById(fieldId);
    if (!input) return;
    const field = input.closest(".field");
    if (field) field.classList.add("error");
    const errorEl = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (errorEl) errorEl.textContent = message || "Dato invalido";
  }

  function applyServerErrors(errors) {
    if (!Array.isArray(errors)) return false;
    let applied = false;
    errors.forEach((issue) => {
      const path = Array.isArray(issue?.path) ? issue.path[0] : issue?.path;
      const message = issue?.message || "Dato invalido";
      if (path) {
        setFieldError(String(path), message);
        applied = true;
      }
    });
    return applied;
  }

  function persistUserFromResponse(data, fallbackName) {
    const user =
      data?.user || data?.data?.user || data?.profile || data?.account || null;
    const name = user?.name || data?.name || fallbackName;
    if (name) {
      localStorage.setItem("user", JSON.stringify({ ...(user || {}), name }));
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const email = getValue("email");
    const password = getValue("password");

    try {
      const data = await api.post("/auth/login", { email, password });
      if (data?.token) {
        localStorage.setItem("token", data.token);
        const nameFromEmail = email.split("@")[0] || "Usuario";
        persistUserFromResponse(data, nameFromEmail);
        window.location.href = "Inicio.html";
      }
    } catch (err) {
      if (err?.status === 401) {
        alert("Contraseña incorrecta");
        return;
      }
      alert(window.getErrorMessage(err, "Credenciales invalidas"));
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    clearFieldErrors();
    const businessName =
      getValue("business_name") || getValue("businessName") || getValue("negocio");
    const name = getValue("name") || getValue("full_name") || getValue("nombre");
    const phone = getValue("phone");
    const email = getValue("email");
    const password = getValue("password");
    const passwordConfirm = getValue("password_confirm");

    if (phone && phone.replace(/\D/g, "").length < 10) {
      setFieldError("phone", "El telefono debe tener al menos 10 digitos");
      return;
    }

    if (password && password.length < 8) {
      setFieldError("password", "La contrasena debe tener al menos 8 caracteres");
      return;
    }

    if (passwordConfirm && password !== passwordConfirm) {
      setFieldError("password_confirm", "Las contrasenas no coinciden");
      return;
    }

    try {
      setRegisterError("");
      const data = await api.post("/auth/register", {
        business_name: businessName,
        name,
        email,
        phone,
        password,
      });
      if (data?.token) {
        localStorage.setItem("token", data.token);
        persistUserFromResponse(data, name || email.split("@")[0] || "Usuario");
        window.location.href = "Inicio.html";
      }
    } catch (err) {
      const message = window.getErrorMessage(err, "No se pudo registrar");
      const hasFieldErrors = applyServerErrors(err?.data?.errors);
      if (!hasFieldErrors) {
        setRegisterError(message);
      }
      if (window.AppUI?.showToast) {
        window.AppUI.showToast(message, "error");
      } else {
        alert(message);
      }
    }
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  } else {
    document.getElementById("loginButton")?.addEventListener("click", handleLogin);
  }

  async function handleForgotPassword(event) {
    event?.preventDefault?.();
    const email = getValue("email") || prompt("Ingresa tu correo");
    if (!email) return;
    try {
      await api.post("/auth/forgot-password", { email });
      alert("Si el correo existe, te enviaremos un enlace de recuperacion.");
    } catch (err) {
      alert(window.getErrorMessage(err, "No se pudo enviar el correo de recuperacion."));
    }
  }

  document
    .getElementById("forgotPassword")
    ?.addEventListener("click", handleForgotPassword);

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  } else {
    document
      .getElementById("registerButton")
      ?.addEventListener("click", handleRegister);
  }
})();
