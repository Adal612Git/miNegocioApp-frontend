// Marca el menú activo según el archivo actual
(function(){
  const path = location.pathname.split("/").pop();
  document.querySelectorAll(".nav a").forEach(a=>{
    if(a.getAttribute("href") === path) a.classList.add("active");
  });

  function getStoredUser() {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function getUserName() {
    const user = getStoredUser();
    return user?.name || "";
  }

  function setSideUserName() {
    const name = getUserName();
    const el = document.querySelector(".side-user .name");
    if (el && name) {
      el.textContent = name;
    }
  }

  window.AppUI = {
    getUserName,
    setSideUserName,
  };

  setSideUserName();
})();
