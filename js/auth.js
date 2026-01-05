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
    const businessName =
      getValue("business_name") || getValue("businessName") || getValue("negocio");
    const name = getValue("name") || getValue("full_name") || getValue("nombre");
    const phone = getValue("phone");
    const email = getValue("email");
    const password = getValue("password");
    const passwordConfirm = getValue("password_confirm");

    if (phone && phone.replace(/\D/g, "").length < 10) {
      alert("El telefono debe tener al menos 10 digitos");
      return;
    }

    if (password && password.length < 8) {
      alert("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    if (passwordConfirm && password !== passwordConfirm) {
      alert("Las contrasenas no coinciden");
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
      setRegisterError(message);
      alert(message);
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
